import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarTodayRounded,
  CheckCircleOutlineRounded,
  FilterAltOffRounded,
  Inventory2Rounded,
  RefreshRounded,
  SearchRounded,
  VisibilityRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import { Skeleton } from "@mui/material";

import { listarFacturas } from "../api/facturasApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../components/ToastProvider.jsx";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "RECIBIDA", label: "Recibida" },
  { value: "EN_REVISION", label: "En revisión" },
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

function obtenerFiltrosActivos({
  texto,
  estado,
  novedades,
  fechaDesde,
  fechaHasta,
}) {
  return [
    Boolean(texto.trim()),
    Boolean(estado),
    Boolean(novedades),
    Boolean(fechaDesde),
    Boolean(fechaHasta),
  ].filter(Boolean).length;
}

function IndicadorNovedades({ cantidad }) {
  if (cantidad > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rust-100 px-2.5 py-1 text-xs font-semibold text-rust-700">
        <WarningAmberRounded sx={{ fontSize: 15 }} aria-hidden="true" />
        {cantidad} {cantidad === 1 ? "novedad" : "novedades"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-100 px-2.5 py-1 text-xs font-semibold text-moss-700">
      <CheckCircleOutlineRounded sx={{ fontSize: 15 }} aria-hidden="true" />
      Sin novedades
    </span>
  );
}

function FilaSkeleton() {
  return (
    <tr className="border-b border-graphite-100 last:border-0">
      <td className="px-5 py-4">
        <Skeleton variant="text" width={110} height={24} />
      </td>

      <td className="px-5 py-4">
        <Skeleton variant="text" width={180} height={24} />
      </td>

      <td className="px-5 py-4">
        <Skeleton variant="text" width={90} height={24} />
      </td>

      <td className="px-5 py-4">
        <Skeleton
          variant="rounded"
          width={105}
          height={30}
          sx={{ borderRadius: "999px" }}
        />
      </td>

      <td className="px-5 py-4">
        <Skeleton
          variant="rounded"
          width={120}
          height={30}
          sx={{ borderRadius: "999px", margin: "0 auto" }}
        />
      </td>

      <td className="px-5 py-4 text-right">
        <Skeleton
          variant="rounded"
          width={40}
          height={40}
          sx={{ borderRadius: "8px", marginLeft: "auto" }}
        />
      </td>
    </tr>
  );
}

function TarjetaSkeleton() {
  return (
    <div className="rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton variant="text" width="45%" height={25} />
          <Skeleton variant="text" width="75%" height={22} />
        </div>

        <Skeleton
          variant="rounded"
          width={95}
          height={30}
          sx={{ borderRadius: "999px" }}
        />
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-graphite-100 pt-3">
        <Skeleton variant="text" width={90} height={20} />
        <Skeleton
          variant="rounded"
          width={110}
          height={26}
          sx={{ borderRadius: "999px" }}
        />
      </div>
    </div>
  );
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

    const temporizador = window.setTimeout(
      async () => {
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
            mostrar(
              "No se pudo cargar la bitácora de recepciones.",
              "error"
            );
          }
        } finally {
          if (consultaActual.current === consultaId) {
            primeraCarga.current = false;
            setCargando(false);
            setActualizando(false);
          }
        }
      },
      cambioTexto ? 400 : 0
    );

    return () => window.clearTimeout(temporizador);
  }, [
    texto,
    estado,
    novedades,
    fechaDesde,
    fechaHasta,
    recarga,
    mostrar,
  ]);

  function cargarFacturas() {
    setRecarga((valor) => valor + 1);
  }

  const visibles = useMemo(() => {
    return [...facturas].sort((a, b) => {
      const fechaA = new Date(obtenerFecha(a) || 0).getTime();
      const fechaB = new Date(obtenerFecha(b) || 0).getTime();

      return fechaB - fechaA;
    });
  }, [facturas]);

  const filtrosActivos = obtenerFiltrosActivos({
    texto,
    estado,
    novedades,
    fechaDesde,
    fechaHasta,
  });

  const hayFiltrosActivos = filtrosActivos > 0;

  function limpiarFiltros() {
    setTexto("");
    setEstado("");
    setNovedades("");
    setFechaDesde("");
    setFechaHasta("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      {/* Encabezado */}
      <section className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sky-600">
              <Inventory2Rounded sx={{ fontSize: 20 }} aria-hidden="true" />

              <span className="text-sm font-semibold">
                Consulta operativa
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-graphite-900 sm:text-3xl">
              Bitácora de recepciones
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-500">
              Consulta, filtra y realiza seguimiento al estado de las
              facturas registradas en DOCREP.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarFacturas}
            disabled={cargando || actualizando}
            aria-label="Actualizar bitácora"
            title="Actualizar bitácora"
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl border border-graphite-200 bg-white text-graphite-700 shadow-sm transition hover:border-sky-500 hover:text-sky-600 focus-visible:border-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshRounded
              sx={{ fontSize: 20 }}
              className={actualizando ? "animate-spin" : ""}
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      {/* Filtros */}
      <section
        aria-label="Filtros de búsqueda"
        className="rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-graphite-900">
              Buscar y filtrar
            </h2>

            <p className="mt-0.5 text-xs text-graphite-500">
              Encuentra rápidamente una recepción registrada.
            </p>
          </div>

          {hayFiltrosActivos && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {filtrosActivos}{" "}
              {filtrosActivos === 1 ? "filtro activo" : "filtros activos"}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Búsqueda */}
          <div className="flex min-h-touch flex-1 items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
            <SearchRounded
              sx={{ fontSize: 20 }}
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
                title="Limpiar búsqueda"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-graphite-400 transition hover:bg-paper-100 hover:text-graphite-700 focus-visible:bg-paper-100"
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  ×
                </span>
              </button>
            )}
          </div>

          {/* Estado */}
          <div className="relative lg:w-56">
            <label htmlFor="filtro-estado" className="sr-only">
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

            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-graphite-400"
              aria-hidden="true"
            >
              ▼
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Fecha desde */}
          <div>
            <label
              htmlFor="fecha-desde"
              className="mb-1.5 block text-xs font-semibold text-graphite-600"
            >
              Fecha desde
            </label>

            <div className="flex min-h-touch items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
              <CalendarTodayRounded
                sx={{ fontSize: 18 }}
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

          {/* Fecha hasta */}
          <div>
            <label
              htmlFor="fecha-hasta"
              className="mb-1.5 block text-xs font-semibold text-graphite-600"
            >
              Fecha hasta
            </label>

            <div className="flex min-h-touch items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
              <CalendarTodayRounded
                sx={{ fontSize: 18 }}
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

          {/* Novedades */}
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

              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-graphite-400"
                aria-hidden="true"
              >
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Filtros activos */}
        {hayFiltrosActivos && (
          <div className="mt-4 flex flex-col gap-3 border-t border-graphite-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-graphite-500">
              Ajusta los criterios para encontrar las recepciones que
              necesitas.
            </p>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex min-h-[40px] w-fit items-center gap-2 rounded-lg px-3 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 hover:text-sky-700 focus-visible:bg-sky-100"
            >
              <FilterAltOffRounded sx={{ fontSize: 18 }} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {/* Registros */}
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
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
              <Inventory2Rounded sx={{ fontSize: 15 }} aria-hidden="true" />
              Recepciones registradas
            </div>
          )}
        </div>

        {/* Loading */}
        {cargando ? (
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
                  {Array.from({ length: 5 }).map((_, indice) => (
                    <FilaSkeleton key={indice} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
              {Array.from({ length: 4 }).map((_, indice) => (
                <TarjetaSkeleton key={indice} />
              ))}
            </div>
          </>
        ) : visibles.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-graphite-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-100 text-graphite-400">
              <SearchRounded sx={{ fontSize: 28 }} aria-hidden="true" />
            </div>

            <h3 className="mt-4 font-semibold text-graphite-800">
              {hayFiltrosActivos
                ? "No encontramos recepciones"
                : "Aún no hay recepciones"}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-graphite-500">
              {hayFiltrosActivos
                ? "No hay recepciones que coincidan con los criterios de búsqueda y filtros seleccionados."
                : "Cuando se registren nuevas recepciones, aparecerán aquí para su consulta y seguimiento."}
            </p>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-5 inline-flex min-h-touch items-center gap-2 rounded-xl bg-sky-600 px-5 font-semibold text-white transition hover:bg-sky-700 focus-visible:bg-sky-700"
              >
                <FilterAltOffRounded
                  sx={{ fontSize: 18 }}
                  aria-hidden="true"
                />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-graphite-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Bitácora de recepciones registradas
                </caption>

                <thead className="border-b border-graphite-200 bg-paper-100">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3.5 font-semibold text-graphite-700"
                    >
                      Factura
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3.5 font-semibold text-graphite-700"
                    >
                      Proveedor
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3.5 font-semibold text-graphite-700"
                    >
                      Fecha recepción
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3.5 font-semibold text-graphite-700"
                    >
                      Estado
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3.5 text-center font-semibold text-graphite-700"
                    >
                      Novedades
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3.5 text-right font-semibold text-graphite-700"
                    >
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
                            className="font-semibold text-sky-600 transition hover:text-sky-700 hover:underline focus-visible:rounded-sm"
                          >
                            {factura.numero_factura || "Sin número"}
                          </Link>
                        </td>

                        <td className="max-w-[240px] px-5 py-4 text-graphite-700">
                          <span
                            className="block truncate"
                            title={
                              factura.proveedor ||
                              "Proveedor no registrado"
                            }
                          >
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
                          <div className="flex justify-center">
                            <IndicadorNovedades
                              cantidad={cantidadNovedades}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/facturas/${factura.id}`}
                            aria-label={`Ver detalle de ${
                              factura.numero_factura || "la factura"
                            }`}
                            title="Ver detalle"
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-sky-600 transition hover:bg-sky-100 hover:text-sky-700 focus-visible:bg-sky-100"
                          >
                            <VisibilityRounded
                              sx={{ fontSize: 21 }}
                              aria-hidden="true"
                            />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards mobile/tablet */}
            <div className="flex flex-col gap-3 lg:hidden">
              {visibles.map((factura) => {
                const cantidadNovedades = Number(
                  factura?.total_novedades || 0
                );

                return (
                  <Link
                    key={factura.id}
                    to={`/facturas/${factura.id}`}
                    className="rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:bg-paper-100 focus-visible:border-sky-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-graphite-900">
                          {factura.numero_factura || "Sin número"}
                        </p>

                        <p className="mt-1 truncate text-sm text-graphite-500">
                          {factura.proveedor || "Proveedor no registrado"}
                        </p>
                      </div>

                      <StatusBadge estado={factura.estado_factura} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-graphite-100 pt-3 text-xs text-graphite-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarTodayRounded
                          sx={{ fontSize: 15 }}
                          aria-hidden="true"
                        />

                        {formatearFecha(obtenerFecha(factura))}
                      </span>

                      <span
                        className="text-graphite-300"
                        aria-hidden="true"
                      >
                        •
                      </span>

                      <IndicadorNovedades
                        cantidad={cantidadNovedades}
                      />

                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-sky-600">
                        <VisibilityRounded
                          sx={{ fontSize: 17 }}
                          aria-hidden="true"
                        />

                        Ver detalle
                      </span>
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