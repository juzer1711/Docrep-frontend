import React from "react";
import {
  CheckCircleOutlineRounded,
  Inventory2Rounded,
  RateReviewRounded,
  TaskAltRounded,
} from "@mui/icons-material";

const CONFIG = {
  RECIBIDA: {
    texto: "Recibida",
    clases: "bg-sky-100 text-sky-700",
    Icono: Inventory2Rounded,
  },
  EN_REVISION: {
    texto: "En revisión",
    clases: "bg-sky-100 text-sky-700",
    Icono: RateReviewRounded,
  },
  ENTREGADA_ADMIN: {
    texto: "Entregada a admin.",
    clases: "bg-graphite-200 text-graphite-700",
    Icono: TaskAltRounded,
  },
  FINALIZADA: {
    texto: "Finalizada",
    clases: "bg-moss-100 text-moss-700",
    Icono: CheckCircleOutlineRounded,
  },
};

export default function StatusBadge({ estado }) {
  const configuracion = CONFIG[estado];

  if (!configuracion) {
    return (
      <span className="inline-flex items-center rounded-full bg-graphite-200 px-3 py-1.5 text-xs font-semibold text-graphite-700">
        {estado || "Sin estado"}
      </span>
    );
  }

  const { texto, clases, Icono } = configuracion;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${clases}`}
    >
      <Icono sx={{ fontSize: 15 }} aria-hidden="true" />
      {texto}
    </span>
  );
}