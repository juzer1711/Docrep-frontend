import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Mail } from "lucide-react";
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
  if (autenticado) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault(); setError("");
    if (modo === "pin" && !/^\d{4}$/.test(pin)) return setError("Ingresa un PIN de 4 dígitos.");
    setEnviando(true);
    try {
      await login(modo === "pin" ? { pin } : { correo: correo.trim(), password });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) { setError(mensajeError(err, "No fue posible iniciar sesión.")); }
    finally { setEnviando(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4">
    <form onSubmit={enviar} className="w-full max-w-md rounded-2xl border border-graphite-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-graphite-900">Docrep</h1>
      <p className="mt-1 text-sm text-graphite-500">Ingresa para gestionar tus recepciones.</p>
      <div className="mt-6 grid grid-cols-2 rounded-lg bg-paper-100 p-1">
        <button type="button" onClick={() => setModo("pin")} className={`min-h-touch rounded-md text-sm font-medium ${modo === "pin" ? "bg-white text-graphite-900 shadow" : "text-graphite-500"}`}>PIN operativo</button>
        <button type="button" onClick={() => setModo("correo")} className={`min-h-touch rounded-md text-sm font-medium ${modo === "correo" ? "bg-white text-graphite-900 shadow" : "text-graphite-500"}`}>Correo</button>
      </div>
      <div className="mt-5 space-y-4">
        {modo === "pin" ? <label className="block text-sm font-medium text-graphite-700">PIN de acceso<div className="mt-2 flex items-center rounded-lg border border-graphite-200 px-3"><KeyRound size={18} /><input autoFocus inputMode="numeric" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="min-h-touch w-full bg-transparent px-3 text-lg tracking-[.45em] outline-none" /></div></label> : <><label className="block text-sm font-medium text-graphite-700">Correo electrónico<div className="mt-2 flex items-center rounded-lg border border-graphite-200 px-3"><Mail size={18} /><input autoFocus type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} className="min-h-touch w-full bg-transparent px-3 outline-none" /></div></label><label className="block text-sm font-medium text-graphite-700">Contraseña<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-touch w-full rounded-lg border border-graphite-200 px-3 outline-none" /></label></>}
        {error && <p role="alert" className="text-sm text-rust-600">{error}</p>}
        <button disabled={enviando} className="min-h-touch w-full rounded-lg bg-amber-500 font-semibold text-graphite-900 disabled:opacity-50">{enviando ? "Ingresando…" : "Ingresar"}</button>
      </div>
    </form>
  </main>;
}
