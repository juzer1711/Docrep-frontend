import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ESTILOS = {
  exito: { icono: CheckCircle2, clases: "bg-moss-100 text-moss-600 border-moss-600/30" },
  error: { icono: AlertTriangle, clases: "bg-rust-100 text-rust-600 border-rust-600/30" },
  info: { icono: Info, clases: "bg-sky-100 text-sky-600 border-sky-600/30" }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const mostrar = useCallback((mensaje, tipo = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const cerrar = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-96">
        {toasts.map(({ id, mensaje, tipo }) => {
          const { icono: Icono, clases } = ESTILOS[tipo];
          return (
            <div
              key={id}
              role="status"
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm ${clases}`}
            >
              <Icono size={20} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{mensaje}</p>
              <button onClick={() => cerrar(id)} aria-label="Cerrar" className="shrink-0">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
