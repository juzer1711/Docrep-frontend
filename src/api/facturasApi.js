import imageCompression from "browser-image-compression";
import { api } from "./axios.js";
import { db, TIPOS_ACCION, encolarAccion, generarUUID } from "../db/db.js";

const OPCIONES_COMPRESION = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1600,
  useWebWorker: true
};

// Distingue "no hay red / el servidor no respondió" de "el servidor
// respondió con un error de negocio" (ej. 409 por estado inválido).
// Solo el primer caso debe encolarse; el segundo debe mostrarse al
// usuario de inmediato, porque reintentarlo no lo va a arreglar.
function esFallaDeRed(error) {
  return !error.response || !navigator.onLine;
}

async function comprimirFoto(foto) {
  if (!foto) return null;
  try {
    return await imageCompression(foto, OPCIONES_COMPRESION);
  } catch {
    // Si la compresión falla (formato raro, etc.) seguimos con el original
    // antes que bloquear el registro completo de la factura.
    return foto;
  }
}

function idTemporal() {
  return `tmp_${generarUUID()}`;
}

async function actualizarCache(factura) {
  await db.facturasCache.put({ ...factura, actualizado_en: Date.now() });
}

function mapearFactura(factura) {
  if (!factura) return factura;
  return {
    ...factura,
    id: factura.ID_FACTURA ?? factura.id_factura ?? factura.id,
    numero_factura: factura.NUMERO_FACTURA ?? factura.numero_factura,
    proveedor: factura.PROVEEDOR ?? factura.proveedor,
    estado_factura: factura.ESTADO ?? factura.estado_factura ?? factura.estado,
    fecha_recepcion: factura.FECHA_RECEPCION ?? factura.fecha_recepcion,
    usuario_recepcion: factura.USUARIO_RECEPCION ?? factura.ID_USUARIO_RECEPCION ?? factura.id_usuario_recepcion,
    total_novedades: factura.TOTAL_NOVEDADES ?? factura.total_novedades ?? 0
  };
}

function mapearDetalle(data) {
  return {
    ...data,
    factura: mapearFactura(data.factura),
    firmas: (data.firmas || []).map((f) => ({ ...f, etapa: f.TIPO_ETAPA ?? f.etapa, id_usuario: f.ID_USUARIO ?? f.id_usuario, usuario_nombre: f.USUARIO_NOMBRE ?? f.usuario_nombre, firma_base64: f.FIRMA_BASE64 ?? f.firma_base64 })),
    novedades: (data.novedades || []).map((n) => ({ ...n, codigo_referencia: n.CODIGO_REFERENCIA ?? n.codigo_referencia, descripcion_producto: n.DESCRIPCION_PRODUCTO ?? n.descripcion_producto, tipo_novedad: n.TIPO_NOVEDAD ?? n.tipo_novedad, cantidad: n.CANTIDAD ?? n.cantidad, observaciones: n.OBSERVACIONES ?? n.observaciones }))
  };
}

// ---------- Listado / detalle (lectura) ----------

export async function listarFacturas() {
  try {
    const { data } = await api.get("/");
    const facturas = (data.facturas || data).map(mapearFactura);
    for (const f of facturas) await actualizarCache(f);
    return facturas;
  } catch (error) {
    if (!esFallaDeRed(error)) throw error;
    // Sin red: servimos lo último que se conoce localmente.
    return db.facturasCache.orderBy("actualizado_en").reverse().toArray();
  }
}

export async function obtenerFactura(id) {
  try {
    const { data } = await api.get(`/${id}`);
    const detalle = mapearDetalle(data);
    await actualizarCache(detalle.factura);
    return detalle;
  } catch (error) {
    if (!esFallaDeRed(error)) throw error;
    const cache = await db.facturasCache.get(id);
    if (!cache) throw new Error("Esta factura no está disponible sin conexión todavía.");
    return { factura: cache, firmas: [], novedades: [] };
  }
}

// ---------- Escritura (con soporte offline) ----------

