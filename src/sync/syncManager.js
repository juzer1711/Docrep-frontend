import {
  db,
  TIPOS_ACCION,
  ESTADO_ACCION
} from "../db/db.js";

import { api } from "../api/axios.js";

import {
  ejecutarAccionRemota
} from "../api/facturasApi.js";

const INTERVALO_RESPALDO_MS = 20000;
const MAX_INTENTOS_ANTES_DE_PAUSAR = 5;

let procesando = false;

const listeners = new Set();

export function onSyncStatusChange(fn) {
  listeners.add(fn);

  return () =>
    listeners.delete(fn);
}

async function notificar() {
  const pendientes =
    await db.outbox
      .where("estado")
      .notEqual(
        ESTADO_ACCION.ERROR
      )
      .count();

  const conError =
    await db.outbox
      .where("estado")
      .equals(
        ESTADO_ACCION.ERROR
      )
      .count();

  listeners.forEach((fn) =>
    fn({
      pendientes,
      conError,
      sincronizando: procesando
    })
  );
}


// ============================================================
// DETECTAR SI LA CREACION YA EXISTE
// ============================================================

async function yaExisteEnServidor(
  numero_factura,
  proveedor
) {
  try {
    const { data } =
      await api.get("/");

    const facturas =
      Array.isArray(data?.facturas)
        ? data.facturas
        : Array.isArray(data)
          ? data
          : [];

    return facturas.find(
      (factura) =>
        (
          factura.NUMERO_FACTURA ??
          factura.numero_factura
        ) === numero_factura &&

        (
          factura.PROVEEDOR ??
          factura.proveedor
        ) === proveedor
    );
  } catch {
    return null;
  }
}


// ============================================================
// RESOLVER ID TEMPORAL -> ID ORACLE
// ============================================================

async function resolverIdServidor(
  accion
) {
  // Si la acción ya tiene guardado
  // el ID real de Oracle, lo usamos.
  if (accion.factura_id_servidor) {
    return accion.factura_id_servidor;
  }

  if (!accion.factura_id_local) {
    return null;
  }

  // Primero buscamos en la tabla específica
  // de mappings.
  const mapping =
    await db.facturaIdMap.get(
      accion.factura_id_local
    );

  if (
    mapping?.factura_id_servidor
  ) {
    return mapping.factura_id_servidor;
  }

  // Compatibilidad con facturas antiguas
  // que ya estuvieran sincronizadas.
  const cache =
    await db.facturasCache.get(
      accion.factura_id_local
    );

  if (
    cache?.sincronizada &&
    !String(cache.id).startsWith("tmp_")
  ) {
    return cache.id;
  }

  return null;
}


// ============================================================
// PROCESAR UNA ACCION
// ============================================================

