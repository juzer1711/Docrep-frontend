import { useEffect, useState } from "react";
import { onSyncStatusChange, procesarOutbox } from "../sync/syncManager.js";
import { db } from "../db/db.js";

export function useSyncStatus() {
  const [estado, setEstado] = useState({ pendientes: 0, conError: 0, sincronizando: false });

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      const pendientes = await db.outbox.where("estado").notEqual("error").count();
      const conError = await db.outbox.where("estado").equals("error").count();
      if (activo) setEstado((prev) => ({ ...prev, pendientes, conError }));
    }
    cargarInicial();

    const quitar = onSyncStatusChange((nuevo) => activo && setEstado(nuevo));
    return () => {
      activo = false;
      quitar();
    };
  }, []);

  return { ...estado, sincronizarAhora: procesarOutbox };
}
