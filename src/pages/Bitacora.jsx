import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileSearch,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { listarFacturas } from "../api/facturasApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../components/ToastProvider.jsx";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "RECIBIDA", label: "Recibida" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "CON_NOVEDAD", label: "Con novedad" },
  { value: "ENTREGADA_ADMIN", label: "Entregada a administración" },
  { value: "FINALIZADA", label: "Finalizada" },
];

const NOVEDADES = [
  { value: "", label: "Todas" },
  { value: "con", label: "Con novedades" },
  { value: "sin", label: "Sin novedades" },
];

function obtenerFecha(factura) {
  return factura?.fecha_recepcion || factura?.fecha_creacion || null;
}
function formatearFecha(fecha) {
  if (!fecha) return "—";

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return "—";
  }

  return fechaObj.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Bitacora() {
  const [facturas, setFacturas] = useState([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("");
  const [novedades, setNovedades] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const consultaActual = useRef(0);
  const textoAnterior = useRef("");
  const primeraCarga = useRef(true);

  const { mostrar } = useToast();

  useEffect(() => {
    const cambioTexto = texto !== textoAnterior.current;
    textoAnterior.current = texto;
    const consultaId = ++consultaActual.current;
    const esPrimeraCarga = primeraCarga.current;

    const temporizador = window.setTimeout(async () => {
      if (esPrimeraCarga) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      try {
        const data = await listarFacturas({
          buscar: texto,
          estado,
          novedades,
          fechaDesde,
          fechaHasta,
        });

        if (consultaActual.current === consultaId) {
          setFacturas(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (consultaActual.current === consultaId) {
          mostrar("No se pudo cargar la bitácora de recepciones.", "error");
        }
      } finally {
        if (consultaActual.current === consultaId) {
          primeraCarga.current = false;
          setCargando(false);
          setActualizando(false);
        }
      }
    }, cambioTexto ? 400 : 0);

    return () => window.clearTimeout(temporizador);
  }, [texto, estado, novedades, fechaDesde, fechaHasta, recarga, mostrar]);

  function cargarFacturas() {
    setRecarga((valor) => valor + 1);
  }

  const visibles = useMemo(() => {
    return [...facturas]
      .sort((a, b) => {
        const fechaA = new Date(obtenerFecha(a) || 0).getTime();
        const fechaB = new Date(obtenerFecha(b) || 0).getTime();

        return fechaB - fechaA;
      });
  }, [facturas]);

  const hayFiltrosActivos =
    Boolean(texto.trim()) ||
    Boolean(estado) ||
    Boolean(novedades) ||
    Boolean(fechaDesde) ||
    Boolean(fechaHasta);

  function limpiarFiltros() {
    setTexto("");
    setEstado("");
    setNovedades("");
    setFechaDesde("");
    setFechaHasta("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <section className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sky-600">
              <ClipboardList size={19} aria-hidden="true" />
              <span className="text-sm font-semibold">Trazabilidad</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-graphite-900 sm:text-3xl">
              Bitácora de recepciones
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-graphite-500">
              Consulta, filtra y realiza seguimiento al estado de las
              facturas registradas en DOCREP.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarFacturas}
            disabled={cargando || actualizando}
            aria-label="Actualizar bitácora"
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl border border-graphite-200 bg-white text-graphite-700 shadow-sm transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={19}
              className={actualizando ? "animate-spin" : ""}
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex min-h-touch flex-1 items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
            <Search
              size={19}
              className="shrink-0 text-graphite-400"
              aria-hidden="true"
            />

            <label htmlFor="buscar-bitacora" className="sr-only">
              Buscar factura o proveedor
            </label>

            <input
              id="buscar-bitacora"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por número de factura o proveedor"
              className="min-h-touch w-full bg-transparent px-3 text-sm text-graphite-900 outline-none placeholder:text-graphite-400"
            />

            {texto && (
              <button
                type="button"
                onClick={() => setTexto("")}
                aria-label="Limpiar búsqueda"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-graphite-400 hover:bg-paper-100 hover:text-graphite-700"
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="relative lg:w-56">
            <label
              htmlFor="filtro-estado"
              className="sr-only"
            >
              Filtrar por estado
            </label>

            <select
              id="filtro-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="min-h-touch w-full appearance-none rounded-xl border border-graphite-200 bg-white px-3 pr-10 text-sm text-graphite-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              {ESTADOS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="fecha-desde"
              className="mb-1.5 block text-xs font-semibold text-graphite-600"
            >
              Fecha desde
            </label>

            <div className="flex min-h-touch items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
              <CalendarDays
                size={18}
                className="shrink-0 text-graphite-400"
                aria-hidden="true"
              />

              <input
                id="fecha-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="min-h-touch w-full bg-transparent px-3 text-sm text-graphite-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="fecha-hasta"
              className="mb-1.5 block text-xs font-semibold text-graphite-600"
            >
              Fecha hasta
            </label>

            <div className="flex min-h-touch items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
              <CalendarDays
                size={18}
                className="shrink-0 text-graphite-400"
                aria-hidden="true"
              />

              <input
                id="fecha-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="min-h-touch w-full bg-transparent px-3 text-sm text-graphite-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filtro-novedades"
              className="mb-1.5 block text-xs font-semibold text-graphite-600"
            >
              Novedades
            </label>

            <div className="relative">
              <select
                id="filtro-novedades"
                value={novedades}
                onChange={(e) => setNovedades(e.target.value)}
                className="min-h-touch w-full appearance-none rounded-xl border border-graphite-200 bg-white px-3 pr-10 text-sm text-graphite-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              >
                {NOVEDADES.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-graphite-100 pt-4">
            <p className="text-xs text-graphite-500">
              Hay filtros activos sobre la bitácora.
            </p>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 hover:text-sky-700"
            >
              <X size={16} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-graphite-900">
              Registros
            </h2>

            <p className="mt-0.5 text-xs text-graphite-500">
              {cargando
                ? "Cargando información…"
                : `${visibles.length} ${
                    visibles.length === 1 ? "resultado" : "resultados"
                  }`}
            </p>
          </div>

          {!cargando && visibles.length > 0 && (
            <div className="hidden items-center gap-2 rounded-full bg-paper-100 px-3 py-1.5 text-xs font-medium text-graphite-600 sm:flex">
              <FileSearch size={15} aria-hidden="true" />
              Consulta de recepciones
            </div>
          )}
        </div>

        {cargando ? (
          <div className="rounded-2xl border border-graphite-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-sky-600"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm font-medium text-graphite-700">
              Cargando bitácora…
            </p>

            <p className="mt-1 text-xs text-graphite-500">
              Estamos consultando las recepciones registradas.
            </p>
          </div>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-graphite-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-100 text-graphite-400">
              <FileSearch size={28} aria-hidden="true" />
            </div>

            <h3 className="mt-4 font-semibold text-graphite-800">
              No encontramos registros
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-graphite-500">
              No hay recepciones que coincidan con los criterios de búsqueda
              y filtros seleccionados.
            </p>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-5 inline-flex min-h-touch items-center gap-2 rounded-xl bg-sky-600 px-5 font-semibold text-white transition hover:bg-sky-700"
              >
                <X size={17} aria-hidden="true" />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-graphite-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-graphite-200 bg-paper-100">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-graphite-700">
                      Factura
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-graphite-700">
                      Proveedor
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-graphite-700">
                      Fecha recepción
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-graphite-700">
                      Estado
                    </th>

                    <th className="px-5 py-3.5 text-center font-semibold text-graphite-700">
                      Novedades
                    </th>

                    <th className="px-5 py-3.5 text-right font-semibold text-graphite-700">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibles.map((factura) => {
                    const cantidadNovedades = Number(
                      factura?.total_novedades || 0
                    );

                    return (
                      <tr
                        key={factura.id}
                        className="border-b border-graphite-100 last:border-0 hover:bg-paper-50"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={`/facturas/${factura.id}`}
                            className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            {factura.numero_factura || "Sin número"}
                          </Link>
                        </td>

                        <td className="max-w-[240px] px-5 py-4 text-graphite-700">
                          <span className="block truncate">
                            {factura.proveedor || "Proveedor no registrado"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-graphite-600">
                          {formatearFecha(obtenerFecha(factura))}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge estado={factura.estado_factura} />
                        </td>

                        <td className="px-5 py-4 text-center">
                          {cantidadNovedades > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rust-100 px-2.5 py-1 text-xs font-semibold text-rust-700">
                              <AlertTriangle
                                size={14}
                                aria-hidden="true"
                              />
                              {cantidadNovedades}
                            </span>
                          ) : (
                            <span className="text-xs text-graphite-400">
                              Sin novedades
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/facturas/${factura.id}`}
                            className="inline-flex min-h-[40px] items-center rounded-lg px-3 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 hover:text-sky-700"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
              {visibles.map((factura) => {
                const cantidadNovedades = Number(
                  factura?.total_novedades || 0
                );

                return (
                  <Link
                    key={factura.id}
                    to={`/facturas/${factura.id}`}
                    className="rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:bg-paper-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-graphite-900">
                          {factura.numero_factura || "Sin número"}
                        </p>

                        <p className="mt-1 truncate text-sm text-graphite-500">
                          {factura.proveedor || "Proveedor no registrado"}
                        </p>
                      </div>

                      <StatusBadge estado={factura.estado_factura} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-graphite-100 pt-3 text-xs text-graphite-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} aria-hidden="true" />
                        {formatearFecha(obtenerFecha(factura))}
                      </span>

                      <span className="text-graphite-300">•</span>

                      {cantidadNovedades > 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rust-600">
                          <AlertTriangle
                            size={14}
                            aria-hidden="true"
                          />
                          {cantidadNovedades}{" "}
                          {cantidadNovedades === 1
                            ? "novedad"
                            : "novedades"}
                        </span>
                      ) : (
                        <span>Sin novedades</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
