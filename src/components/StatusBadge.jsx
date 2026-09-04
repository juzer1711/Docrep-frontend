import React from "react";

const CONFIG = {
  RECIBIDA: { texto: "Recibida", clases: "bg-sky-100 text-sky-600" },
  EN_REVISION: { texto: "En revisión", clases: "bg-amber-100 text-amber-600" },
  ENTREGADA_ADMIN: { texto: "Entregada a admin.", clases: "bg-graphite-200 text-graphite-700" },
  FINALIZADA: { texto: "Finalizada", clases: "bg-moss-100 text-moss-600" }
};

export default function StatusBadge({ estado }) {
  const { texto, clases } = CONFIG[estado] || { texto: estado, clases: "bg-graphite-200 text-graphite-700" };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${clases}`}>
      {texto}
    </span>
  );
}
