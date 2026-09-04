import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listarFacturas } from "../api/facturasApi.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Bitacora() {
  const [facturas, setFacturas] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  useEffect(() => { listarFacturas().then(setFacturas).finally(() => setCargando(false)); }, []);
  const visibles = useMemo(() => facturas.filter((f) => `${f.numero_factura} ${f.proveedor}`.toLowerCase().includes(texto.toLowerCase())), [facturas, texto]);
  return <div className="mx-auto max-w-5xl px-4 py-6">
    <h1 className="text-2xl font-semibold">Bitácora de recepciones</h1>
    <p className="mt-1 text-sm text-graphite-500">Consulta el historial y el estado de cada factura registrada.</p>
    <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Filtrar por factura o proveedor" className="mt-5 min-h-touch w-full rounded-lg border border-graphite-200 bg-white px-3 outline-none" />
    <div className="mt-4 overflow-x-auto rounded-lg border border-graphite-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-paper-100 text-graphite-700"><tr><th className="px-4 py-3">Factura</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Novedades</th></tr></thead><tbody>{cargando ? <tr><td colSpan="5" className="p-6 text-center">Cargando…</td></tr> : visibles.map((f) => <tr key={f.id} className="border-t border-graphite-200"><td className="px-4 py-3"><Link className="font-medium text-sky-600" to={`/facturas/${f.id}`}>{f.numero_factura}</Link></td><td className="px-4 py-3">{f.proveedor}</td><td className="px-4 py-3">{f.fecha_recepcion ? new Date(f.fecha_recepcion).toLocaleDateString() : "—"}</td><td className="px-4 py-3"><StatusBadge estado={f.estado_factura} /></td><td className="px-4 py-3">{f.total_novedades}</td></tr>)}</tbody></table></div>
  </div>;
}
