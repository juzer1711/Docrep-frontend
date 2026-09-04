import React, { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";

export default function CameraInput({ etiqueta, onCapturar, requerido = false }) {
  const inputRef = useRef(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setVistaPrevia(URL.createObjectURL(archivo));
    onCapturar(archivo);
  }

  function limpiar() {
    setVistaPrevia(null);
    onCapturar(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-graphite-700">
        {etiqueta} {requerido && <span className="text-rust-600">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={manejarArchivo}
        className="hidden"
        id={`camera-${etiqueta}`}
      />

      {!vistaPrevia ? (
        <label
          htmlFor={`camera-${etiqueta}`}
          className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-graphite-200 bg-paper-100 text-graphite-500 active:bg-paper-50"
        >
          <Camera size={28} />
          <span className="text-sm font-medium">Tomar foto</span>
        </label>
      ) : (
        <div className="relative">
          <img src={vistaPrevia} alt="Vista previa" className="max-h-64 w-full rounded-lg object-cover" />
          <button
            type="button"
            onClick={limpiar}
            className="absolute right-2 top-2 flex min-h-touch min-w-touch items-center justify-center gap-1 rounded-full bg-graphite-900/80 px-3 text-sm text-white"
          >
            <RotateCcw size={16} /> Repetir
          </button>
        </div>
      )}
    </div>
  );
}
