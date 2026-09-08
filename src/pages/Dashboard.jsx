import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import Skeleton from "@mui/material/Skeleton";

import { listarFacturas } from "../api/facturasApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const TARJETAS = {
  RECIBIDA: {
    titulo: "Recibidas",
    descripcion: "Facturas recibidas",
    Icon: Inventory2RoundedIcon,
  },

  EN_REVISION: {
    titulo: "En revisión",
    descripcion: "Pendientes de revisión",
    Icon: FactCheckRoundedIcon,
  },

  ENTREGADA_ADMIN: {
    titulo: "Entregadas",
    descripcion: "Entregadas a administración",
    Icon: AssignmentTurnedInRoundedIcon,
  },

  FINALIZADA: {
    titulo: "Finalizadas",
    descripcion: "Proceso completado",
    Icon: VerifiedRoundedIcon,
  },

  NOVEDADES: {
    titulo: "Novedades",
    descripcion: "Novedades registradas",
    Icon: WarningAmberRoundedIcon,
  },
};

const ACCIONES_POR_ROL = {
  BODEGA: [
    {
      ruta: "/nueva-recepcion",
      titulo: "Nueva recepción",
      descripcion: "Registrar una nueva factura recibida.",
      Icon: AddBoxRoundedIcon,
      primaria: true,
    },
    {
      ruta: "/facturas",
      titulo: "Ver facturas",
      descripcion: "Consultar y gestionar las facturas.",
      Icon: ReceiptLongRoundedIcon,
      primaria: false,
    },
  ],

  ADMINISTRADOR: [
    {
      ruta: "/nueva-recepcion",
      titulo: "Nueva recepción",
      descripcion: "Registrar una nueva factura recibida.",
      Icon: AddBoxRoundedIcon,
      primaria: true,
    },
    {
      ruta: "/facturas",
      titulo: "Ver facturas",
      descripcion: "Consultar y gestionar las facturas.",
      Icon: ReceiptLongRoundedIcon,
      primaria: false,
    },
    {
      ruta: "/usuarios",
      titulo: "Usuarios",
      descripcion: "Administrar los usuarios del sistema.",
      Icon: PeopleAltRoundedIcon,
      primaria: false,
    },
  ],

  CONTABILIDAD: [
    {
      ruta: "/facturas",
      titulo: "Ver facturas",
      descripcion: "Consultar las facturas de la operación.",
      Icon: ReceiptLongRoundedIcon,
      primaria: true,
    },
  ],
};

const CLAVES_POR_ROL = {
  BODEGA: [
    "RECIBIDA",
    "EN_REVISION",
    "ENTREGADA_ADMIN",
    "NOVEDADES",
  ],

  ADMINISTRADOR: [
    "RECIBIDA",
    "EN_REVISION",
    "ENTREGADA_ADMIN",
    "FINALIZADA",
    "NOVEDADES",
  ],

  CONTABILIDAD: [
    "ENTREGADA_ADMIN",
    "FINALIZADA",
  ],
};

