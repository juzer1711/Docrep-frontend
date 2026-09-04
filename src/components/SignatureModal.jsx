import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, X } from "lucide-react";

export default function SignatureModal({ abierto, titulo, onConfirmar, onCerrar }) {
  const padRef = useRef(null);
  const [vacio, setVacio] = useState(true);

  if (!abierto) return null;

  function limpiar() {
    padRef.current?.clear();
    setVacio(true);
  }

  function confirmar() {
    if (padRef.current?.isEmpty()) return;
    const firma_base64 = padRef.current.getTrimmedCanvas().toDataURL("image/png");
    onConfirmar(firma_base64);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-graphite-900/60 sm:items-center">
      <div className="flex h-[85vh] w-full flex-col rounded-t-2xl bg-white sm:h-auto sm:w-[520px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-graphite-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex min-h-touch min-w-touch items-center justify-center"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 p-5">
          <p className="mb-3 text-sm text-graphite-500">Firme con el dedo dentro del recuadro.</p>
          <div className="h-56 rounded-lg border-2 border-graphite-200 bg-paper-50 sm:h-64">
            <SignatureCanvas
              ref={padRef}
              penColor="#1C2321"
              canvasProps={{ className: "h-full w-full" }}
              onBegin={() => setVacio(false)}
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-graphite-200 p-5">
          <button
            onClick={limpiar}
            className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-lg border border-graphite-200 font-medium text-graphite-700"
          >
            <Eraser size={18} /> Borrar
          </button>
          <button
            onClick={confirmar}
            disabled={vacio}
            className="min-h-touch flex-1 rounded-lg bg-amber-500 font-semibold text-graphite-900 disabled:opacity-40"
          >
            Confirmar firma
          </button>
        </div>
      </div>
    </div>
  );
}
