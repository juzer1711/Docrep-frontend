import React from "react";
import { CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { useSyncStatus } from "../hooks/useSyncStatus.js";

export default function SyncIndicator() {
  const online = useOnlineStatus();
  const { pendientes, conError, sincronizando, sincronizarAhora } = useSyncStatus();

  if (online && pendientes === 0 && conError === 0) return null;

  return (
    <button
      onClick={sincronizarAhora}
      className="flex min-h-touch w-full items-center justify-center gap-2 bg-graphite-900 px-4 text-sm font-medium text-paper-50"
    >
      {!online ? (
        <>
          <CloudOff size={16} />
          Sin conexión — {pendientes} por sincronizar cuando vuelva la señal
        </>
      ) : conError > 0 ? (
        <>
          <AlertCircle size={16} className="text-rust-600" />
          {conError} acción(es) con error — toca para reintentar
        </>
      ) : (
        <>
          <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} />
          Sincronizando {pendientes} pendiente(s)…
        </>
      )}
    </button>
  );
}
