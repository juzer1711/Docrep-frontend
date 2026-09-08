import React, { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, PenLine, UserRound, X } from "lucide-react";

const NOMBRE_INICIAL = "";

export default function SignatureModal({
  abierto,
  titulo,
  onConfirmar,
  onCerrar,
  guardando = false,
}) {
  const padRef = useRef(null);

  const [nombreFirmante, setNombreFirmante] = useState(NOMBRE_INICIAL);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    if (abierto) {
      setNombreFirmante(NOMBRE_INICIAL);
      setVacio(true);

      // El canvas se monta/desmonta con el modal.
      // No intentamos limpiarlo aquí porque todavía puede no existir.
    }
  }, [abierto]);

  if (!abierto) return null;

  function limpiar() {
    padRef.current?.clear();
    setVacio(true);
  }

  function cerrar() {
    if (guardando) return;

    setNombreFirmante(NOMBRE_INICIAL);
    setVacio(true);
    padRef.current?.clear();

    onCerrar();
  }

  function confirmar() {
    const nombre = nombreFirmante.trim();

    if (!nombre || padRef.current?.isEmpty() || guardando) {
      return;
    }

    const firma_base64 = padRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    onConfirmar({
      nombre_firmante: nombre,
      firma_base64,
    });
  }

  const nombreValido = nombreFirmante.trim().length > 0;
  const puedeConfirmar = nombreValido && !vacio && !guardando;

  const tituloBoton = obtenerTextoConfirmacion(titulo);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-graphite-900/60 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-modal-title"
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:w-[560px] sm:rounded-2xl"
      >
        {/* Encabezado */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-graphite-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                <PenLine size={18} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
                  Confirmación de etapa
                </p>

                <h2
                  id="signature-modal-title"
                  className="mt-0.5 truncate text-lg font-semibold text-graphite-900"
                >
                  {titulo || "Registrar firma"}
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="grid min-h-touch min-w-touch shrink-0 place-items-center rounded-lg text-graphite-500 transition hover:bg-paper-100 hover:text-graphite-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {/* Contenido */}
        <div className="overflow-y-auto px-5 py-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm leading-6 text-graphite-700">
              Registra el nombre de la persona que realiza esta acción y
              solicita su firma para dejar constancia de la etapa.
            </p>
          </div>

          {/* Nombre del firmante */}
          <div className="mt-5">
            <label
              htmlFor="nombre-firmante"
              className="mb-2 block text-sm font-semibold text-graphite-900"
            >
              Nombre del firmante *
            </label>

            <div className="relative">
              <UserRound
                size={19}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite-400"
              />

              <input
                id="nombre-firmante"
                type="text"
                value={nombreFirmante}
                onChange={(e) => setNombreFirmante(e.target.value)}
                placeholder="Ingrese el nombre completo"
                autoComplete="name"
                disabled={guardando}
                className="min-h-touch w-full rounded-xl border border-graphite-200 bg-white pl-11 pr-4 text-base text-graphite-900 outline-none transition placeholder:text-graphite-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-paper-50"
              />
            </div>

            {!nombreValido && nombreFirmante.length > 0 && (
              <p className="mt-2 text-xs font-medium text-rust-700">
                Ingrese el nombre del firmante.
              </p>
            )}
          </div>

          {/* Área de firma */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-graphite-900">
                Firma *
              </label>

              {!vacio && (
                <span className="text-xs font-medium text-moss-700">
                  Firma registrada
                </span>
              )}
            </div>

            <p className="mb-3 text-sm text-graphite-500">
              Firme con el dedo dentro del recuadro.
            </p>

            <div className="relative h-56 overflow-hidden rounded-xl border-2 border-dashed border-graphite-300 bg-paper-50 sm:h-64">
              {vacio && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <PenLine
                      size={30}
                      className="mx-auto text-graphite-300"
                      aria-hidden="true"
                    />

                    <p className="mt-2 text-sm font-medium text-graphite-400">
                      Firme aquí
                    </p>
                  </div>
                </div>
              )}

              <SignatureCanvas
                ref={padRef}
                penColor="#1C2321"
                backgroundColor="transparent"
                canvasProps={{
                  className: "h-full w-full touch-none",
                  "aria-label": "Área para registrar la firma",
                }}
                onBegin={() => setVacio(false)}
              />
            </div>

            <p className="mt-2 text-xs text-graphite-500">
              La firma quedará asociada a esta etapa de la factura.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-graphite-200 bg-paper-50 p-5 sm:flex-row">
          <button
            type="button"
            onClick={limpiar}
            disabled={vacio || guardando}
            className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl border border-graphite-200 bg-white px-4 py-3 font-medium text-graphite-700 transition hover:bg-graphite-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser size={18} aria-hidden="true" />
            Borrar firma
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={!puedeConfirmar}
            className="min-h-touch flex-1 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-graphite-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {guardando ? "Guardando…" : tituloBoton}
          </button>
        </footer>
      </div>
    </div>
  );
}

function obtenerTextoConfirmacion(titulo = "") {
  const texto = titulo.toLowerCase();

  if (texto.includes("revis")) {
    return "Confirmar revisión";
  }

  if (texto.includes("entreg")) {
    return "Confirmar entrega";
  }

  if (texto.includes("final")) {
    return "Confirmar finalización";
  }

  return "Confirmar firma";
}