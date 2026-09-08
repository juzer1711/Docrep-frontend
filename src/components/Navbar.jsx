import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SyncIndicator from "./SyncIndicator.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function iniciales(nombre = "") {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Navbar() {
  const { usuario, autenticado, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [abierto, setAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const perfilRef = useRef(null);

  const enlaces = autenticado
    ? [
        ["/", "Dashboard", true],
        ["/facturas", "Facturas", true],
        ["/nueva-recepcion", "Nueva recepción", ["BODEGA", "ADMINISTRADOR"].includes(usuario?.rol)],
        ["/usuarios", "Usuarios", usuario?.rol === "ADMINISTRADOR"],
      ].filter(([, , permitido]) => permitido)
    : [];

  useEffect(() => {
    function onClickFuera(e) {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        setPerfilAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  // Cierra menús al cambiar de ruta
  useEffect(() => {
    setAbierto(false);
    setPerfilAbierto(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!autenticado) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-graphite-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"> 
    <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3"> 
        <Link to="/" className="flex items-center gap-2 shrink-0 h-full overflow-visible"> 
        <img 
            src="/logo-docrep-horizontal-navbar.svg" 
            alt="DOCREP" 
            className="block h-9 w-auto md:h-10 object-contain" 
        /> 
        </Link>

        {/* Navegación desktop */}
        <nav className="ml-6 hidden items-center gap-1 text-sm font-medium md:flex">
          {enlaces.map(([ruta, texto]) => {
            const activo = ruta === "/" ? location.pathname === "/" : location.pathname.startsWith(ruta);
            return (
              <Link
                key={ruta}
                to={ruta}
                className={`relative rounded-lg px-3 py-2 transition-colors duration-150 ${
                  activo
                    ? "text-sky-700 bg-sky-100"
                    : "text-graphite-700 hover:bg-paper-100 hover:text-graphite-900"
                }`}
              >
                {texto}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SyncIndicator />

          {/* Menú de perfil - desktop */}
          <div className="relative hidden md:block" ref={perfilRef}>
            <button
              onClick={() => setPerfilAbierto((v) => !v)}
              className="flex min-h-touch items-center gap-2 rounded-lg border border-graphite-200 px-2 py-1.5 transition-colors duration-150 hover:bg-paper-100"
              aria-haspopup="true"
              aria-expanded={perfilAbierto}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
                {iniciales(usuario?.nombre) || <PersonRoundedIcon fontSize="small" />}
              </span>
              <span className="text-left leading-tight">
                <span className="block text-sm font-medium text-graphite-900">{usuario?.nombre}</span>
                <span className="block text-xs text-graphite-500">{usuario?.rol}</span>
              </span>
              <KeyboardArrowDownRoundedIcon
                fontSize="small"
                className={`text-graphite-500 transition-transform duration-150 ${perfilAbierto ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-graphite-200 bg-white p-1.5 shadow-lg transition-all duration-150 ${
                perfilAbierto
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="px-2.5 py-2">
                <p className="text-sm font-medium text-graphite-900">{usuario?.nombre}</p>
                <p className="text-xs text-graphite-500">{usuario?.rol}</p>
              </div>
              <div className="my-1 border-t border-graphite-200" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-rust-600 transition-colors duration-150 hover:bg-rust-100"
              >
                <LogoutRoundedIcon fontSize="small" />
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Botón hamburguesa - mobile */}
          <button
            className="flex min-h-touch min-w-touch items-center justify-center rounded-lg md:hidden"
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
          >
            {abierto ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      <div
        className={`overflow-hidden border-t border-graphite-200 transition-[max-height] duration-200 ease-in-out md:hidden ${
          abierto ? "max-h-96" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {enlaces.map(([ruta, texto]) => {
            const activo = ruta === "/" ? location.pathname === "/" : location.pathname.startsWith(ruta);
            return (
              <Link
                key={ruta}
                to={ruta}
                className={`min-h-touch rounded-lg px-3 py-2 text-sm font-medium ${
                  activo ? "bg-sky-100 text-sky-700" : "text-graphite-700"
                }`}
              >
                {texto}
              </Link>
            );
          })}
          <div className="my-1 border-t border-graphite-200" />
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
              {iniciales(usuario?.nombre)}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium text-graphite-900">{usuario?.nombre}</span>
              <span className="block text-xs text-graphite-500">{usuario?.rol}</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex min-h-touch items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rust-600"
          >
            <LogoutRoundedIcon fontSize="small" />
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}