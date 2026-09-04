import React from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import { PackageCheck } from "lucide-react";
import SyncIndicator from "./components/SyncIndicator.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NuevaRecepcion from "./pages/NuevaRecepcion.jsx";
import DetalleFactura from "./pages/DetalleFactura.jsx";
import Login from "./pages/Login.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Bitacora from "./pages/Bitacora.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { usuario, autenticado, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = ["ADMINISTRADOR"].includes(usuario?.rol);
  return (
    <div className="min-h-screen bg-paper-50">
      <header className="sticky top-0 z-30 border-b border-graphite-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <PackageCheck size={22} className="text-graphite-900" />
          <Link to="/" className="font-semibold text-graphite-900">Docrep</Link>
          {autenticado && <nav className="ml-auto flex items-center gap-3 text-sm"><Link to="/bitacora">Bitácora</Link>{esAdmin && <Link to="/usuarios">Usuarios</Link>}<button onClick={() => { logout(); navigate("/login"); }} className="text-rust-600">Salir</button></nav>}
        </div>
        <SyncIndicator />
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/nueva-recepcion" element={<ProtectedRoute roles={["BODEGA", "ADMINISTRADOR"]}><NuevaRecepcion /></ProtectedRoute>} />
          <Route path="/facturas/:id" element={<ProtectedRoute><DetalleFactura /></ProtectedRoute>} />
          <Route path="/bitacora" element={<ProtectedRoute roles={["BODEGA", "ADMINISTRADOR"]}><Bitacora /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute roles={["ADMINISTRADOR"]}><Usuarios /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
