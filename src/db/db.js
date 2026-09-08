import Dexie from "dexie";

// Base de datos local. Es la fuente de verdad para la UI: la interfaz
// siempre lee de aquí (nunca directo del servidor), y el syncManager
// quien concilia esto con la API cuando hay red.

export const db = new Dexie("custodia_facturas_db");

// V2:
// tabla para conservar el vínculo entre el ID temporal generado
// cuando una factura nace offline y el ID real que Oracle devuelve
// al crearla.
//
// Esto evita perder las acciones dependientes (revisar, entregar,
// novedad, finalizar) cuando la factura deja de usar su ID temporal.

db.version(2).stores({
  outbox:
    "uuid, tipo_accion, factura_id_local, factura_id_servidor, estado, creado_en",

  facturasCache:
    "id, numero_factura, proveedor, estado_factura, actualizado_en",

  facturaIdMap:
    "factura_id_local, factura_id_servidor"
});

export const TIPOS_ACCION = {

  // Factura
  CREAR_FACTURA: "CREAR_FACTURA",
  ACTUALIZAR_FACTURA: "ACTUALIZAR_FACTURA",
  ELIMINAR_FACTURA: "ELIMINAR_FACTURA",

  // Flujo de custodia
  REVISAR: "REVISAR",
  ENTREGAR_ADMIN: "ENTREGAR_ADMIN",
  FINALIZAR: "FINALIZAR",

  // Novedades
  NOVEDAD: "NOVEDAD",
  ACTUALIZAR_NOVEDAD: "ACTUALIZAR_NOVEDAD",
  ELIMINAR_NOVEDAD: "ELIMINAR_NOVEDAD"
};

export const ESTADO_ACCION = {
  PENDIENTE: "pendiente",
  SINCRONIZANDO: "sincronizando",
  ERROR: "error"
};

export function generarUUID() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback para navegadores/webviews sin crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v =
        c === "x"
          ? r
          : (r & 0x3) | 0x8;

      return v.toString(16);
    }
  );
}

export async function encolarAccion({
  tipo_accion,
  factura_id_local = null,
  factura_id_servidor = null,
  payload,
  archivos = {}
}) {
  const accion = {
    uuid: generarUUID(),

    tipo_accion,

    factura_id_local,

    factura_id_servidor,

    payload,

    archivos,

    estado: ESTADO_ACCION.PENDIENTE,

    intentos: 0,

    ultimo_error: null,

    creado_en: Date.now()
  };

  await db.outbox.add(accion);

  return accion;
}