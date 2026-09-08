import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NuevaRecepcion from "./pages/NuevaRecepcion.jsx";
import DetalleFactura from "./pages/DetalleFactura.jsx";
import Login from "./pages/Login.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Bitacora from "./pages/Bitacora.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-paper-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/facturas" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
          <Route path="/nueva-recepcion" element={<ProtectedRoute roles={["BODEGA", "ADMINISTRADOR"]}><NuevaRecepcion /></ProtectedRoute>} />
          <Route path="/facturas/:id" element={<ProtectedRoute><DetalleFactura /></ProtectedRoute>} />
          <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute roles={["ADMINISTRADOR"]}><Usuarios /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}