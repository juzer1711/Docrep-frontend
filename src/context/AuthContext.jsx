import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

function usuarioGuardado() {
  try { return JSON.parse(localStorage.getItem("docrep_usuario")) || null; } catch { return null; }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioGuardado);
  const [token, setToken] = useState(() => localStorage.getItem("docrep_token"));

  async function login(credenciales) {
    const { data } = await api.post("/auth/login", credenciales);
    localStorage.setItem("docrep_token", data.token);
    localStorage.setItem("docrep_usuario", JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem("docrep_token");
    localStorage.removeItem("docrep_usuario");
    setToken(null);
    setUsuario(null);
  }

  const value = useMemo(() => ({ usuario, token, login, logout, autenticado: Boolean(token && usuario) }), [usuario, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
