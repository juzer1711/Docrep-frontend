import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { startSyncManager } from "./sync/syncManager.js";
import "./index.css";

// Arranca el ciclo de sincronización del outbox en cuanto la app carga:
// procesa lo pendiente si ya hay red, y se re-arma en cada evento 'online'
// y en un intervalo de respaldo (ver src/sync/syncManager.js).
startSyncManager();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider><ToastProvider><App /></ToastProvider></AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
