import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { autenticado, usuario } = useAuth();
  const location = useLocation();
  if (!autenticado) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(usuario?.rol)) return <Navigate to="/" replace />;
  return children;
}
