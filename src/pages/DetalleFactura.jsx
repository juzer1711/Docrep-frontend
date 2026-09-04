import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Circle, PackagePlus } from "lucide-react";
import {
  obtenerFactura,
  revisarFactura,
  entregarAdmin,
  finalizarFactura,
  registrarNovedad
} from "../api/facturasApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import SignatureModal from "../components/SignatureModal.jsx";
import NovedadModal from "../components/NovedadModal.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";


const ETAPAS = [
  { estado: "RECIBIDA", etiqueta: "Recibida" },
  { estado: "EN_REVISION", etiqueta: "En revisión" },
  { estado: "ENTREGADA_ADMIN", etiqueta: "Entregada a admin." },
  { estado: "FINALIZADA", etiqueta: "Finalizada" }
];

// Qué acción corresponde según el estado actual, y qué función de API dispara.
const ACCION_POR_ESTADO = {
  RECIBIDA: { etiqueta: "Marcar como revisada", requiereFirma: true, ejecutar: revisarFactura },
  EN_REVISION: { etiqueta: "Entregar a administración", requiereFirma: true, ejecutar: entregarAdmin },
  ENTREGADA_ADMIN: { etiqueta: "Finalizar (contabilidad)", requiereFirma: false, ejecutar: finalizarFactura }
};

export default function DetalleFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mostrar } = useToast();
  const { usuario } = useAuth();

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [firmaAbierta, setFirmaAbierta] = useState(false);
  const [novedadAbierta, setNovedadAbierta] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await obtenerFactura(id);
      setDetalle(data);
    } catch (error) {
      mostrar(error.message || "No se pudo cargar la factura.", "error");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const factura = detalle?.factura;
  const accionBase = factura ? ACCION_POR_ESTADO[factura.estado_factura] : null;
  const rolesPorEstado = {
    RECIBIDA: ["REVISION", "ADMINISTRADOR", "ADMINISTRACION"],
    EN_REVISION: ["ADMINISTRADOR", "ADMINISTRACION"],
    ENTREGADA_ADMIN: ["CONTABILIDAD", "ADMINISTRADOR", "ADMINISTRACION"]
  };
  const accion = accionBase && rolesPorEstado[factura.estado_factura]?.includes(usuario?.rol) ? accionBase : null;

  async function confirmarAccion(firma_base64 = null) {
    setProcesando(true);
    try {
      const resultado = await accion.ejecutar(id, { id_usuario: usuario.ID_USUARIO ?? usuario.id_usuario, firma_base64 });
      mostrar(
        resultado.offline
          ? "Guardado en el dispositivo. Se sincronizará cuando vuelva la conexión."
          : "Actualizado correctamente.",
        "exito"
      );
      setFirmaAbierta(false);
      cargar();
    } catch (error) {
      mostrar(error.response?.data?.mensaje || "No se pudo completar la acción.", "error");
    } finally {
      setProcesando(false);
    }
  }

  async function guardarNovedad(datos) {
    setProcesando(true);
    try {
      const resultado = await registrarNovedad(id, datos);
      mostrar(
        resultado.offline ? "Novedad guardada en el dispositivo." : "Novedad registrada.",
        "exito"
      );
      setNovedadAbierta(false);
      cargar();
    } catch (error) {
      mostrar(error.response?.data?.mensaje || "No se pudo registrar la novedad.", "error");
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return <p className="py-16 text-center text-sm text-graphite-500">Cargando…</p>;
  if (!factura) return <p className="py-16 text-center text-sm text-graphite-500">Factura no encontrada.</p>;

  const indiceActual = ETAPAS.findIndex((e) => e.estado === factura.estado_factura);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-5">
      <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-1 text-graphite-700">
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-graphite-900">{factura.numero_factura}</h1>
          <p className="text-graphite-500">{factura.proveedor}</p>
        </div>
        <StatusBadge estado={factura.estado_factura} />
      </div>

      {factura.sincronizada === false && (
        <p className="mb-6 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-600">
          Esta factura todavía no se ha sincronizado con el servidor.
        </p>
      )}

      {/* Trazabilidad */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-500">Trazabilidad</h2>
        <ol className="flex flex-col gap-4">
          {ETAPAS.map((etapa, i) => {
            const completada = i <= indiceActual;
            return (
              <li key={etapa.estado} className="flex items-center gap-3">
                {completada ? (
                  <CheckCircle2 size={22} className="shrink-0 text-moss-600" />
                ) : (
                  <Circle size={22} className="shrink-0 text-graphite-200" />
                )}
                <span className={completada ? "font-medium text-graphite-900" : "text-graphite-500"}>
                  {etapa.etiqueta}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Firmas recopiladas */}
      {detalle.firmas?.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-500">Firmas por etapa</h2>
          <div className="flex flex-col gap-3">
            {detalle.firmas.map((f, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border border-graphite-200 bg-white p-3">
                <img src={f.firma_base64} alt={`Firma de ${f.etapa}`} className="h-12 rounded bg-paper-50" />
                <div className="text-sm">
                  <p className="font-medium text-graphite-900">{f.etapa}</p>
                  <p className="text-graphite-500">{f.usuario_nombre || `Usuario #${f.id_usuario}`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Novedades */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-500">Novedades</h2>
          <button
            onClick={() => setNovedadAbierta(true)}
            className="flex items-center gap-1 text-sm font-medium text-sky-600"
          >
            <PackagePlus size={16} /> Agregar
          </button>
        </div>

        {!detalle.novedades?.length ? (
          <p className="text-sm text-graphite-500">Sin novedades registradas.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {detalle.novedades.map((n, i) => (
              <div key={i} className="rounded-lg border border-graphite-200 bg-white p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{n.descripcion_producto}</span>
                  <span className="rounded-full bg-rust-100 px-3 py-0.5 text-xs font-medium text-rust-600">
                    {n.tipo_novedad}
                  </span>
                </div>
                <p className="text-sm text-graphite-500">
                  Ref. {n.codigo_referencia} · Cantidad: {n.cantidad}
                </p>
                {n.observaciones && <p className="mt-1 text-sm text-graphite-700">{n.observaciones}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acción contextual */}
      {accion && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-graphite-200 bg-white p-4">
          <button
            onClick={() => (accion.requiereFirma ? setFirmaAbierta(true) : confirmarAccion())}
            disabled={procesando}
            className="mx-auto min-h-touch w-full max-w-2xl rounded-lg bg-amber-500 font-semibold text-graphite-900 disabled:opacity-40"
          >
            {procesando ? "Procesando…" : accion.etiqueta}
          </button>
        </div>
      )}

      <SignatureModal
        abierto={firmaAbierta}
        titulo={accion?.etiqueta || "Firma"}
        onCerrar={() => setFirmaAbierta(false)}
        onConfirmar={confirmarAccion}
      />

      <NovedadModal
        abierto={novedadAbierta}
        guardando={procesando}
        onCerrar={() => setNovedadAbierta(false)}
        onGuardar={guardarNovedad}
      />
    </div>
  );
}