function obtenerSaludo() {
  const hora = new Date().getHours();

  if (hora < 12) {
    return "Buenos días";
  }

  if (hora < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

function obtenerDescripcionRol(rol) {
  switch (rol) {
    case "BODEGA":
      return "Gestiona las recepciones y el seguimiento de las facturas.";

    case "ADMINISTRADOR":
      return "Supervisa la operación y administra el sistema.";

    case "CONTABILIDAD":
      return "Consulta las facturas entregadas y finalizadas.";

    default:
      return "Consulta el estado actual de la operación.";
  }
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Fecha no disponible";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(valor);
}

function obtenerFechaOrden(fecha) {
  if (!fecha) {
    return 0;
  }

  const valor = new Date(fecha).getTime();

  return Number.isNaN(valor) ? 0 : valor;
}

function obtenerTextoEstado(estado) {
  switch (estado) {
    case "RECIBIDA":
      return "Recibida";

    case "EN_REVISION":
      return "En revisión";

    case "ENTREGADA_ADMIN":
      return "Entregada";

    case "FINALIZADA":
      return "Finalizada";

    default:
      return estado || "Sin estado";
  }
}

function IndicadorSkeleton() {
  return (
    <div className="rounded-xl border border-graphite-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton variant="rounded" width={40} height={40} />
        <Skeleton variant="rounded" width={54} height={24} />
      </div>

      <Skeleton
        variant="text"
        width={58}
        height={42}
        className="mt-3"
      />

      <Skeleton
        variant="text"
        width={130}
        height={24}
      />

      <Skeleton
        variant="text"
        width={170}
        height={20}
      />
    </div>
  );
}

function FacturaRecienteSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-graphite-200 py-4 last:border-b-0">
      <Skeleton variant="rounded" width={42} height={42} />

      <div className="min-w-0 flex-1">
        <Skeleton variant="text" width="45%" height={24} />
        <Skeleton variant="text" width="65%" height={20} />
      </div>

      <div className="hidden sm:block">
        <Skeleton variant="rounded" width={90} height={26} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const { mostrar } = useToast();

  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarFacturas = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const datos = await listarFacturas();
      setFacturas(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error("Error cargando Dashboard:", err);

      setFacturas([]);
      setError("No pudimos cargar el resumen de la operación.");

      mostrar(
        "No se pudieron cargar las facturas.",
        "error"
      );
    } finally {
      setCargando(false);
    }
  }, [mostrar]);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const rol = usuario?.rol;

  const claves = useMemo(() => {
    return CLAVES_POR_ROL[rol] || [];
  }, [rol]);

  const resumen = useMemo(() => {
    return {
      RECIBIDA: facturas.filter(
        (factura) =>
          factura.estado_factura === "RECIBIDA"
      ).length,

      EN_REVISION: facturas.filter(
        (factura) =>
          factura.estado_factura === "EN_REVISION"
      ).length,

      ENTREGADA_ADMIN: facturas.filter(
        (factura) =>
          factura.estado_factura === "ENTREGADA_ADMIN"
      ).length,

      FINALIZADA: facturas.filter(
        (factura) =>
          factura.estado_factura === "FINALIZADA"
      ).length,

      NOVEDADES: facturas.reduce(
        (total, factura) =>
          total + Number(factura.total_novedades || 0),
        0
      ),
    };
  }, [facturas]);

  const facturasRecientes = useMemo(() => {
    return [...facturas]
      .sort(
        (a, b) =>
          obtenerFechaOrden(b.fecha_recepcion) -
          obtenerFechaOrden(a.fecha_recepcion)
      )
      .slice(0, 5);
  }, [facturas]);

  const acciones = useMemo(() => {
    return ACCIONES_POR_ROL[rol] || [];
  }, [rol]);

  const saludo = obtenerSaludo();
  const nombre = usuario?.nombre || "usuario";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      {/* =====================================================
          CABECERA
      ====================================================== */}
      <header className="mb-7">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-sky-700">
            {rol}
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-graphite-900 sm:text-3xl">
            {saludo}, {nombre}
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-graphite-500 sm:text-base">
            {obtenerDescripcionRol(rol)}
          </p>
        </div>
      </header>

      {/* =====================================================
          ERROR GENERAL
      ====================================================== */}
      {error && (
        <section
          className="mb-7 rounded-xl border border-rust-100 bg-rust-100/50 p-4"
          role="alert"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rust-100 text-rust-700">
                <WarningAmberRoundedIcon />
              </div>

              <div>
                <h2 className="font-semibold text-graphite-900">
                  No pudimos cargar el resumen
                </h2>

                <p className="mt-1 text-sm text-graphite-700">
                  Comprueba tu conexión e inténtalo nuevamente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarFacturas}
              className="flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-graphite-900 shadow-sm ring-1 ring-inset ring-graphite-200 transition-colors duration-150 hover:bg-paper-50"
            >
              <RefreshRoundedIcon fontSize="small" />
              Reintentar
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          INDICADORES
      ====================================================== */}
      <section aria-labelledby="indicadores-heading">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2
              id="indicadores-heading"
              className="text-base font-semibold text-graphite-900"
            >
              Estado de la operación
            </h2>

            <p className="mt-0.5 text-sm text-graphite-500">
              Resumen actual de las facturas.
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {claves.map((clave) => (
              <IndicadorSkeleton key={clave} />
            ))}
          </div>
        ) : (
          <div
            className={`grid gap-3 ${
              claves.length === 5
                ? "sm:grid-cols-2 lg:grid-cols-5"
                : claves.length === 4
                  ? "sm:grid-cols-2 lg:grid-cols-4"
                  : "sm:grid-cols-2"
            }`}
          >
            {claves.map((clave) => {
              const tarjeta = TARJETAS[clave];
              const Icon = tarjeta.Icon;

              return (
                <div
                  key={clave}
                  className="rounded-xl border border-graphite-200 bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <Icon fontSize="small" />
                    </div>

                    {clave === "NOVEDADES" &&
                      resumen[clave] > 0 && (
                        <span className="rounded-full bg-rust-100 px-2 py-1 text-xs font-semibold text-rust-700">
                          Atención
                        </span>
                      )}
                  </div>

                  <p className="mt-4 text-3xl font-semibold tracking-tight text-graphite-900">
                    {resumen[clave]}
                  </p>

                  <p className="mt-1 text-sm font-medium text-graphite-700">
                    {tarjeta.titulo}
                  </p>

                  <p className="mt-0.5 text-xs text-graphite-500">
                    {tarjeta.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        {/* ===================================================
            ACCIONES RÁPIDAS
        ==================================================== */}
        <section aria-labelledby="acciones-heading">
          <div className="mb-3">
            <h2
              id="acciones-heading"
              className="text-base font-semibold text-graphite-900"
            >
              Acciones rápidas
            </h2>

            <p className="mt-0.5 text-sm text-graphite-500">
              Accede directamente a las tareas disponibles.
            </p>
          </div>

          <div className="grid gap-3">
            {acciones.map((accion) => {
              const Icon = accion.Icon;

              return (
                <Link
                  key={accion.ruta}
                  to={accion.ruta}
                  className={`group flex min-h-touch items-center gap-4 rounded-xl border p-4 transition-all duration-150 ${
                    accion.primaria
                      ? "border-sky-600 bg-sky-600 text-white shadow-sm hover:bg-sky-700 hover:shadow-md"
                      : "border-graphite-200 bg-white text-graphite-900 shadow-sm hover:border-graphite-300 hover:bg-paper-50 hover:shadow-md"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      accion.primaria
                        ? "bg-white/15"
                        : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    <Icon />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        accion.primaria
                          ? "text-white"
                          : "text-graphite-900"
                      }`}
                    >
                      {accion.titulo}
                    </span>

                    <span
                      className={`mt-0.5 block text-xs leading-5 ${
                        accion.primaria
                          ? "text-white/80"
                          : "text-graphite-500"
                      }`}
                    >
                      {accion.descripcion}
                    </span>
                  </span>

                  <ArrowForwardRoundedIcon
                    className={`shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${
                      accion.primaria
                        ? "text-white/80"
                        : "text-graphite-400"
                    }`}
                    fontSize="small"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* ===================================================
            FACTURAS RECIENTES
        ==================================================== */}
        <section
          aria-labelledby="recientes-heading"
          className="min-w-0 rounded-xl border border-graphite-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-graphite-200 px-4 py-4 sm:px-5">
            <div>
              <h2
                id="recientes-heading"
                className="text-base font-semibold text-graphite-900"
              >
                Facturas recientes
              </h2>

              <p className="mt-0.5 text-sm text-graphite-500">
                Últimas facturas registradas.
              </p>
            </div>

            {!cargando && facturas.length > 0 && (
              <Link
                to="/facturas"
                className="hidden min-h-touch items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 transition-colors duration-150 hover:bg-sky-100 sm:flex"
              >
                Ver todas
                <ArrowForwardRoundedIcon fontSize="small" />
              </Link>
            )}
          </div>

          <div className="px-4 sm:px-5">
            {cargando ? (
              <>
                <FacturaRecienteSkeleton />
                <FacturaRecienteSkeleton />
                <FacturaRecienteSkeleton />
                <FacturaRecienteSkeleton />
              </>
            ) : facturasRecientes.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper-100 text-graphite-500">
                  <ReceiptLongRoundedIcon />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-graphite-900">
                  No hay facturas para mostrar
                </h3>

                <p className="mt-1 max-w-sm text-sm leading-5 text-graphite-500">
                  Las facturas registradas aparecerán aquí.
                </p>

                {["BODEGA", "ADMINISTRADOR"].includes(rol) && (
                  <Link
                    to="/nueva-recepcion"
                    className="mt-4 flex min-h-touch items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-sky-700"
                  >
                    <AddBoxRoundedIcon fontSize="small" />
                    Nueva recepción
                  </Link>
                )}
              </div>
            ) : (
              <>
                {facturasRecientes.map((factura) => (
                  <Link
                    key={factura.id}
                    to={`/facturas/${factura.id}`}
                    className="group flex min-h-touch items-center gap-3 border-b border-graphite-200 py-4 last:border-b-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper-100 text-graphite-500 transition-colors duration-150 group-hover:bg-sky-100 group-hover:text-sky-700">
                      <ReceiptLongRoundedIcon fontSize="small" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graphite-900">
                        {factura.numero_factura ||
                          "Factura sin número"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-graphite-500">
                        {factura.proveedor ||
                          "Proveedor no disponible"}
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-xs text-graphite-500">
                        <CalendarTodayRoundedIcon
                          sx={{ fontSize: 13 }}
                        />

                        <span>
                          {formatearFecha(
                            factura.fecha_recepcion
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="hidden shrink-0 sm:block">
                      <StatusBadge
                        estado={factura.estado_factura}
                      />
                    </div>

                    <ArrowForwardRoundedIcon
                      fontSize="small"
                      className="shrink-0 text-graphite-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-sky-600"
                    />
                  </Link>
                ))}

                <div className="border-t border-graphite-200 py-3 sm:hidden">
                  <Link
                    to="/facturas"
                    className="flex min-h-touch items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 transition-colors duration-150 hover:bg-sky-100"
                  >
                    Ver todas las facturas
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
