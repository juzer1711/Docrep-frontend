import Dexie from "dexie";

// Base de datos local. Es la fuente de verdad para la UI: la interfaz
// siempre lee de aquí (nunca directo del servidor), y es el syncManager
// quien concilia esto con la API cuando hay red.
export const db = new Dexie("custodia_facturas_db");

db.version(1).stores({
  // Cola de acciones pendientes de enviar al backend.
  // uuid es la clave de idempotencia: se genera en el cliente y se usa
  // para reconocer si una acción ya se aplicó, evitando duplicados si
  // se pierde la respuesta del servidor a mitad de una sincronización.
  outbox: "uuid, tipo_accion, factura_id_local, estado, creado_en",

  // Copia local de las facturas conocidas, para que el Dashboard y el
  // Detalle funcionen sin conexión. Se actualiza con cada GET exitoso
  // y con cada acción que se aplica (local u optimista).
  facturasCache: "id, numero_factura, proveedor, estado_factura, actualizado_en"
});

export const TIPOS_ACCION = {
  CREAR_FACTURA: "CREAR_FACTURA",
  REVISAR: "REVISAR",
  ENTREGAR_ADMIN: "ENTREGAR_ADMIN",
  NOVEDAD: "NOVEDAD",
  FINALIZAR: "FINALIZAR"
};

export const ESTADO_ACCION = {
  PENDIENTE: "pendiente",
  SINCRONIZANDO: "sincronizando",
  ERROR: "error"
};

export function generarUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  // Fallback para navegadores/webviews sin crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function encolarAccion({ tipo_accion, factura_id_local, factura_id_servidor = null, payload, archivos = {} }) {
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
