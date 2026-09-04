# Custodia de Facturas — Frontend PWA

Frontend React + Tailwind, mobile-first, para el sistema de custodia y recepción de facturas.
Diseñado para operar con **conexión intermitente**: toda escritura pasa primero por una cola local
(outbox en IndexedDB) antes de intentar llegar al backend.

## Instalación

```bash
npm install
npm run dev       # desarrollo, con proxy a http://localhost:3000
npm run build     # build de producción
npm run preview   # sirve el build de producción
```

El backend (Node/Express + Oracle) debe estar corriendo en `http://localhost:3000`.
En desarrollo, Vite hace proxy de `/api` hacia esa URL (ver `vite.config.js`).
En producción, ajusta esa base o sirve el frontend detrás del mismo dominio del backend.

Antes de usar en un celular real, cambia `localStorage.setItem("id_usuario", "1")`
por el mecanismo de sesión real cuando exista login (ver el TODO en `NuevaRecepcion.jsx`
y `DetalleFactura.jsx`).

## Arquitectura offline (resumen)

```
UI (React)
  ↓ lee/escribe
Store local (IndexedDB / Dexie)
  - facturasCache: lo que la UI muestra
  - outbox: acciones pendientes de enviar
  ↓
Sync Manager (src/sync/syncManager.js)
  - dispara al reconectar y cada 20s de respaldo
  - procesa el outbox EN ORDEN (importa para dependencias)
  - deduplica por número+proveedor antes de reintentar una creación
  ↓
API (src/api/facturasApi.js + axios)
  ↓
Backend Node/Express → Oracle (ya existente, sin cambios)
```

**Por qué no usamos Background Sync API del navegador:** no está soportada en
iOS/Safari, y no podíamos asumir que todo el parque de celulares sea Android/Chrome.
Se optó por una cola manual (IndexedDB + evento `online` + intervalo de respaldo),
que funciona igual en cualquier navegador a cambio de requerir que la app esté
abierta (o se reabra) para completar la sincronización.

**Dónde mirar si algo falla:**
- `src/db/db.js` — esquema del outbox y la caché local.
- `src/api/facturasApi.js` — decide, por cada endpoint, si se envía directo o se encola.
- `src/sync/syncManager.js` — procesa el outbox, resuelve IDs temporales → reales,
  y reintenta con los estados `pendiente` / `sincronizando` / `error`.

## Estructura de carpetas

```
src/
  api/          cliente Axios + funciones por endpoint (con fallback a outbox)
  components/   SignatureModal, CameraInput, StatusBadge, NovedadModal, ToastProvider, SyncIndicator
  db/           esquema IndexedDB (Dexie)
  hooks/        useOnlineStatus, useSyncStatus
  pages/        Dashboard, NuevaRecepcion, DetalleFactura
  sync/         syncManager
```

## Pendientes conocidos (fuera del alcance de esta entrega)

- Autenticación real (hoy `id_usuario` es un valor fijo en `localStorage`).
- El backend no conoce UUIDs de idempotencia: la deduplicación de creaciones
  offline se resuelve del lado del cliente comparando número+proveedor. Si el
  volumen crece, conviene que el backend acepte un `client_uuid` opcional.
- Reconciliación de conflictos (factura avanzada por otro usuario mientras un
  dispositivo estaba offline) hoy se detecta como error de negocio al sincronizar,
  pero no hay una pantalla dedicada para resolverlo manualmente.
