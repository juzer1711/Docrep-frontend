import imageCompression from "browser-image-compression";
import { api } from "./axios.js";
import { db, TIPOS_ACCION, encolarAccion, generarUUID } from "../db/db.js";

const OPCIONES_COMPRESION = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1600,
  useWebWorker: true
};

function esFallaDeRed(error) {
  return !error.response || !navigator.onLine;
}

async function comprimirFoto(foto) {
  if (!foto) return null;

  try {
    return await imageCompression(foto, OPCIONES_COMPRESION);
  } catch {
    return foto;
  }
}

function idTemporal() {
  return `tmp_${generarUUID()}`;
}

async function actualizarCache(factura) {
  await db.facturasCache.put({
    ...factura,
    actualizado_en: Date.now()
  });
}

function mapearFactura(factura) {
  if (!factura) return factura;

  return {
    ...factura,

    id:
      factura.ID_FACTURA ??
      factura.id_factura ??
      factura.id,

    numero_factura:
      factura.NUMERO_FACTURA ??
      factura.numero_factura,

    proveedor:
      factura.PROVEEDOR ??
      factura.proveedor,

    estado_factura:
      factura.ESTADO ??
      factura.estado_factura ??
      factura.estado,

    fecha_recepcion:
      factura.FECHA_RECEPCION ??
      factura.fecha_recepcion,

    usuario_recepcion:
      factura.USUARIO_RECEPCION ??
      factura.ID_USUARIO_RECEPCION ??
      factura.id_usuario_recepcion,

    url_foto:
      factura.URL_FOTO ??
      factura.url_foto,

    observaciones:
      factura.OBSERVACIONES ??
      factura.observaciones,

    total_novedades:
      factura.TOTAL_NOVEDADES ??
      factura.total_novedades ??
      0
  };
}

function mapearDetalle(data) {
  return {
    ...data,

    factura: mapearFactura(data.factura),

    firmas: (data.firmas || []).map((f) => ({
      ...f,

      id_firma:
        f.ID_FIRMA ??
        f.id_firma,

      id_factura:
        f.ID_FACTURA ??
        f.id_factura,

      etapa:
        f.TIPO_ETAPA ??
        f.etapa,

      id_usuario:
        f.ID_USUARIO ??
        f.id_usuario,

      usuario_nombre:
        f.NOMBRE_USUARIO ??
        f.USUARIO_NOMBRE ??
        f.usuario_nombre,

      nombre_firmante:
        f.NOMBRE_FIRMANTE ??
        f.nombre_firmante,

      firma_base64:
        f.FIRMA_BASE64 ??
        f.firma_base64,

      fecha_registro:
        f.FECHA_REGISTRO ??
        f.fecha_registro
    })),

    novedades: (data.novedades || []).map((n) => ({
      ...n,

      id:
        n.ID_NOVEDAD ??
        n.id_novedad ??
        n.id,

      codigo_referencia:
        n.CODIGO_REFERENCIA ??
        n.codigo_referencia,

      descripcion_producto:
        n.DESCRIPCION_PRODUCTO ??
        n.descripcion_producto,

      tipo_novedad:
        n.TIPO_NOVEDAD ??
        n.tipo_novedad,

      cantidad:
        n.CANTIDAD ??
        n.cantidad,

      estado:
        n.ESTADO_NOVEDAD ??
        n.ESTADO ??
        n.estado ??
        "PENDIENTE",

      url_foto_evidencia:
        n.URL_FOTO_EVIDENCIA ??
        n.url_foto_evidencia,

      observacion_resolucion:
        n.OBSERVACION_RESOLUCION ??
        n.observacion_resolucion,

      fecha_resolucion:
        n.FECHA_RESOLUCION ??
        n.fecha_resolucion,

      usuario_resolucion:
        n.USUARIO_RESOLUCION ??
        n.usuario_resolucion
    }))
  };
}


// ============================================================
// LISTADO / DETALLE
// ============================================================

export async function listarFacturas({
  buscar,
  estado,
  novedades,
  fechaDesde,
  fechaHasta
} = {}) {
  const params = {
    ...(buscar?.trim()
      ? { buscar: buscar.trim() }
      : {}),

    ...(estado
      ? { estado }
      : {}),

    ...(novedades
      ? { novedades }
      : {}),

    ...(fechaDesde
      ? { fecha_desde: fechaDesde }
      : {}),

    ...(fechaHasta
      ? { fecha_hasta: fechaHasta }
      : {})
  };

  try {
    const { data } = await api.get("/", { params });

    const registros =
      Array.isArray(data?.facturas)
        ? data.facturas
        : Array.isArray(data)
          ? data
          : [];

    const facturas = registros.map(mapearFactura);

    await db.facturasCache.bulkPut(
      facturas.map((factura) => ({
        ...factura,
        actualizado_en: Date.now()
      }))
    );

    return facturas;
  } catch (error) {
    if (!esFallaDeRed(error)) throw error;

    return db.facturasCache
      .orderBy("actualizado_en")
      .reverse()
      .toArray();
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

    if (!cache) {
      throw new Error(
        "Esta factura no está disponible sin conexión todavía."
      );
    }

    return {
      factura: cache,
      firmas: [],
      novedades: []
    };
  }
}


