import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Custodia de Facturas",
        short_name: "Facturas",
        description: "Registro y custodia de facturas de recepción",
        theme_color: "#1C2321",
        background_color: "#F7F6F3",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        // El shell y los assets se cachean para que la app cargue sin red.
        // Los datos (facturas) NO se cachean aquí: eso lo maneja el outbox
        // en IndexedDB (ver src/db/db.js y src/sync/syncManager.js), porque
        // necesitamos control fino sobre reintentos, orden y deduplicación
        // que el cacheo automático de Workbox no ofrece para escrituras.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallback: "/index.html"
      }
    })
  ],
  server: {
    proxy: {
      "/api": "http://localhost:3000"
    },
    allowedHosts: [
      "disparate-correct-shininess.ngrok-free.dev"
    ] 
  }
});
