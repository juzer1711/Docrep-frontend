import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import CameraInput from "./CameraInput.jsx";

const TIPOS = ["AVERIADO", "INCOMPLETO", "EXCEDENTE"];

const ESTADO_INICIAL = {
  codigo_referencia: "",
  descripcion_producto: "",
  tipo_novedad: TIPOS[0],
  cantidad: "",
  observaciones: ""
};

export default function NovedadModal({ abierto, onCerrar, onGuardar, guardando, novedad = null }) {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    if (abierto) setForm(novedad ? { codigo_referencia: novedad.codigo_referencia || "", descripcion_producto: novedad.descripcion_producto || "", tipo_novedad: novedad.tipo_novedad || TIPOS[0], cantidad: novedad.cantidad || "", observaciones: novedad.observaciones || "" } : ESTADO_INICIAL);
  }, [abierto, novedad]);

  if (!abierto) return null;

  const actualizar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function guardar() {
    if (!form.codigo_referencia.trim() || !form.descripcion_producto.trim() || !form.cantidad) return;
    onGuardar({ ...form, foto_evidencia: foto });
    setForm(ESTADO_INICIAL);
    setFoto(null);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-graphite-900/60 sm:items-center">
      <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white sm:w-[520px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-graphite-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{novedad ? "Editar novedad" : "Registrar novedad"}</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="flex min-h-touch min-w-touch items-center justify-center">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-graphite-700">Código de referencia *</label>
            <input
              value={form.codigo_referencia}
              onChange={actualizar("codigo_referencia")}
              className="min-h-touch w-full rounded-lg border border-graphite-200 px-4 text-base outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-graphite-700">Descripción del producto *</label>
            <input
              value={form.descripcion_producto}
              onChange={actualizar("descripcion_producto")}
              className="min-h-touch w-full rounded-lg border border-graphite-200 px-4 text-base outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-graphite-700">Tipo de novedad *</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setForm((f) => ({ ...f, tipo_novedad: tipo }))}
                  className={`min-h-touch rounded-full border px-4 text-sm font-medium ${
                    form.tipo_novedad === tipo
                      ? "border-graphite-900 bg-graphite-900 text-white"
                      : "border-graphite-200 text-graphite-700"
                  }`}
                >
                  {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-graphite-700">Cantidad *</label>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={actualizar("cantidad")}
              className="min-h-touch w-full rounded-lg border border-graphite-200 px-4 text-base outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-graphite-700">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={actualizar("observaciones")}
              rows={3}
              className="w-full rounded-lg border border-graphite-200 px-4 py-2 text-base outline-none focus:border-amber-500"
            />
          </div>

          <CameraInput etiqueta="Foto de evidencia (opcional)" onCapturar={setFoto} />
        </div>

        <div className="border-t border-graphite-200 p-5">
          <button
            onClick={guardar}
            disabled={guardando}
            className="min-h-touch w-full rounded-lg bg-amber-500 font-semibold text-graphite-900 disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar novedad"}
          </button>
        </div>
      </div>
    </div>
  );
}