// ============================================================
// CREAR FACTURA
// ============================================================

export async function crearFactura({
  numero_factura,
  proveedor,
  nombre_firmante,
  firma_base64,
  foto
}) {
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

  const payload = {
    numero_factura,
    proveedor,
    nombre_firmante
  };

  if (navigator.onLine) {
    try {
      const form = new FormData();

      Object.entries(payload).forEach(([k, v]) => {
        form.append(k, v);
      });

      form.append(
        "firma_base64",
        firma_base64
      );

      if (fotoComprimida) {
        form.append(
          "foto",
          fotoComprimida,
          fotoComprimida.name || "factura.jpg"
        );
      }

      const { data } = await api.post(
        "/",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      await db.facturasCache.delete(localId);

      await actualizarCache({
        id: data.id_factura,
        numero_factura,
        proveedor,
        estado_factura: "RECIBIDA",
        url_foto: data.url_foto ?? null,
        sincronizada: true
      });

      return {
        ok: true,
        id_factura: data.id_factura,
        offline: false
      };
    } catch (error) {
      if (!esFallaDeRed(error)) {
        throw error;
      }
    }
  }

  await encolarAccion({
    tipo_accion: TIPOS_ACCION.CREAR_FACTURA,
    factura_id_local: localId,
    payload,
    archivos: {
      foto: fotoComprimida,
      firma_base64
    }
  });

  return {
    ok: true,
    id_factura: localId,
    offline: true
  };
}


// ============================================================
// ACCIONES SOBRE FACTURA
// ============================================================

async function accionSobreFactura({
  tipo_accion,
  facturaId,
  payload,
  archivos = {}
}) {
  const esLocal =
    String(facturaId).startsWith("tmp_");

  if (esLocal || !navigator.onLine) {
    await encolarAccion({
      tipo_accion,

      factura_id_local:
        esLocal
          ? facturaId
          : null,

      factura_id_servidor:
        esLocal
          ? null
          : facturaId,

      payload,
      archivos
    });

    return {
      ok: true,
      offline: true
    };
  }

  try {
    return await ejecutarAccionRemota({
      tipo_accion,
      facturaId,
      payload,
      archivos
    });
  } catch (error) {
    if (!esFallaDeRed(error)) {
      throw error;
    }

    await encolarAccion({
      tipo_accion,
      factura_id_servidor: facturaId,
      payload,
      archivos
    });

    return {
      ok: true,
      offline: true
    };
  }
}


// ============================================================
// EJECUTAR ACCION REMOTA
// ============================================================

export async function ejecutarAccionRemota({
  tipo_accion,
  facturaId,
  payload,
  archivos = {}
}) {
  switch (tipo_accion) {

    // --------------------------------------------------------
    // REVISAR
    // --------------------------------------------------------

    case TIPOS_ACCION.REVISAR:
      return (
        await api.put(
          `/${facturaId}/revisar`,
          payload
        )
      ).data;


    // --------------------------------------------------------
    // ENTREGAR ADMIN
    // --------------------------------------------------------

    case TIPOS_ACCION.ENTREGAR_ADMIN:
      return (
        await api.put(
          `/${facturaId}/entregar-admin`,
          payload
        )
      ).data;


    // --------------------------------------------------------
    // FINALIZAR
    // --------------------------------------------------------

    case TIPOS_ACCION.FINALIZAR:
      return (
        await api.put(
          `/${facturaId}/finalizar`,
          payload
        )
      ).data;


    // --------------------------------------------------------
    // ACTUALIZAR FACTURA
    // --------------------------------------------------------

    case TIPOS_ACCION.ACTUALIZAR_FACTURA: {
      const form = new FormData();

      Object.entries(payload || {}).forEach(([k, v]) => {
        if (
          v !== undefined &&
          v !== null
        ) {
          form.append(k, v);
        }
      });

      if (archivos.foto) {
        form.append(
          "foto",
          archivos.foto,
          archivos.foto.name || "factura.jpg"
        );
      }

      return (
        await api.put(
          `/${facturaId}`,
          form,
          {
            headers: {
              "Content-Type":
                "multipart/form-data"
            }
          }
        )
      ).data;
    }


    // --------------------------------------------------------
    // ELIMINAR FACTURA
    // --------------------------------------------------------

    case TIPOS_ACCION.ELIMINAR_FACTURA:
      return (
        await api.delete(
          `/${facturaId}`
        )
      ).data;


    // --------------------------------------------------------
    // REGISTRAR NOVEDAD
    // --------------------------------------------------------

    case TIPOS_ACCION.NOVEDAD: {
      const form = new FormData();

      Object.entries(payload).forEach(([k, v]) => {
        if (
          v !== undefined &&
          v !== null
        ) {
          form.append(k, v);
        }
      });

      if (archivos.foto_evidencia) {
        form.append(
          "foto_evidencia",
          archivos.foto_evidencia,
          archivos.foto_evidencia.name ||
            "evidencia.jpg"
        );
      }

      return (
        await api.post(
          `/${facturaId}/novedades`,
          form,
          {
            headers: {
              "Content-Type":
                "multipart/form-data"
            }
          }
        )
      ).data;
    }


    // --------------------------------------------------------
    // ACTUALIZAR NOVEDAD
    // --------------------------------------------------------

    case TIPOS_ACCION.ACTUALIZAR_NOVEDAD: {
      const { novedadId } = payload;

      const datos = {
        ...payload
      };

      delete datos.novedadId;

      const form = new FormData();

      Object.entries(datos).forEach(([k, v]) => {
        if (
          v !== undefined &&
          v !== null
        ) {
          form.append(k, v);
        }
      });

      if (archivos.foto_evidencia) {
        form.append(
          "foto_evidencia",
          archivos.foto_evidencia,
          archivos.foto_evidencia.name ||
            "evidencia.jpg"
        );
      }

      return (
        await api.put(
          `/${facturaId}/novedades/${novedadId}`,
          form,
          {
            headers: {
              "Content-Type":
                "multipart/form-data"
            }
          }
        )
      ).data;
    }


    // --------------------------------------------------------
    // ELIMINAR NOVEDAD
    // --------------------------------------------------------

    case TIPOS_ACCION.ELIMINAR_NOVEDAD: {
      const { novedadId } = payload;

      return (
        await api.delete(
          `/${facturaId}/novedades/${novedadId}`
        )
      ).data;
    }


    default:
      throw new Error(
        `Tipo de acción desconocido: ${tipo_accion}`
      );
  }
}


// ============================================================
// FIRMAS / ESTADOS
// ============================================================

export function revisarFactura(
  facturaId,
  {
    nombre_firmante,
    firma_base64
  }
) {
  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.REVISAR,

    facturaId,

    payload: {
      nombre_firmante,
      firma_base64
    }
  });
}

