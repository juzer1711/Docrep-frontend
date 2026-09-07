import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FileCheck2,
  FileClock,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { listarFacturas } from "../api/facturasApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ESTADOS = {
  RECIBIDA: {
    label: "Recibidas",
    icon: PackageCheck,
  },
  EN_REVISION: {
    label: "En revisión",
    icon: FileClock,
  },
  CON_NOVEDAD: {
    label: "Con novedades",
    icon: AlertTriangle,
  },
  ENTREGADA_ADMIN: {
    label: "Entregadas",
    icon: FileCheck2,
  },
  FINALIZADA: {
    label: "Finalizadas",
    icon: ShieldCheck,
  },
};

function obtenerNombre(usuario) {
  return usuario?.nombre || usuario?.NOMBRE || "Usuario";
}

function obtenerRol(usuario) {
  return usuario?.rol || usuario?.ROL || "";
}

function obtenerSaludo() {
  const hora = new Date().getHours();

  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function Dashboard() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const { mostrar } = useToast();
  const { usuario } = useAuth();

  const nombre = obtenerNombre(usuario);
  const rol = obtenerRol(usuario);

  const puedeCrear = ["BODEGA", "ADMINISTRADOR", "ADMINISTRACION"].includes(
    rol
  );

  const esAdmin = rol === "ADMINISTRADOR";

  async function cargar() {
    setCargando(true);

    try {
      const data = await listarFacturas();
      setFacturas(Array.isArray(data) ? data : []);
    } catch (error) {
      mostrar("No se pudieron cargar las recepciones.", "error");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const resumen = useMemo(() => {
    return {
      RECIBIDA: facturas.filter(
        (factura) => factura.estado_factura === "RECIBIDA"
      ).length,

      EN_REVISION: facturas.filter(
        (factura) => factura.estado_factura === "EN_REVISION"
      ).length,

      CON_NOVEDAD: facturas.filter(
        (factura) => factura.estado_factura === "CON_NOVEDAD"
      ).length,

      ENTREGADA_ADMIN: facturas.filter(
        (factura) => factura.estado_factura === "ENTREGADA_ADMIN"
      ).length,

      FINALIZADA: facturas.filter(
        (factura) => factura.estado_factura === "FINALIZADA"
      ).length,
    };
  }, [facturas]);

  const recientes = useMemo(() => {
    return [...facturas]
      .sort((a, b) => {
        const fechaA = new Date(
          a.fecha_recepcion || a.fecha_creacion || 0
        ).getTime();

        const fechaB = new Date(
          b.fecha_recepcion || b.fecha_creacion || 0
        ).getTime();

        return fechaB - fechaA;
      })
      .slice(0, 5);
  }, [facturas]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
      {/* =====================================================
          ENCABEZADO
          ===================================================== */}
      <section className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-600">
              {obtenerSaludo()}
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-graphite-900 sm:text-3xl">
              {nombre}
            </h1>

            <p className="mt-1 text-sm text-graphite-500">
              Este es el estado actual de tus recepciones.
            </p>
          </div>

          <button
            type="button"
            onClick={cargar}
            disabled={cargando}
            aria-label="Actualizar información"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-xl border border-graphite-200 bg-white text-graphite-700 shadow-sm transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={19}
              className={cargando ? "animate-spin" : ""}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="mt-3 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
          {rol || "Usuario"}
        </div>
      </section>

      {/* =====================================================
          RESUMEN
          ===================================================== */}
      {cargando ? (
        <section
          aria-label="Cargando resumen"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-graphite-200 bg-white"
            />
          ))}
        </section>
      ) : (
        <section
          aria-label="Resumen de recepciones"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <ResumenCard
            titulo="Recibidas"
            cantidad={resumen.RECIBIDA}
            icon={PackageCheck}
            color="sky"
          />

          <ResumenCard
            titulo="En revisión"
            cantidad={resumen.EN_REVISION}
            icon={FileClock}
            color="blue"
          />

          <ResumenCard
            titulo="Novedades"
            cantidad={resumen.CON_NOVEDAD}
            icon={AlertTriangle}
            color="red"
          />

          <ResumenCard
            titulo="Finalizadas"
            cantidad={resumen.FINALIZADA}
            icon={ShieldCheck}
            color="green"
          />
        </section>
      )}

      {/* =====================================================
          ACCIONES RÁPIDAS
          ===================================================== */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-graphite-900">
            Acciones rápidas
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {puedeCrear && (
            <Link
              to="/nueva-recepcion"
              className="group flex min-h-[88px] items-center gap-4 rounded-2xl border border-sky-600 bg-sky-600 p-4 text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Plus size={25} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold">Nueva recepción</p>
                <p className="mt-0.5 text-xs text-blue-100">
                  Registrar una factura recibida
                </p>
              </div>

              <ArrowRight
                size={19}
                className="ml-auto shrink-0 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}

          <Link
            to="/bitacora"
            className="group flex min-h-[88px] items-center gap-4 rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <ClipboardList size={23} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-graphite-900">
                Ver bitácora
              </p>
              <p className="mt-0.5 text-xs text-graphite-500">
                Buscar y consultar facturas
              </p>
            </div>

            <ArrowRight
              size={19}
              className="ml-auto shrink-0 text-graphite-400 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          {esAdmin && (
            <Link
              to="/usuarios"
              className="group flex min-h-[88px] items-center gap-4 rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Users size={23} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-graphite-900">
                  Usuarios
                </p>
                <p className="mt-0.5 text-xs text-graphite-500">
                  Administrar accesos y roles
                </p>
              </div>

              <ArrowRight
                size={19}
                className="ml-auto shrink-0 text-graphite-400 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      </section>

      {/* =====================================================
          RECEPCIONES RECIENTES
          ===================================================== */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-graphite-900">
              Recepciones recientes
            </h2>

            <p className="mt-0.5 text-xs text-graphite-500">
              Últimos documentos registrados
            </p>
          </div>

          {facturas.length > 5 && (
            <Link
              to="/bitacora"
              className="text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              Ver todas
            </Link>
          )}
        </div>

        {cargando ? (
          <div className="rounded-2xl border border-graphite-200 bg-white p-8 text-center text-sm text-graphite-500">
            Cargando recepciones…
          </div>
        ) : recientes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-graphite-200 bg-white p-10 text-center">
            <PackageCheck
              size={36}
              className="mx-auto text-graphite-300"
              aria-hidden="true"
            />

            <p className="mt-3 font-medium text-graphite-700">
              Todavía no hay recepciones
            </p>

            <p className="mt-1 text-sm text-graphite-500">
              Las facturas registradas aparecerán aquí.
            </p>

            {puedeCrear && (
              <Link
                to="/nueva-recepcion"
                className="mt-5 inline-flex min-h-touch items-center rounded-xl bg-sky-600 px-5 font-semibold text-white hover:bg-sky-700"
              >
                Registrar recepción
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-graphite-200 bg-white shadow-sm">
            <div className="divide-y divide-graphite-200">
              {recientes.map((factura) => (
                <Link
                  key={factura.id}
                  to={`/facturas/${factura.id}`}
                  className="group flex min-h-[76px] items-center gap-3 px-4 py-3 transition hover:bg-paper-50 active:bg-paper-100 sm:px-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <PackageCheck size={19} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-graphite-900">
                      {factura.numero_factura || "Sin número"}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-graphite-500">
                      {factura.proveedor || "Proveedor no registrado"}
                    </p>
                  </div>

                  <div className="hidden shrink-0 sm:block">
                    <StatusBadge estado={factura.estado_factura} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="shrink-0 text-graphite-300 transition group-hover:translate-x-1 group-hover:text-sky-500"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ResumenCard({ titulo, cantidad, icon: Icon, color }) {
  const estilos = {
    sky: {
      contenedor: "bg-sky-100 text-sky-600",
      numero: "text-sky-700",
    },
    blue: {
      contenedor: "bg-blue-100 text-blue-600",
      numero: "text-blue-700",
    },
    red: {
      contenedor: "bg-red-100 text-red-600",
      numero: "text-red-700",
    },
    green: {
      contenedor: "bg-moss-100 text-moss-600",
      numero: "text-moss-700",
    },
  };

  const estilo = estilos[color] || estilos.sky;

  return (
    <article className="rounded-2xl border border-graphite-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${estilo.contenedor}`}
        >
          <Icon size={20} aria-hidden="true" />
        </div>

        <span className={`text-2xl font-bold ${estilo.numero}`}>
          {cantidad}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-graphite-600">
        {titulo}
      </p>
    </article>
  );
}
