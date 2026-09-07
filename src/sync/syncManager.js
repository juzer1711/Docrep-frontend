import { db, TIPOS_ACCION, ESTADO_ACCION } from "../db/db.js";
import { api } from "../api/axios.js";
import { ejecutarAccionRemota } from "../api/facturasApi.js";

const INTERVALO_RESPALDO_MS = 20000; // por si el evento 'online' no dispara (pasa en algunos Android)
const MAX_INTENTOS_ANTES_DE_PAUSAR = 5;

let procesando = false;
const listeners = new Set();

export function onSyncStatusChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function notificar() {
  const pendientes = await db.outbox.where("estado").notEqual(ESTADO_ACCION.ERROR).count();
  const conError = await db.outbox.where("estado").equals(ESTADO_ACCION.ERROR).count();
  listeners.forEach((fn) => fn({ pendientes, conError, sincronizando: procesando }));
}

// Antes de reenviar una CREAR_FACTURA que quedó en 'sincronizando' sin
// confirmar respuesta (se cortó la señal justo ahí), verificamos si ya
// existe en el servidor por número + proveedor, para no duplicarla.
async function yaExisteEnServidor(numero_factura, proveedor) {
  try {
    const { data } = await api.get("/");
    const facturas = Array.isArray(data?.facturas)
      ? data.facturas
      : Array.isArray(data)
        ? data
        : [];
    return facturas.find(
      (factura) =>
        (factura.NUMERO_FACTURA ?? factura.numero_factura) === numero_factura &&
        (factura.PROVEEDOR ?? factura.proveedor) === proveedor
    );
  } catch {
    return null;
  }
}

async function resolverIdServidor(accion) {
  if (accion.factura_id_servidor) return accion.factura_id_servidor;
  // Depende de una CREAR_FACTURA que todavía no confirmó: buscamos si ya
  // se resolvió su mapeo local -> real en la caché.
  const cache = await db.facturasCache.get(accion.factura_id_local);
  if (cache && cache.sincronizada) return cache.id;
  return null;
}

async function procesarAccion(accion) {
  await db.outbox.update(accion.uuid, { estado: ESTADO_ACCION.SINCRONIZANDO });

  try {
    if (accion.tipo_accion === TIPOS_ACCION.CREAR_FACTURA) {
      const existente = await yaExisteEnServidor(accion.payload.numero_factura, accion.payload.proveedor);
      let idReal = existente?.id_factura ?? existente?.id;

      if (!idReal) {
        const form = new FormData();
        Object.entries(accion.payload).forEach(([k, v]) => form.append(k, v));
        form.append("firma_base64", accion.archivos.firma_base64);
        if (accion.archivos.foto) form.append("foto", accion.archivos.foto, accion.archivos.foto.name || "factura.jpg");
        const { data } = await api.post("/", form, { headers: { "Content-Type": "multipart/form-data" } });
        idReal = data.id_factura;
      }

      // Resuelve el mapeo: la caché local pasa de id temporal a id real,
      // para que las acciones dependientes (revisar, novedad...) puedan
      // encontrarlo la próxima pasada.
      await db.facturasCache.delete(accion.factura_id_local);
      await db.facturasCache.put({
        id: idReal,
        numero_factura: accion.payload.numero_factura,
        proveedor: accion.payload.proveedor,
        estado_factura: "RECIBIDA",
        sincronizada: true,
        actualizado_en: Date.now()
      });
    } else {
      const idReal = await resolverIdServidor(accion);
      if (!idReal) {
        // Su factura padre todavía no sincronizó: la dejamos pendiente
        // y se reintenta en la siguiente pasada, sin contar como error.
        await db.outbox.update(accion.uuid, { estado: ESTADO_ACCION.PENDIENTE });
        return;
      }
      await ejecutarAccionRemota({
        tipo_accion: accion.tipo_accion,
        facturaId: idReal,
        payload: accion.payload,
        archivos: accion.archivos
      });
    }

    await db.outbox.delete(accion.uuid);
  } catch (error) {
    const intentos = accion.intentos + 1;
    const esErrorDeNegocio = !!error.response; // 4xx/5xx del backend, no de red
    await db.outbox.update(accion.uuid, {
      estado: intentos >= MAX_INTENTOS_ANTES_DE_PAUSAR || esErrorDeNegocio ? ESTADO_ACCION.ERROR : ESTADO_ACCION.PENDIENTE,
      intentos,
      ultimo_error: esErrorDeNegocio
        ? error.response?.data?.mensaje || "El servidor rechazó la acción."
        : "Sin conexión, se reintentará automáticamente."
    });
  }
}

export async function procesarOutbox() {
  if (procesando || !navigator.onLine) return;
  procesando = true;
  await notificar();

  try {
    const acciones = await db.outbox
      .where("estado")
      .notEqual(ESTADO_ACCION.ERROR)
      .sortBy("creado_en");

    // Procesamiento secuencial (no en paralelo): el orden importa, porque
    // una NOVEDAD puede depender de la CREAR_FACTURA que va justo antes.
    for (const accion of acciones) {
      if (!navigator.onLine) break;
      await procesarAccion(accion);
    }
  } finally {
    procesando = false;
    await notificar();
  }
}

export async function reintentarAccionConError(uuid) {
  await db.outbox.update(uuid, { estado: ESTADO_ACCION.PENDIENTE, intentos: 0, ultimo_error: null });
  procesarOutbox();
}

export function startSyncManager() {
  window.addEventListener("online", procesarOutbox);
  window.addEventListener("focus", procesarOutbox);
  setInterval(procesarOutbox, INTERVALO_RESPALDO_MS);
  procesarOutbox();
}