export function entregarAdmin(
  facturaId,
  {
    nombre_firmante,
    firma_base64
  }
) {
  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.ENTREGAR_ADMIN,

    facturaId,

    payload: {
      nombre_firmante,
      firma_base64
    }
  });
}

export function finalizarFactura(
  facturaId,
  {
    nombre_firmante,
    firma_base64
  }
) {
  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.FINALIZAR,

    facturaId,

    payload: {
      nombre_firmante,
      firma_base64
    }
  });
}


// ============================================================
// ACTUALIZAR / ELIMINAR FACTURA
// ============================================================

export async function actualizarFactura(
  facturaId,
  {
    numero_factura,
    proveedor,
    observaciones,
    foto
  }
) {
  const fotoComprimida =
    await comprimirFoto(foto);

  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.ACTUALIZAR_FACTURA,

    facturaId,

    payload: {
      numero_factura,
      proveedor,
      observaciones
    },

    archivos: {
      foto: fotoComprimida
    }
  });
}

export function eliminarFactura(
  facturaId
) {
  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.ELIMINAR_FACTURA,

    facturaId,

    payload: {},
    archivos: {}
  });
}


// ============================================================
// NOVEDADES
// ============================================================

export async function registrarNovedad(
  facturaId,
  {
    codigo_referencia,
    descripcion_producto,
    tipo_novedad,
    cantidad,
    observaciones,
    foto_evidencia
  }
) {
  const fotoComprimida =
    await comprimirFoto(
      foto_evidencia
    );

  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.NOVEDAD,

    facturaId,

    payload: {
      codigo_referencia,
      descripcion_producto,
      tipo_novedad,
      cantidad,
      observaciones
    },

    archivos: {
      foto_evidencia:
        fotoComprimida
    }
  });
}


// ------------------------------------------------------------
// ACTUALIZAR NOVEDAD
// ------------------------------------------------------------

export async function actualizarNovedad(
  facturaId,
  novedadId,
  datos
) {
  const foto =
    await comprimirFoto(
      datos.foto_evidencia
    );

  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.ACTUALIZAR_NOVEDAD,

    facturaId,

    payload: {
      novedadId,

      codigo_referencia:
        datos.codigo_referencia,

      descripcion_producto:
        datos.descripcion_producto,

      tipo_novedad:
        datos.tipo_novedad,

      cantidad:
        datos.cantidad,

      observaciones:
        datos.observaciones
    },

    archivos: {
      foto_evidencia: foto
    }
  });
}


// ------------------------------------------------------------
// ELIMINAR NOVEDAD
// ------------------------------------------------------------

export function eliminarNovedad(
  facturaId,
  novedadId
) {
  return accionSobreFactura({
    tipo_accion:
      TIPOS_ACCION.ELIMINAR_NOVEDAD,

    facturaId,

    payload: {
      novedadId
    },

    archivos: {}
  });
}


// ------------------------------------------------------------
// RESOLVER NOVEDAD
// ------------------------------------------------------------

export async function resolverNovedad(
  facturaId,
  novedadId,
  observacion_resolucion
) {
  return (
    await api.put(
      `/${facturaId}/novedades/${novedadId}/resolver`,
      {
        observacion_resolucion
      }
    )
  ).data;
}