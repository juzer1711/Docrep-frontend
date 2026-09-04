import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import CameraInput from "../components/CameraInput.jsx";
import SignatureModal from "../components/SignatureModal.jsx";
import { crearFactura } from "../api/facturasApi.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// TODO integración de auth: hoy se toma de un valor fijo de sesión local.
// Cuando exista login, reemplazar por el id del usuario autenticado.

export default function NuevaRecepcion() {
  const navigate = useNavigate();
  const { mostrar } = useToast();
  const { usuario } = useAuth();

  const [numeroFactura, setNumeroFactura] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [foto, setFoto] = useState(null);
  const [firmaAbierta, setFirmaAbierta] = useState(false);
  const [firma, setFirma] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const formularioValido = numeroFactura.trim() && proveedor.trim() && foto && firma;

  async function guardar() {
    if (!formularioValido) {
      mostrar("Completa número de factura, proveedor, foto y firma.", "error");
      return;
    }
    setGuardando(true);
    try {
      const resultado = await crearFactura({
        numero_factura: numeroFactura.trim(),
        proveedor: proveedor.trim(),
        id_usuario: usuario.ID_USUARIO ?? usuario.id_usuario,
        firma_base64: firma,
        foto
      });

      mostrar(
        resultado.offline
          ? "Factura guardada en el dispositivo. Se enviará cuando vuelva la conexión."
          : "Factura registrada correctamente.",
        "exito"
      );
      navigate(`/facturas/${resultado.id_factura}`);
    } catch (error) {
      mostrar(error.response?.data?.mensaje || "No se pudo registrar la factura.", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-5">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-graphite-700">
        <ChevronLeft size={20} /> Volver
      </button>

      <h1 className="mb-6 text-2xl font-semibold text-graphite-900">Nueva recepción</h1>

      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-graphite-700">
            N° de factura <span className="text-rust-600">*</span>
          </label>
          <input
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            className="min-h-touch w-full rounded-lg border border-graphite-200 bg-white px-4 text-base outline-none focus:border-amber-500"
            placeholder="Ej. FE-00123"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-graphite-700">
            Proveedor <span className="text-rust-600">*</span>
          </label>
          <input
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className="min-h-touch w-full rounded-lg border border-graphite-200 bg-white px-4 text-base outline-none focus:border-amber-500"
            placeholder="Nombre del proveedor"
          />
        </div>

        <CameraInput etiqueta="Foto de la factura" onCapturar={setFoto} requerido />

        <div>
          <label className="mb-2 block text-sm font-medium text-graphite-700">
            Firma de recepción <span className="text-rust-600">*</span>
          </label>
          {firma ? (
            <div className="flex items-center justify-between rounded-lg border border-graphite-200 bg-white p-3">
              <img src={firma} alt="Firma capturada" className="h-16" />
              <button onClick={() => setFirmaAbierta(true)} className="text-sm font-medium text-sky-600">
                Repetir
              </button>
            </div>
          ) : (
            <button
              onClick={() => setFirmaAbierta(true)}
              className="min-h-touch w-full rounded-lg border-2 border-dashed border-graphite-200 bg-paper-100 text-sm font-medium text-graphite-500"
            >
              Capturar firma
            </button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-graphite-200 bg-white p-4">
        <button
          onClick={guardar}
          disabled={!formularioValido || guardando}
          className="mx-auto min-h-touch w-full max-w-2xl rounded-lg bg-amber-500 font-semibold text-graphite-900 disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Registrar recepción"}
        </button>
      </div>

      <SignatureModal
        abierto={firmaAbierta}
        titulo="Firma de recepción"
        onCerrar={() => setFirmaAbierta(false)}
        onConfirmar={(dataUrl) => {
          setFirma(dataUrl);
          setFirmaAbierta(false);
        }}
      />
    </div>
  );
}
