import {
  CheckCircleRounded,
  CloseRounded,
  EditRounded,
  Inventory2Rounded,
  PhotoRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

const resolverUrl = (ruta) => {
  if (!ruta) return null;

  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }

  const base = (
    import.meta.env.VITE_FILES_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const path = ruta.startsWith("/") ? ruta : `/${ruta}`;

  return `${base}${path}`;
};

export default function DetalleNovedad({
  abierto,
  novedad,
  puedeBodega,
  onCerrar,
  onEditar,
  onResolver,
}) {
  if (!abierto || !novedad) {
    return null;
  }

  const pendiente = novedad.estado !== "RESUELTA";
  const imagen = resolverUrl(novedad.url_foto_evidencia);

  return (
    <div className="fixed inset-0 z-40 bg-graphite-900/50 backdrop-blur-[2px]">
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-novedad-titulo"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-graphite-200 px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={[
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                  pendiente
                    ? "bg-rust-100 text-rust-700"
                    : "bg-moss-100 text-moss-700",
                ].join(" ")}
              >
                {pendiente ? (
                  <WarningAmberRounded
                    sx={{ fontSize: 21 }}
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircleRounded
                    sx={{ fontSize: 21 }}
                    aria-hidden="true"
                  />
                )}
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
                  Detalle de novedad
                </p>

                <h2
                  id="detalle-novedad-titulo"
                  className="mt-0.5 truncate text-lg font-semibold text-graphite-900"
                >
                  {novedad.descripcion_producto || "Producto"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="grid min-h-touch min-w-touch shrink-0 place-items-center rounded-lg text-graphite-500 transition hover:bg-paper-100 hover:text-graphite-900"
              aria-label="Cerrar detalle de novedad"
            >
              <CloseRounded sx={{ fontSize: 22 }} aria-hidden="true" />
            </button>
          </header>

          <div className="overflow-y-auto px-5 py-5">
            <div className="flex flex-wrap gap-2">
              <span
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  pendiente
                    ? "bg-rust-100 text-rust-700"
                    : "bg-moss-100 text-moss-700",
                ].join(" ")}
              >
                {pendiente ? "Pendiente" : "Resuelta"}
              </span>

              {novedad.tipo_novedad && (
                <span className="rounded-full bg-paper-100 px-3 py-1.5 text-xs font-medium text-graphite-700">
                  {novedad.tipo_novedad}
                </span>
              )}
            </div>

            <section className="mt-5">
              <div className="grid overflow-hidden rounded-xl border border-graphite-200 sm:grid-cols-3">
                <div className="border-b border-graphite-200 p-4 sm:border-b-0 sm:border-r">
                  <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
                    Referencia
                  </p>

                  <p className="mt-1 font-medium text-graphite-900">
                    {novedad.codigo_referencia || "—"}
                  </p>
                </div>

                <div className="border-b border-graphite-200 p-4 sm:border-b-0 sm:border-r">
                  <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
                    Cantidad
                  </p>

                  <p className="mt-1 font-medium text-graphite-900">
                    {novedad.cantidad ?? "—"}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">
                    Tipo
                  </p>

                  <p className="mt-1 font-medium text-graphite-900">
                    {novedad.tipo_novedad || "—"}
                  </p>
                </div>
              </div>
            </section>

            {novedad.observaciones && (
              <section className="mt-5">
                <div className="flex items-center gap-2">
                  <Inventory2Rounded
                    className="text-graphite-500"
                    sx={{ fontSize: 19 }}
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-graphite-900">
                    Observaciones
                  </h3>
                </div>

                <p className="mt-2 rounded-xl bg-paper-50 p-4 text-sm leading-6 text-graphite-700">
                  {novedad.observaciones}
                </p>
              </section>
            )}

            <section className="mt-5">
              <div className="flex items-center gap-2">
                <PhotoRounded
                  className="text-graphite-500"
                  sx={{ fontSize: 19 }}
                  aria-hidden="true"
                />

                <h3 className="text-sm font-semibold text-graphite-900">
                  Evidencia fotográfica
                </h3>
              </div>

              {imagen ? (
                <a
                  href={imagen}
                  target="_blank"
                  rel="noreferrer"
                  className="group mt-2 block overflow-hidden rounded-xl bg-graphite-900"
                  aria-label="Abrir evidencia fotográfica en una nueva pestaña"
                >
                  <div className="flex min-h-64 items-center justify-center p-3 sm:min-h-80">
                    <img
                      src={imagen}
                      alt={`Evidencia de ${novedad.descripcion_producto || "la novedad"}`}
                      className="max-h-80 w-full object-contain transition group-hover:scale-[1.01]"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white">
                    <PhotoRounded
                      sx={{ fontSize: 16 }}
                      aria-hidden="true"
                    />
                    Abrir evidencia completa
                  </div>
                </a>
              ) : (
                <div className="mt-2 rounded-xl border border-dashed border-graphite-200 bg-paper-50 p-8 text-center">
                  <PhotoRounded
                    className="text-graphite-400"
                    sx={{ fontSize: 32 }}
                    aria-hidden="true"
                  />

                  <p className="mt-2 text-sm font-medium text-graphite-700">
                    Sin evidencia fotográfica
                  </p>

                  <p className="mt-1 text-xs text-graphite-500">
                    Esta novedad no tiene una fotografía adjunta.
                  </p>
                </div>
              )}
            </section>

            {novedad.estado === "RESUELTA" && (
              <section className="mt-5 rounded-xl border border-moss-100 bg-moss-100/60 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircleRounded
                    className="text-moss-700"
                    sx={{ fontSize: 19 }}
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-moss-700">
                    Resolución
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-graphite-700">
                  {novedad.observacion_resolucion ||
                    "La novedad fue marcada como resuelta sin observación adicional."}
                </p>
              </section>
            )}
          </div>

          {puedeBodega && pendiente && (
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-graphite-200 bg-paper-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCerrar}
                className="min-h-touch rounded-lg px-4 py-2.5 text-sm font-medium text-graphite-600 hover:bg-graphite-200"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => onEditar(novedad)}
                className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-lg border border-sky-600 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100"
              >
                <EditRounded sx={{ fontSize: 17 }} aria-hidden="true" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => onResolver(novedad)}
                className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-lg bg-moss-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss-700"
              >
                <CheckCircleRounded
                  sx={{ fontSize: 17 }}
                  aria-hidden="true"
                />
                Resolver
              </button>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}