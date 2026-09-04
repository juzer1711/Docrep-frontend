import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, PackageSearch } from "lucide-react";
import { listarFacturas } from "../api/facturasApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ESTADOS = ["RECIBIDA", "EN_REVISION", "ENTREGADA_ADMIN", "FINALIZADA"];

export default function Dashboard() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(null);
  const { mostrar } = useToast();
  const { usuario } = useAuth();
  const puedeCrear = ["BODEGA", "ADMINISTRADOR", "ADMINISTRACION"].includes(usuario?.rol);
  const titulo = usuario?.rol === "BODEGA" ? "Recepciones de bodega" : ["REVISION", "CONTABILIDAD"].includes(usuario?.rol) ? "Revisión y auditoría" : "Panel de administración";

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarFacturas();
      setFacturas(data);
    } catch (error) {
      mostrar("No se pudo cargar el listado de facturas.", "error");
    } finally {
      setCargando(false);
    }
  }

  const filtradas = useMemo(() => {
    return facturas.filter((f) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideTexto =
        !texto ||
        f.numero_factura?.toLowerCase().includes(texto) ||
        f.proveedor?.toLowerCase().includes(texto);
      const coincideEstado = !filtroEstado || f.estado_factura === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [facturas, busqueda, filtroEstado]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-5">
      <h1 className="mb-1 text-2xl font-semibold text-graphite-900">{titulo}</h1>
      <p className="mb-4 text-sm text-graphite-500">{usuario?.nombre || usuario?.NOMBRE} · {usuario?.rol}</p>

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-graphite-200 bg-white px-3">
        <Search size={18} className="text-graphite-500" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por N° de factura o proveedor"
          className="min-h-touch w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltroEstado(null)}
          className={`min-h-touch shrink-0 rounded-full border px-4 text-sm font-medium ${
            !filtroEstado ? "border-graphite-900 bg-graphite-900 text-white" : "border-graphite-200 text-graphite-700"
          }`}
        >
          Todas
        </button>
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`min-h-touch shrink-0 rounded-full border px-4 text-sm font-medium ${
              filtroEstado === estado ? "border-graphite-900 bg-graphite-900 text-white" : "border-graphite-200 text-graphite-700"
            }`}
          >
            <StatusBadge estado={estado} />
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="py-10 text-center text-sm text-graphite-500">Cargando facturas…</p>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-graphite-500">
          <PackageSearch size={36} />
          <p className="text-sm">No hay facturas que coincidan. Registra una nueva recepción para empezar.</p>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtradas.map((f) => (
              <Link
                key={f.id}
                to={`/facturas/${f.id}`}
                className="rounded-lg border border-graphite-200 bg-white p-4 active:bg-paper-100"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{f.numero_factura}</span>
                  <StatusBadge estado={f.estado_factura} />
                </div>
                <p className="text-sm text-graphite-500">{f.proveedor}</p>
                {f.sincronizada === false && (
                  <p className="mt-1 text-xs font-medium text-amber-600">Pendiente de sincronizar</p>
                )}
              </Link>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-lg border border-graphite-200 bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-graphite-200 bg-paper-100 text-graphite-700">
                <tr>
                  <th className="px-4 py-3 font-medium">N° Factura</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr key={f.id} className="border-b border-graphite-200 last:border-0 hover:bg-paper-50">
                    <td className="px-4 py-3">
                      <Link to={`/facturas/${f.id}`} className="font-medium text-sky-600 hover:underline">
                        {f.numero_factura}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-graphite-700">{f.proveedor}</td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={f.estado_factura} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {puedeCrear && <Link
        to="/nueva-recepcion"
        aria-label="Nueva recepción"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-graphite-900 shadow-lg active:scale-95"
      >
        <Plus size={26} />
      </Link>}
    </div>
  );
}
