import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowBackRounded,
  CheckCircleRounded,
  CheckRounded,
  ChevronRightRounded,
  CloseRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  EditRounded,
  Inventory2Rounded,
  OpenInNewRounded,
  PersonRounded,
  PhotoRounded,
  RateReviewRounded,
  TaskAltRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  actualizarFactura,
  actualizarNovedad,
  eliminarFactura,
  eliminarNovedad,
  entregarAdmin,
  finalizarFactura,
  obtenerFactura,
  registrarNovedad,
  resolverNovedad,
  revisarFactura,
} from "../api/facturasApi.js";

import StatusBadge from "../components/StatusBadge.jsx";
import SignatureModal from "../components/SignatureModal.jsx";
import NovedadModal from "../components/NovedadModal.jsx";
import DetalleNovedad from "../components/DetalleNovedad.jsx";
import CameraInput from "../components/CameraInput.jsx";

import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ETAPAS = [
  {
    id: "RECIBIDA",
    etiqueta: "Recibida",
    descripcion: "Factura recibida en bodega",
    Icono: Inventory2Rounded,
  },
  {
    id: "EN_REVISION",
    etiqueta: "En revisión",
    descripcion: "Factura en proceso de revisión",
    Icono: RateReviewRounded,
  },
  {
    id: "ENTREGADA_ADMIN",
    etiqueta: "Entregada a administración",
    descripcion: "Factura entregada a administración",
    Icono: TaskAltRounded,
  },
  {
    id: "FINALIZADA",
    etiqueta: "Finalizada",
    descripcion: "Proceso de factura finalizado",
    Icono: CheckCircleRounded,
  },
];

