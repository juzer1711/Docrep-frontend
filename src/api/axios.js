import apiBase from "../services/api.js";

export const api = apiBase.create({ baseURL: `${apiBase.defaults.baseURL}/facturas`, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("docrep_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// No añadimos aquí un interceptor que "encole en vez de fallar": eso vive
// en facturasApi.js, a nivel de cada función, porque cada endpoint necesita
// datos distintos para reconstruir su payload en el outbox (multipart vs
// JSON, con o sin archivo). Un interceptor genérico de Axios no tiene
// suficiente contexto de negocio para eso.