async function procesarAccion(
  accion
) {
  await db.outbox.update(
    accion.uuid,
    {
      estado:
        ESTADO_ACCION.SINCRONIZANDO
    }
  );

  try {
    // ========================================================
    // CREAR FACTURA
    // ========================================================

    if (
      accion.tipo_accion ===
      TIPOS_ACCION.CREAR_FACTURA
    ) {
      const existente =
        await yaExisteEnServidor(
          accion.payload.numero_factura,
          accion.payload.proveedor
        );

      let idReal =
        existente?.id_factura ??
        existente?.ID_FACTURA ??
        existente?.id;

      // Si la factura ya existía en servidor,
      // conservamos su foto si está disponible.
      let urlFotoReal =
        existente?.url_foto ??
        existente?.URL_FOTO ??
        null;

      // ------------------------------------------------------
      // CREAR EN ORACLE
      // ------------------------------------------------------

      if (!idReal) {
        const form =
          new FormData();

        Object.entries(
          accion.payload
        ).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            form.append(k, v);
          }
        });

        // La firma se conserva como archivo lógico
        // dentro de la acción offline.
        if (
          accion.archivos?.firma_base64
        ) {
          form.append(
            "firma_base64",
            accion.archivos.firma_base64
          );
        }

        if (
          accion.archivos?.foto
        ) {
          form.append(
            "foto",
            accion.archivos.foto,
            accion.archivos.foto.name ||
              "factura.jpg"
          );
        }

        const { data } =
          await api.post(
            "/",
            form,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data"
              }
            }
          );

        idReal =
          data?.id_factura ??
          data?.ID_FACTURA ??
          data?.id;

        urlFotoReal =
          data?.url_foto ??
          data?.URL_FOTO ??
          null;
      }

      // ------------------------------------------------------
      // VALIDAR QUE ORACLE DEVOLVIO ID
      // ------------------------------------------------------

      if (!idReal) {
        throw new Error(
          "La creación de la factura no devolvió un ID válido."
        );
      }

      // ======================================================
      // PERSISTIR MAPEO
      // ======================================================

      // tmp_xxx -> 123
      //
      // Este mapping permite que las acciones que estaban
      // pendientes sobre la factura puedan continuar.
      await db.facturaIdMap.put({
        factura_id_local:
          accion.factura_id_local,

        factura_id_servidor:
          idReal,

        actualizado_en:
          Date.now()
      });

      // ======================================================
      // ACTUALIZAR CACHE
      // ======================================================

      if (
        accion.factura_id_local
      ) {
        await db.facturasCache.delete(
          accion.factura_id_local
        );
      }

      await db.facturasCache.put({
        id: idReal,

        numero_factura:
          accion.payload.numero_factura,

        proveedor:
          accion.payload.proveedor,

        estado_factura:
          "RECIBIDA",

        url_foto:
          urlFotoReal,

        sincronizada:
          true,

        actualizado_en:
          Date.now()
      });

    } else {
      // ========================================================
      // ACCIONES DEPENDIENTES DE UNA FACTURA
      // ========================================================

      /*
       * Aquí entran:
       *
       * REVISAR
       * ENTREGAR_ADMIN
       * FINALIZAR
       * NOVEDAD
       * ACTUALIZAR_NOVEDAD
       * ACTUALIZAR_FACTURA
       * ELIMINAR_FACTURA
       * ELIMINAR_NOVEDAD
       *
       * No necesitamos un if independiente para cada una.
       *
       * facturasApi.js se encarga de decidir qué endpoint
       * corresponde según tipo_accion.
       */

      const idReal =
        await resolverIdServidor(
          accion
        );

      if (!idReal) {
        // La factura padre todavía no existe
        // en Oracle.
        //
        // No es error de negocio.
        // Se deja pendiente para que el proceso
        // secuencial vuelva a intentar después
        // de CREAR_FACTURA.
        await db.outbox.update(
          accion.uuid,
          {
            estado:
              ESTADO_ACCION.PENDIENTE
          }
        );

        return;
      }

      await ejecutarAccionRemota({
        tipo_accion:
          accion.tipo_accion,

        facturaId:
          idReal,

        payload:
          accion.payload,

        archivos:
          accion.archivos
      });
    }

    // ========================================================
    // ACCION COMPLETADA
    // ========================================================

    await db.outbox.delete(
      accion.uuid
    );

  } catch (error) {
    const intentos =
      accion.intentos + 1;

    // --------------------------------------------------------
    // ERROR HTTP = ERROR DE NEGOCIO
    // --------------------------------------------------------

    const esErrorDeNegocio =
      !!error.response;

    await db.outbox.update(
      accion.uuid,
      {
        estado:
          intentos >=
            MAX_INTENTOS_ANTES_DE_PAUSAR ||
          esErrorDeNegocio
            ? ESTADO_ACCION.ERROR
            : ESTADO_ACCION.PENDIENTE,

        intentos,

        ultimo_error:
          esErrorDeNegocio
            ? (
                error.response?.data?.mensaje ||
                error.response?.data?.error ||
                "El servidor rechazó la acción."
              )
            : "Sin conexión, se reintentará automáticamente."
      }
    );
  }
}


// ============================================================
// PROCESAR OUTBOX
// ============================================================

export async function procesarOutbox() {
  if (
    procesando ||
    !navigator.onLine
  ) {
    return;
  }

  procesando = true;

  await notificar();

  try {
    const acciones =
      await db.outbox
        .where("estado")
        .notEqual(
          ESTADO_ACCION.ERROR
        )
        .sortBy("creado_en");

    // ========================================================
    // IMPORTANTE:
    // PROCESAMIENTO SECUENCIAL
    // ========================================================
    //
    // Ejemplo:
    //
    // CREAR
    //   ↓
    // REVISAR
    //   ↓
    // ENTREGAR_ADMIN
    //   ↓
    // FINALIZAR
    //
    // También permite:
    //
    // CREAR
    //   ↓
    // ACTUALIZAR_FACTURA
    //
    // o:
    //
    // CREAR
    //   ↓
    // NOVEDAD
    //   ↓
    // ACTUALIZAR_NOVEDAD
    //   ↓
    // ELIMINAR_NOVEDAD
    //
    // No se ejecutan acciones en paralelo.

    for (const accion of acciones) {
      if (!navigator.onLine) {
        break;
      }

      await procesarAccion(
        accion
      );
    }

  } finally {
    procesando = false;

    await notificar();
  }
}


// ============================================================
// REINTENTAR ERROR
// ============================================================

export async function reintentarAccionConError(
  uuid
) {
  await db.outbox.update(
    uuid,
    {
      estado:
        ESTADO_ACCION.PENDIENTE,

      intentos: 0,

      ultimo_error: null
    }
  );

  procesarOutbox();
}


// ============================================================
// INICIAR SYNC MANAGER
// ============================================================

export function startSyncManager() {
  window.addEventListener(
    "online",
    procesarOutbox
  );

  window.addEventListener(
    "focus",
    procesarOutbox
  );

  setInterval(
    procesarOutbox,
    INTERVALO_RESPALDO_MS
  );

  procesarOutbox();
}
