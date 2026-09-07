import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Mail, LockKeyhole, Delete } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { mensajeError } from "../services/api.js";

export default function Login() {
  const { login, autenticado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [modo, setModo] = useState("pin");
  const [pin, setPin] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <Navigate to="/" replace />;
  }

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError("");
  }

  function agregarDigito(digito) {
    if (pin.length >= 4) return;
    setPin((actual) => actual + digito);
    setError("");
  }

  function borrarDigito() {
    setPin((actual) => actual.slice(0, -1));
    setError("");
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");

    if (modo === "pin" && !/^\d{4}$/.test(pin)) {
      setError("Ingresa un PIN de 4 dígitos.");
      return;
    }

    if (modo === "correo") {
      if (!correo.trim()) {
        setError("Ingresa tu correo electrónico.");
        return;
      }

      if (!password) {
        setError("Ingresa tu contraseña.");
        return;
      }
    }

    setEnviando(true);

    try {
      await login(
        modo === "pin"
          ? { pin }
          : {
              correo: correo.trim(),
              password,
            }
      );

      navigate(location.state?.from?.pathname || "/", {
        replace: true,
      });
    } catch (err) {
      setError(
        mensajeError(err, "No fue posible iniciar sesión. Intenta nuevamente.")
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Identidad */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-5 flex justify-center">
            <img
              src="/logo-docrep.svg"
              alt="DOCREP - Recepción y Custodia"
              className="h-auto w-52"
            />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-graphite-900">
            Bienvenido a DOCREP
          </h1>

          <p className="mt-2 text-sm text-graphite-500">
            Gestiona la recepción y custodia de tus documentos.
          </p>
        </div>

        {/* Tarjeta */}
        <form
          onSubmit={enviar}
          className="rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {/* Selector de acceso */}
          <div
            className="grid grid-cols-2 rounded-xl bg-paper-100 p-1"
            role="tablist"
            aria-label="Método de inicio de sesión"
          >
            <button
              type="button"
              role="tab"
              aria-selected={modo === "pin"}
              onClick={() => cambiarModo("pin")}
              className={`min-h-touch rounded-lg px-3 text-sm font-semibold transition-colors ${
                modo === "pin"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-graphite-500 hover:text-graphite-700"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <KeyRound size={17} aria-hidden="true" />
                PIN operativo
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={modo === "correo"}
              onClick={() => cambiarModo("correo")}
              className={`min-h-touch rounded-lg px-3 text-sm font-semibold transition-colors ${
                modo === "correo"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-graphite-500 hover:text-graphite-700"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Mail size={17} aria-hidden="true" />
                Correo
              </span>
            </button>
          </div>

          {/* Contenido */}
          <div className="mt-6">
            {modo === "pin" ? (
              <div>
                <div className="mb-5 text-center">
                  <h2 className="text-base font-semibold text-graphite-900">
                    PIN de acceso
                  </h2>

                  <p className="mt-1 text-sm text-graphite-500">
                    Ingresa tu PIN operativo de 4 dígitos.
                  </p>
                </div>

                {/* Indicador PIN */}
                <div
                  className="mb-6 flex justify-center gap-3"
                  aria-label={`PIN ingresado: ${pin.length} de 4 dígitos`}
                >
                  {[0, 1, 2, 3].map((indice) => (
                    <span
                      key={indice}
                      className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                        indice < pin.length
                          ? "border-sky-600 bg-sky-600"
                          : "border-graphite-200 bg-white"
                      }`}
                    />
                  ))}
                </div>

                {/* Input real para accesibilidad */}
                <label htmlFor="pin" className="sr-only">
                  PIN de acceso
                </label>

                <input
                  id="pin"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  autoFocus
                  className="sr-only"
                  aria-hidden="false"
                />

                {/* Teclado táctil */}
                <div
                  className="mx-auto grid max-w-xs grid-cols-3 gap-3"
                  aria-label="Teclado numérico"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => (
                    <button
                      key={numero}
                      type="button"
                      onClick={() => agregarDigito(String(numero))}
                      disabled={pin.length >= 4 || enviando}
                      className="min-h-touch rounded-xl border border-graphite-200 bg-white text-lg font-semibold text-graphite-900 shadow-sm transition hover:border-sky-500 hover:bg-sky-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Número ${numero}`}
                    >
                      {numero}
                    </button>
                  ))}

                  <div />

                  <button
                    type="button"
                    onClick={() => agregarDigito("0")}
                    disabled={pin.length >= 4 || enviando}
                    className="min-h-touch rounded-xl border border-graphite-200 bg-white text-lg font-semibold text-graphite-900 shadow-sm transition hover:border-sky-500 hover:bg-sky-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Número 0"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={borrarDigito}
                    disabled={!pin.length || enviando}
                    className="flex min-h-touch items-center justify-center rounded-xl border border-graphite-200 bg-paper-50 text-graphite-700 shadow-sm transition hover:border-graphite-500 hover:bg-paper-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Borrar último dígito"
                  >
                    <Delete size={21} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="correo"
                    className="block text-sm font-semibold text-graphite-700"
                  >
                    Correo electrónico
                  </label>

                  <div className="mt-2 flex min-h-touch items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
                    <Mail
                      size={19}
                      className="shrink-0 text-graphite-500"
                      aria-hidden="true"
                    />

                    <input
                      id="correo"
                      type="email"
                      autoFocus
                      autoComplete="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="min-h-touch w-full bg-transparent px-3 text-sm text-graphite-900 outline-none focus:outline-none placeholder:text-graphite-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-graphite-700"
                  >
                    Contraseña
                  </label>

                  <div className="mt-2 flex min-h-touch items-center rounded-xl border border-graphite-200 bg-white px-3 transition focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
                    <LockKeyhole
                      size={19}
                      className="shrink-0 text-graphite-500"
                      aria-hidden="true"
                    />

                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="min-h-touch w-full bg-transparent px-3 text-sm text-graphite-900 outline-none focus:outline-none placeholder:text-graphite-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rust-100 bg-rust-100 px-4 py-3 text-sm font-medium text-rust-700"
              >
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={enviando}
              className="mt-6 min-h-touch w-full rounded-xl bg-sky-600 px-4 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? "Ingresando…" : "Ingresar"}
            </button>
          </div>
        </form>

        {/* Pie */}
        <p className="mt-5 text-center text-xs text-graphite-500">
          Recepción & Custodia
        </p>
      </div>
    </main>
  );
}
