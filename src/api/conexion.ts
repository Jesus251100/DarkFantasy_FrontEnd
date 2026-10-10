/**
 * Conexión del FRONTEND (Vue) → API
 *
 * El navegador llama a /api/... en el mismo origen (puerto 5173).
 * Vite reenvía esas peticiones al backend en http://127.0.0.1:3001
 * (ver vite.config.ts → server.proxy).
 */
export const conexionApi = {
  juego: 'http://127.0.0.1:5173',
  backend: 'http://127.0.0.1:3001',
  /** Vacío = misma origen + proxy de Vite. */
  base: String(import.meta.env.VITE_API_URL ?? '').trim(),
  salud: '/api/salud',
  auth: '/api/auth',
  campania: '/api/campania',
  admin: '/api/admin',
}

export function urlApi(ruta: string): string {
  return `${conexionApi.base}${ruta}`
}