export async function crearFactura({ numero_factura, proveedor, id_usuario, firma_base64, foto }) {
  const fotoComprimida = await comprimirFoto(foto);
  const localId = idTemporal();

  const cacheOptimista = {
    id: localId,
    numero_factura,
    proveedor,
    estado_factura: "RECIBIDA",
    sincronizada: false
  };
  await actualizarCache(cacheOptimista);

  const payload = { numero_factura, proveedor, id_usuario };

  if (navigator.onLine) {
    try {
      const form = new FormData();
      Object.entries(payload).forEach(([k, v]) => form.append(k, v));
      form.append("firma_base64", firma_base64);
      if (fotoComprimida) form.append("foto", fotoComprimida, fotoComprimida.name || "factura.jpg");

      const { data } = await api.post("/", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await db.facturasCache.delete(localId);
      await actualizarCache({
        id: data.id_factura,
        numero_factura,
        proveedor,
        estado_factura: "RECIBIDA",
        sincronizada: true
      });
      return { ok: true, id_factura: data.id_factura, offline: false };
    } catch (error) {
      if (!esFallaDeRed(error)) throw error;
      // cae al bloque de encolado de abajo
    }
  }

  await encolarAccion({
    tipo_accion: TIPOS_ACCION.CREAR_FACTURA,
    factura_id_local: localId,
    payload,
    archivos: { foto: fotoComprimida, firma_base64 }
  });

  return { ok: true, id_factura: localId, offline: true };
}

async function accionSobreFactura({ tipo_accion, facturaId, payload, archivos = {} }) {
  const esLocal = String(facturaId).startsWith("tmp_");

  // Si la factura todavía no tiene id real (su creación sigue pendiente
  // de sincronizar), esta acción tiene que encolarse sí o sí: no hay
  // endpoint al que llamar todavía. El syncManager la procesará después
  // de que CREAR_FACTURA confirme y resuelva el id real.
  if (esLocal || !navigator.onLine) {
    await encolarAccion({
      tipo_accion,
      factura_id_local: esLocal ? facturaId : null,
      factura_id_servidor: esLocal ? null : facturaId,
      payload,
      archivos
    });
    return { ok: true, offline: true };
  }

  try {
    return await ejecutarAccionRemota({ tipo_accion, facturaId, payload, archivos });
  } catch (error) {
    if (!esFallaDeRed(error)) throw error;
    await encolarAccion({
      tipo_accion,
      factura_id_servidor: facturaId,
      payload,
      archivos
    });
    return { ok: true, offline: true };
  }
}

// Usada tanto por accionSobreFactura como por el syncManager al reintentar.
export async function ejecutarAccionRemota({ tipo_accion, facturaId, payload, archivos = {} }) {
  switch (tipo_accion) {
    case TIPOS_ACCION.REVISAR:
      return (await api.put(`/${facturaId}/revisar`, payload)).data;
    case TIPOS_ACCION.ENTREGAR_ADMIN:
      return (await api.put(`/${facturaId}/entregar-admin`, payload)).data;
    case TIPOS_ACCION.FINALIZAR:
      return (await api.put(`/${facturaId}/finalizar`, {})).data;
    case TIPOS_ACCION.NOVEDAD: {
      const form = new FormData();
      Object.entries(payload).forEach(([k, v]) => v !== undefined && v !== null && form.append(k, v));
      if (archivos.foto_evidencia) form.append("foto_evidencia", archivos.foto_evidencia, archivos.foto_evidencia.name || "evidencia.jpg");
      return (await api.post(`/${facturaId}/novedades`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      })).data;
    }
    default:
      throw new Error(`Tipo de acción desconocido: ${tipo_accion}`);
  }
}

export function revisarFactura(facturaId, { id_usuario, firma_base64 }) {
  return accionSobreFactura({
    tipo_accion: TIPOS_ACCION.REVISAR,
    facturaId,
    payload: { id_usuario, firma_base64 }
  });
}

export function entregarAdmin(facturaId, { id_usuario, firma_base64 }) {
  return accionSobreFactura({
    tipo_accion: TIPOS_ACCION.ENTREGAR_ADMIN,
    facturaId,
    payload: { id_usuario, firma_base64 }
  });
}

export function finalizarFactura(facturaId) {
  return accionSobreFactura({
    tipo_accion: TIPOS_ACCION.FINALIZAR,
    facturaId,
    payload: {}
  });
}

export async function registrarNovedad(facturaId, { codigo_referencia, descripcion_producto, tipo_novedad, cantidad, observaciones, foto_evidencia }) {
  const fotoComprimida = await comprimirFoto(foto_evidencia);
  return accionSobreFactura({
    tipo_accion: TIPOS_ACCION.NOVEDAD,
    facturaId,
    payload: { codigo_referencia, descripcion_producto, tipo_novedad, cantidad, observaciones },
    archivos: { foto_evidencia: fotoComprimida }
  });
}