const resolverUrl = (ruta) => {
  if (!ruta) return null;

  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }

  const base = (
    import.meta.env.VITE_FILES_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const path = ruta.startsWith("/") ? ruta : `/${ruta}`;

  return `${base}${path}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "No disponible";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(valor);
};

const obtenerUsuarioFirma = (firma) =>
  firma?.usuario_nombre ||
  firma?.nombre_usuario ||
  firma?.usuario ||
  firma?.USUARIO ||
  firma?.NOMBRE_USUARIO ||
  null;

const obtenerNombreFirmante = (firma) =>
  firma?.nombre_firmante ||
  firma?.NOMBRE_FIRMANTE ||
  null;

const obtenerFechaFirma = (firma) =>
  firma?.fecha_registro ||
  firma?.fecha ||
  firma?.fecha_firma ||
  firma?.FECHA_REGISTRO ||
  firma?.FECHA ||
  firma?.FECHA_FIRMA ||
  null;

const obtenerEtapaFirma = (firma) =>
  firma?.etapa ||
  firma?.ETAPA ||
  firma?.tipo_etapa ||
  firma?.TIPO_ETAPA ||
  firma?.tipo ||
  firma?.TIPO ||
  "Etapa";

const obtenerIdFirma = (firma, index) =>
  firma?.id_firma ||
  firma?.ID_FIRMA ||
  firma?.id ||
  firma?.ID ||
  `${obtenerEtapaFirma(firma)}-${index}`;

const FORMULARIO_FACTURA_INICIAL = {
  numero_factura: "",
  proveedor: "",
  observaciones: "",
};

function SkeletonDetalle() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-5 w-28 animate-pulse rounded bg-graphite-200" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div className="h-[420px] animate-pulse rounded-2xl bg-graphite-200" />
          <div className="h-48 animate-pulse rounded-2xl bg-graphite-200" />
        </div>

        <div className="space-y-6">
          <div className="h-52 animate-pulse rounded-2xl bg-graphite-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-graphite-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-graphite-200" />
        </div>
      </div>
    </div>
  );
}

function Seccion({
  titulo,
  subtitulo,
  icon: Icono,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icono && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-100 text-graphite-700">
            <Icono sx={{ fontSize: 21 }} aria-hidden="true" />
          </span>
        )}

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-graphite-900">
            {titulo}
          </h2>

          {subtitulo && (
            <p className="mt-0.5 text-sm text-graphite-500">{subtitulo}</p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function VisorFactura({ factura }) {
  const imagen = resolverUrl(factura?.url_foto);

  return (
    <Seccion
      titulo="Documento recibido"
      subtitulo="Evidencia fotográfica de la factura"
      icon={DescriptionRounded}
    >
      {imagen ? (
        <a
          href={imagen}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-xl bg-graphite-900"
          aria-label="Abrir documento de factura en una nueva pestaña"
        >
          <div className="flex min-h-[300px] items-center justify-center p-3 sm:min-h-[420px]">
            <img
              src={imagen}
              alt={`Documento de la factura ${factura.numero_factura}`}
              className="max-h-[400px] w-full object-contain transition duration-200 group-hover:scale-[1.01] sm:max-h-[460px]"
              onError={(evento) => {
                evento.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white">
            <OpenInNewRounded sx={{ fontSize: 16 }} aria-hidden="true" />
            Abrir imagen completa
          </div>
        </a>
      ) : (
        <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-graphite-200 bg-paper-50 p-8 text-center">
          <div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-graphite-200 text-graphite-500">
              <PhotoRounded sx={{ fontSize: 28 }} aria-hidden="true" />
            </span>

            <p className="mt-4 font-medium text-graphite-700">
              No hay fotografía disponible
            </p>

            <p className="mt-1 text-sm text-graphite-500">
              Esta factura no tiene un documento adjunto.
            </p>
          </div>
        </div>
      )}
    </Seccion>
  );
}

function Firmas({ firmas = [], onVerFirma }) {
  return (
    <Seccion
      titulo="Firmas y responsables"
      subtitulo="Personas que intervinieron en cada etapa"
      icon={PersonRounded}
    >
      {firmas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-graphite-200 bg-paper-50 p-5 text-center">
          <PersonRounded
            className="text-graphite-400"
            sx={{ fontSize: 30 }}
            aria-hidden="true"
          />

          <p className="mt-2 text-sm font-medium text-graphite-700">
            No hay firmas disponibles
          </p>

          <p className="mt-1 text-xs text-graphite-500">
            Las firmas aparecerán aquí cuando estén registradas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {firmas.map((firma, index) => {
            const imagenFirma =
              firma?.firma_base64 || firma?.FIRMA_BASE64 || null;

            const usuarioFirma = obtenerUsuarioFirma(firma);
            const nombreFirmante = obtenerNombreFirmante(firma);
            const fechaFirma = obtenerFechaFirma(firma);
            const etapa = obtenerEtapaFirma(firma);
            const idFirma = obtenerIdFirma(firma, index);

            return (
              <article
                key={idFirma}
                className="overflow-hidden rounded-xl border border-graphite-200 bg-paper-50"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss-100 text-moss-700">
                      <CheckCircleRounded
                        sx={{ fontSize: 19 }}
                        aria-hidden="true"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-graphite-900">
                          {etapa}
                        </p>

                        <span className="rounded-full bg-moss-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-moss-700">
                          Registrada
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                            Firmante
                          </span>

                          <span className="mt-1 block text-sm font-medium text-graphite-900">
                            {nombreFirmante || "No disponible"}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                            Usuario del sistema
                          </span>

                          <span className="mt-1 block text-sm text-graphite-700">
                            {usuarioFirma || "No disponible"}
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                            Fecha
                          </span>

                          <span className="mt-1 block text-sm text-graphite-700">
                            {formatearFecha(fechaFirma)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {imagenFirma ? (
                    <button
                      type="button"
                      onClick={() =>
                        onVerFirma({
                          imagen: imagenFirma,
                          etapa,
                          nombreFirmante,
                          usuarioFirma,
                          fechaFirma,
                        })
                      }
                      className="group mt-4 block w-full overflow-hidden rounded-xl border border-graphite-200 bg-white text-left transition hover:border-sky-400"
                    >
                      <div className="flex h-28 items-center justify-center p-3">
                        <img
                          src={imagenFirma}
                          alt={`Firma de ${nombreFirmante || etapa}`}
                          className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.02]"
                        />
                      </div>

                      <div className="flex items-center justify-center gap-1.5 border-t border-graphite-100 px-3 py-2 text-xs font-semibold text-sky-700">
                        <OpenInNewRounded
                          sx={{ fontSize: 15 }}
                          aria-hidden="true"
                        />
                        Ver firma ampliada
                      </div>
                    </button>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-graphite-200 bg-white p-3 text-center text-xs text-graphite-500">
                      No hay imagen de firma disponible.
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Seccion>
  );
}

function VisorFirma({ firma, onCerrar }) {
  if (!firma) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-graphite-900/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visor-firma-titulo"
        className="w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-graphite-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
              Firma registrada
            </p>

            <h2
              id="visor-firma-titulo"
              className="mt-1 text-lg font-semibold text-graphite-900"
            >
              {firma.etapa}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="grid min-h-touch min-w-touch place-items-center rounded-lg text-graphite-500 hover:bg-paper-100 hover:text-graphite-900"
            aria-label="Cerrar visor de firma"
          >
            <CloseRounded sx={{ fontSize: 22 }} aria-hidden="true" />
          </button>
        </header>

        <div className="p-5">
          <div className="rounded-xl border border-graphite-200 bg-paper-50 p-4">
            <div className="flex min-h-[240px] items-center justify-center rounded-lg bg-white p-5 sm:min-h-[320px]">
              <img
                src={firma.imagen}
                alt={`Firma correspondiente a ${firma.etapa}`}
                className="max-h-[280px] w-full object-contain sm:max-h-[360px]"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-graphite-200 bg-paper-50 p-4 sm:grid-cols-3">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                Etapa
              </span>

              <span className="mt-1 block text-sm font-semibold text-graphite-900">
                {firma.etapa}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                Firmante
              </span>

              <span className="mt-1 block text-sm font-medium text-graphite-900">
                {firma.nombreFirmante || "No disponible"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                Fecha
              </span>

              <span className="mt-1 block text-sm text-graphite-700">
                {formatearFecha(firma.fechaFirma)}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-paper-50 p-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
              Usuario del sistema
            </span>

            <span className="mt-1 block text-sm text-graphite-700">
              {firma.usuarioFirma || "No disponible"}
            </span>
          </div>
        </div>

        <footer className="border-t border-graphite-200 bg-paper-50 p-4">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-touch w-full rounded-xl bg-graphite-900 px-4 py-3 text-sm font-semibold text-white hover:bg-graphite-800"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

function InformacionFactura({ factura, puedeBodega, onEditar, onEliminar }) {
  return (
    <Seccion
      titulo="Información de la factura"
      subtitulo="Datos principales del documento"
      icon={DescriptionRounded}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-paper-50 p-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
            Número de factura
          </span>
          <span className="mt-1 block font-semibold text-graphite-900">
            {factura.numero_factura || "Sin número"}
          </span>
        </div>

        <div className="rounded-xl bg-paper-50 p-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
            Proveedor
          </span>
          <span className="mt-1 block font-medium text-graphite-900">
            {factura.proveedor || "Sin proveedor"}
          </span>
        </div>

        <div className="rounded-xl bg-paper-50 p-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
            Fecha de recepción
          </span>
          <span className="mt-1 block text-sm text-graphite-700">
            {formatearFecha(factura.fecha_recepcion)}
          </span>
        </div>

        <div className="rounded-xl bg-paper-50 p-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
            Usuario de recepción
          </span>
          <span className="mt-1 block text-sm text-graphite-700">
            {factura.usuario_recepcion || "No disponible"}
          </span>
        </div>
      </div>

      {factura.observaciones && (
        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-100/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Observaciones
          </p>

          <p className="mt-1.5 text-sm leading-6 text-graphite-700">
            {factura.observaciones}
          </p>
        </div>
      )}

      {puedeBodega && (
        <div className="mt-6 border-t border-graphite-200 pt-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-graphite-900">
              Acciones de factura
            </h3>

            <p className="mt-1 text-xs leading-5 text-graphite-500">
              Desde aquí puedes modificar la información de la factura o
              eliminarla si corresponde.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onEditar}
              className="inline-flex min-h-touch items-center justify-center gap-2 rounded-xl border border-sky-600 bg-white px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              <EditRounded
                sx={{ fontSize: 18 }}
                aria-hidden="true"
              />
              Editar factura
            </button>

            <button
              type="button"
              onClick={onEliminar}
              className="inline-flex min-h-touch items-center justify-center gap-2 rounded-xl border border-rust-200 bg-rust-50 px-4 py-3 text-sm font-semibold text-rust-700 transition hover:bg-rust-100"
            >
              <DeleteOutlineRounded
                sx={{ fontSize: 18 }}
                aria-hidden="true"
              />
              Eliminar factura
            </button>
          </div>
        </div>
      )}
    </Seccion>
  );
}

function Trazabilidad({ estadoActual }) {
  const indiceActual = ETAPAS.findIndex(
    (etapa) => etapa.id === estadoActual,
  );

  return (
    <Seccion
      titulo="Trazabilidad"
      subtitulo="Estado actual del proceso"
      icon={TaskAltRounded}
    >
      <div className="space-y-3">
        {ETAPAS.map((etapa, index) => {
          const completada = index < indiceActual;
          const actual = index === indiceActual;
          const pendiente = index > indiceActual;
          const Icono = etapa.Icono;

          return (
            <div
              key={etapa.id}
              className={[
                "flex items-center gap-3 rounded-xl border p-3",
                actual
                  ? "border-sky-200 bg-sky-50"
                  : "border-graphite-100 bg-paper-50",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border",
                  completada || actual
                    ? "border-sky-600 bg-sky-100 text-sky-700"
                    : "border-graphite-200 bg-white text-graphite-400",
                ].join(" ")}
              >
                <Icono sx={{ fontSize: 18 }} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={[
                      "text-sm font-semibold",
                      pendiente
                        ? "text-graphite-500"
                        : "text-graphite-900",
                    ].join(" ")}
                  >
                    {etapa.etiqueta}
                  </p>

                  {actual && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                      Actual
                    </span>
                  )}

                  {completada && (
                    <CheckRounded
                      className="text-moss-600"
                      sx={{ fontSize: 17 }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <p className="mt-0.5 text-xs text-graphite-500">
                  {etapa.descripcion}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Seccion>
  );
}

function TarjetaNovedad({
  novedad,
  puedeBodega,
  onDetalle,
  onEditar,
  onResolver,
  onEliminar,
}) {
  const pendiente = novedad.estado !== "RESUELTA";
  const imagen = resolverUrl(novedad.url_foto_evidencia);

  return (
    <article className="overflow-hidden rounded-xl border border-graphite-200 bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={[
                "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                pendiente
                  ? "bg-rust-100 text-rust-700"
                  : "bg-moss-100 text-moss-700",
              ].join(" ")}
            >
              {pendiente ? (
                <WarningAmberRounded
                  sx={{ fontSize: 19 }}
                  aria-hidden="true"
                />
              ) : (
                <CheckCircleRounded
                  sx={{ fontSize: 19 }}
                  aria-hidden="true"
                />
              )}
            </span>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-graphite-900">
                {novedad.descripcion_producto || "Producto"}
              </h3>

              <p className="mt-0.5 text-xs text-graphite-500">
                Ref. {novedad.codigo_referencia || "—"}
              </p>
            </div>
          </div>

          <span
            className={[
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              pendiente
                ? "bg-rust-100 text-rust-700"
                : "bg-moss-100 text-moss-700",
            ].join(" ")}
          >
            {pendiente ? "Pendiente" : "Resuelta"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-paper-100 px-2.5 py-1.5 font-medium text-graphite-700">
            {novedad.tipo_novedad || "Sin tipo"}
          </span>

          <span className="rounded-lg bg-paper-100 px-2.5 py-1.5 text-graphite-700">
            Cantidad: {novedad.cantidad ?? "—"}
          </span>

          {imagen && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-2.5 py-1.5 font-medium text-sky-700">
              <PhotoRounded sx={{ fontSize: 15 }} aria-hidden="true" />
              Evidencia
            </span>
          )}
        </div>

        {novedad.observaciones && (
          <p className="mt-3 line-clamp-2 text-sm leading-5 text-graphite-600">
            {novedad.observaciones}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-graphite-100 pt-3">
          <button
            type="button"
            onClick={() => onDetalle(novedad)}
            className="inline-flex min-h-touch items-center gap-1.5 text-sm font-semibold text-sky-700 transition hover:text-sky-600"
          >
            Ver detalle
            <ChevronRightRounded
              sx={{ fontSize: 18 }}
              aria-hidden="true"
            />
          </button>

          {puedeBodega && pendiente && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => onEditar(novedad)}
                className="inline-flex min-h-touch items-center gap-1.5 text-sm font-medium text-sky-700"
              >
                <EditRounded sx={{ fontSize: 17 }} aria-hidden="true" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => onResolver(novedad)}
                className="inline-flex min-h-touch items-center gap-1.5 text-sm font-medium text-moss-700"
              >
                <CheckRounded sx={{ fontSize: 17 }} aria-hidden="true" />
                Resolver
              </button>

              <button
                type="button"
                onClick={() => onEliminar(novedad)}
                className="inline-flex min-h-touch items-center gap-1.5 text-sm font-medium text-rust-700"
              >
                <DeleteOutlineRounded
                  sx={{ fontSize: 17 }}
                  aria-hidden="true"
                />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ModalEditarFactura({
  abierto,
  factura,
  guardando,
  onCerrar,
  onGuardar,
}) {
  const [form, setForm] = useState(FORMULARIO_FACTURA_INICIAL);
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    if (!abierto || !factura) return;

    setForm({
      numero_factura: factura.numero_factura || "",
      proveedor: factura.proveedor || "",
      observaciones: factura.observaciones || "",
    });

    setFoto(null);
  }, [abierto, factura]);

  if (!abierto || !factura) return null;

  const actualizarCampo = (campo) => (evento) => {
    setForm((actual) => ({
      ...actual,
      [campo]: evento.target.value,
    }));
  };

  const guardar = () => {
    const numero = form.numero_factura.trim();
    const proveedor = form.proveedor.trim();

    if (!numero || !proveedor || guardando) {
      return;
    }

    onGuardar({
      numero_factura: numero,
      proveedor,
      observaciones: form.observaciones.trim(),
      foto,
    });
  };

  const imagenActual = resolverUrl(factura.url_foto);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-graphite-900/60 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-factura-titulo"
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-graphite-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
              Gestión de factura
            </p>

            <h2
              id="editar-factura-titulo"
              className="mt-1 text-lg font-semibold text-graphite-900"
            >
              Editar factura
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar edición"
            className="grid min-h-touch min-w-touch place-items-center rounded-lg text-graphite-500 hover:bg-paper-100 hover:text-graphite-900 disabled:opacity-40"
          >
            <CloseRounded sx={{ fontSize: 22 }} aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          <div>
            <label
              htmlFor="editar-numero-factura"
              className="mb-2 block text-sm font-semibold text-graphite-900"
            >
              Número de factura *
            </label>

            <input
              id="editar-numero-factura"
              type="text"
              value={form.numero_factura}
              onChange={actualizarCampo("numero_factura")}
              disabled={guardando}
              className="min-h-touch w-full rounded-xl border border-graphite-200 px-4 text-base text-graphite-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-paper-50"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="editar-proveedor"
              className="mb-2 block text-sm font-semibold text-graphite-900"
            >
              Proveedor *
            </label>

            <input
              id="editar-proveedor"
              type="text"
              value={form.proveedor}
              onChange={actualizarCampo("proveedor")}
              disabled={guardando}
              className="min-h-touch w-full rounded-xl border border-graphite-200 px-4 text-base text-graphite-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-paper-50"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="editar-observaciones"
              className="mb-2 block text-sm font-semibold text-graphite-900"
            >
              Observaciones
            </label>

            <textarea
              id="editar-observaciones"
              value={form.observaciones}
              onChange={actualizarCampo("observaciones")}
              rows={4}
              disabled={guardando}
              className="w-full resize-y rounded-xl border border-graphite-200 px-4 py-3 text-base text-graphite-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-paper-50"
            />
          </div>

          {imagenActual && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-graphite-900">
                Fotografía actual
              </p>

              <a
                href={imagenActual}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-xl border border-graphite-200 bg-paper-50"
              >
                <div className="flex h-44 items-center justify-center p-3">
                  <img
                    src={imagenActual}
                    alt="Fotografía actual de la factura"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 border-t border-graphite-100 px-3 py-2 text-xs font-semibold text-sky-700">
                  <OpenInNewRounded
                    sx={{ fontSize: 15 }}
                    aria-hidden="true"
                  />
                  Ver fotografía
                </div>
              </a>
            </div>
          )}

          <div className="mt-5">
            <CameraInput
              etiqueta="Reemplazar fotografía (opcional)"
              onCapturar={setFoto}
            />

            {foto && (
              <p className="mt-2 text-xs font-medium text-moss-700">
                Nueva fotografía seleccionada.
              </p>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-graphite-200 bg-paper-50 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="min-h-touch rounded-xl px-5 py-3 text-sm font-medium text-graphite-600 hover:bg-graphite-100 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={guardar}
            disabled={
              guardando ||
              !form.numero_factura.trim() ||
              !form.proveedor.trim()
            }
            className="min-h-touch rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ModalConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  peligro = false,
  procesando,
  onCerrar,
  onConfirmar,
}) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-graphite-900/60 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-full",
              peligro
                ? "bg-rust-100 text-rust-700"
                : "bg-moss-100 text-moss-700",
            ].join(" ")}
          >
            {peligro ? (
              <DeleteOutlineRounded
                sx={{ fontSize: 23 }}
                aria-hidden="true"
              />
            ) : (
              <CheckRounded sx={{ fontSize: 23 }} aria-hidden="true" />
            )}
          </span>

          <div className="min-w-0">
            <h2 className="font-semibold text-graphite-900">{titulo}</h2>

            <p className="mt-1 text-sm leading-6 text-graphite-500">
              {descripcion}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="min-h-touch rounded-xl px-4 py-3 text-sm font-medium text-graphite-600 hover:bg-paper-100 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando}
            className={[
              "min-h-touch rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60",
              peligro
                ? "bg-rust-600 hover:bg-rust-700"
                : "bg-moss-600 hover:bg-moss-700",
            ].join(" ")}
          >
            {procesando ? "Procesando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DetalleFactura() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { usuario } = useAuth();
  const { mostrar } = useToast();

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [firma, setFirma] = useState(false);
  const [firmaSeleccionada, setFirmaSeleccionada] = useState(null);

  const [modalNovedad, setModalNovedad] = useState(false);
  const [editarNovedad, setEditarNovedad] = useState(null);
  const [detalleNovedad, setDetalleNovedad] = useState(null);
  const [resolver, setResolver] = useState(null);
  const [eliminarNovedadSeleccionada, setEliminarNovedadSeleccionada] =
    useState(null);

  const [editarFacturaAbierto, setEditarFacturaAbierto] = useState(false);
  const [eliminarFacturaAbierto, setEliminarFacturaAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);

    try {
      const data = await obtenerFactura(id);
      setDetalle(data);
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo cargar la factura.",
        "error",
      );
    } finally {
      setCargando(false);
    }
  }, [id, mostrar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const factura = detalle?.factura;

  const puedeBodega = ["BODEGA", "ADMINISTRADOR"].includes(usuario?.rol);

  const puedeFinalizar = ["CONTABILIDAD", "ADMINISTRADOR"].includes(
    usuario?.rol,
  );

  const accion =
    factura?.estado_factura === "RECIBIDA" && puedeBodega
      ? {
          texto: "Marcar como revisada",
          descripcion:
            "La factura pasará a la etapa de revisión y se registrará la firma.",
          fn: revisarFactura,
          mensaje: "Factura marcada como revisada.",
        }
      : factura?.estado_factura === "EN_REVISION" && puedeBodega
        ? {
            texto: "Entregar a administración",
            descripcion:
              "La factura quedará registrada como entregada a administración.",
            fn: entregarAdmin,
            mensaje: "Factura entregada a administración.",
          }
        : factura?.estado_factura === "ENTREGADA_ADMIN" && puedeFinalizar
          ? {
              texto: "Finalizar factura",
              descripcion:
                "La factura quedará registrada como finalizada con su firma.",
              fn: finalizarFactura,
              mensaje: "Factura finalizada correctamente.",
            }
          : null;

  async function ejecutar(datosFirma) {
    if (!accion || !datosFirma) return;

    setProcesando(true);

    try {
      await accion.fn(id, datosFirma);

      mostrar(accion.mensaje, "exito");

      setFirma(false);

      await cargar();
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo completar la acción.",
        "error",
      );
    } finally {
      setProcesando(false);
    }
  }

  async function guardarNovedad(datos) {
    setProcesando(true);

    try {
      if (editarNovedad) {
        await actualizarNovedad(id, editarNovedad.id, datos);
      } else {
        await registrarNovedad(id, datos);
      }

      mostrar(
        editarNovedad
          ? "Novedad actualizada."
          : "Novedad registrada.",
        "exito",
      );

      setModalNovedad(false);
      setEditarNovedad(null);

      await cargar();
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo guardar la novedad.",
        "error",
      );
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarResolver() {
    if (!resolver) return;

    setProcesando(true);

    try {
      await resolverNovedad(id, resolver.id, resolver.texto);

      mostrar("Novedad resuelta.", "exito");

      setResolver(null);

      await cargar();
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo resolver la novedad.",
        "error",
      );
    } finally {
      setProcesando(false);
    }
  }

  async function guardarCambiosFactura(datos) {
    setProcesando(true);

    try {
      await actualizarFactura(id, datos);

      mostrar("Factura actualizada correctamente.", "exito");

      setEditarFacturaAbierto(false);

      await cargar();
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo actualizar la factura.",
        "error",
      );
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminarFactura() {
    setProcesando(true);

    try {
      await eliminarFactura(id);

      mostrar("Factura eliminada correctamente.", "exito");

      setEliminarFacturaAbierto(false);

      navigate("/facturas");
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo eliminar la factura.",
        "error",
      );
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminarNovedad() {
    if (!eliminarNovedadSeleccionada) return;

    setProcesando(true);

    try {
      await eliminarNovedad(id, eliminarNovedadSeleccionada.id);

      mostrar("Novedad eliminada correctamente.", "exito");

      setEliminarNovedadSeleccionada(null);

      setDetalleNovedad(null);

      await cargar();
    } catch (e) {
      mostrar(
        e.response?.data?.error || "No se pudo eliminar la novedad.",
        "error",
      );
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return <SkeletonDetalle />;
  }

  if (!factura) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-graphite-200 text-graphite-500">
          <DescriptionRounded sx={{ fontSize: 28 }} aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-graphite-900">
          Factura no encontrada
        </h1>

        <p className="mt-1 text-sm text-graphite-500">
          No fue posible encontrar la factura solicitada.
        </p>

        <button
          type="button"
          onClick={() => navigate("/facturas")}
          className="mt-5 inline-flex min-h-touch items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <ArrowBackRounded sx={{ fontSize: 18 }} aria-hidden="true" />
          Volver a facturas
        </button>
      </div>
    );
  }

  const novedades = detalle?.novedades || [];
  const firmas = detalle?.firmas || [];

  return (
    <div className={"pb-8"}>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        {/* Navegación */}
        <button
          type="button"
          onClick={() => navigate("/facturas")}
          className="inline-flex min-h-touch items-center gap-1.5 text-sm font-medium text-graphite-600 transition hover:text-graphite-900"
        >
          <ArrowBackRounded sx={{ fontSize: 19 }} aria-hidden="true" />
          Volver a facturas
        </button>

        {/* Contenido */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Columna documento / firmas */}
          <div className="space-y-6">
            <VisorFactura factura={factura} />

            <Firmas
              firmas={firmas}
              onVerFirma={setFirmaSeleccionada}
            />
          </div>

          {/* Columna información / novedades */}
          <div className="space-y-6">
            <InformacionFactura
              factura={factura}
              puedeBodega={puedeBodega}
              onEditar={() => setEditarFacturaAbierto(true)}
              onEliminar={() => setEliminarFacturaAbierto(true)}
            />

            <Trazabilidad estadoActual={factura.estado_factura} />

            <Seccion
              titulo="Novedades"
              subtitulo={
                novedades.length
                  ? `${novedades.length} ${
                      novedades.length === 1
                        ? "novedad registrada"
                        : "novedades registradas"
                    }`
                  : "Incidencias encontradas durante la recepción"
              }
              icon={WarningAmberRounded}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm text-graphite-500">
                  {factura.total_novedades ?? novedades.length} novedades
                </div>

                {puedeBodega && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditarNovedad(null);
                      setModalNovedad(true);
                    }}
                    className="inline-flex min-h-touch items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    <Inventory2Rounded
                      sx={{ fontSize: 17 }}
                      aria-hidden="true"
                    />
                    Agregar
                  </button>
                )}
              </div>

              {novedades.length ? (
                <div className="grid gap-3">
                  {novedades.map((novedad) => (
                    <TarjetaNovedad
                      key={novedad.id}
                      novedad={novedad}
                      puedeBodega={puedeBodega}
                      onDetalle={setDetalleNovedad}
                      onEditar={(item) => {
                        setEditarNovedad(item);
                        setModalNovedad(true);
                      }}
                      onResolver={(item) =>
                        setResolver({
                          id: item.id,
                          texto: "",
                        })
                      }
                      onEliminar={setEliminarNovedadSeleccionada}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-graphite-200 bg-paper-50 p-6 text-center">
                  <CheckCircleRounded
                    className="text-moss-600"
                    sx={{ fontSize: 32 }}
                    aria-hidden="true"
                  />

                  <p className="mt-2 font-medium text-graphite-700">
                    Sin novedades registradas
                  </p>

                  <p className="mt-1 text-sm text-graphite-500">
                    No se han registrado incidencias para esta factura.
                  </p>
                </div>
              )}
            </Seccion>
          </div>
        </div>
      </div>

      {/* Firma para cambiar de etapa */}
      <SignatureModal
        abierto={firma}
        titulo={accion?.texto || "Firma"}
        guardando={procesando}
        onCerrar={() => {
          if (!procesando) {
            setFirma(false);
          }
        }}
        onConfirmar={ejecutar}
      />

      {/* Visor de firma registrada */}
      <VisorFirma
        firma={firmaSeleccionada}
        onCerrar={() => setFirmaSeleccionada(null)}
      />

      {/* Crear / editar novedad */}
      <NovedadModal
        abierto={modalNovedad}
        guardando={procesando}
        novedad={editarNovedad}
        onCerrar={() => {
          if (!procesando) {
            setModalNovedad(false);
            setEditarNovedad(null);
          }
        }}
        onGuardar={guardarNovedad}
      />

      {/* Detalle de novedad */}
      <DetalleNovedad
        abierto={Boolean(detalleNovedad)}
        novedad={detalleNovedad}
        puedeBodega={puedeBodega}
        onCerrar={() => setDetalleNovedad(null)}
        onEditar={(novedad) => {
          setDetalleNovedad(null);
          setEditarNovedad(novedad);
          setModalNovedad(true);
        }}
        onResolver={(novedad) => {
          setDetalleNovedad(null);
          setResolver({
            id: novedad.id,
            texto: "",
          });
        }}
      />

      {/* Resolver novedad */}
      {resolver && (
        <div className="fixed inset-0 z-[55] grid place-items-center bg-graphite-900/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolver-novedad-titulo"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-moss-100 text-moss-700">
                <CheckRounded
                  sx={{ fontSize: 21 }}
                  aria-hidden="true"
                />
              </span>

              <div>
                <h2
                  id="resolver-novedad-titulo"
                  className="font-semibold text-graphite-900"
                >
                  Resolver novedad
                </h2>

                <p className="mt-1 text-sm text-graphite-500">
                  Registra una observación sobre cómo fue solucionada.
                </p>
              </div>
            </div>

            <textarea
              value={resolver.texto}
              onChange={(evento) =>
                setResolver({
                  ...resolver,
                  texto: evento.target.value,
                })
              }
              className="mt-5 min-h-28 w-full resize-y rounded-xl border border-graphite-200 bg-white p-3 text-sm text-graphite-900 outline-none transition placeholder:text-graphite-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              placeholder="Observación de resolución"
              disabled={procesando}
            />

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setResolver(null)}
                disabled={procesando}
                className="min-h-touch rounded-xl px-4 py-2.5 text-sm font-medium text-graphite-600 hover:bg-paper-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarResolver}
                disabled={procesando}
                className="min-h-touch rounded-xl bg-moss-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {procesando ? "Guardando..." : "Confirmar resolución"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar factura */}
      <ModalEditarFactura
        abierto={editarFacturaAbierto}
        factura={factura}
        guardando={procesando}
        onCerrar={() => {
          if (!procesando) {
            setEditarFacturaAbierto(false);
          }
        }}
        onGuardar={guardarCambiosFactura}
      />

      {/* Eliminar factura */}
      <ModalConfirmacion
        abierto={eliminarFacturaAbierto}
        titulo="¿Eliminar factura?"
        descripcion="Esta acción eliminará la factura y su información relacionada. Esta operación debe ser permitida por el estado actual de la factura."
        textoConfirmar="Eliminar factura"
        peligro
        procesando={procesando}
        onCerrar={() => {
          if (!procesando) {
            setEliminarFacturaAbierto(false);
          }
        }}
        onConfirmar={confirmarEliminarFactura}
      />

      {/* Eliminar novedad */}
      <ModalConfirmacion
        abierto={Boolean(eliminarNovedadSeleccionada)}
        titulo="¿Eliminar novedad?"
        descripcion="La novedad seleccionada será eliminada de esta factura. Esta acción no se puede deshacer."
        textoConfirmar="Eliminar novedad"
        peligro
        procesando={procesando}
        onCerrar={() => {
          if (!procesando) {
            setEliminarNovedadSeleccionada(null);
          }
        }}
        onConfirmar={confirmarEliminarNovedad}
      />
    </div>
  );
}