import { io, type Socket } from 'socket.io-client'

function token(): string {
  try {
    return localStorage.getItem('df_token') ?? ''
  } catch {
    return ''
  }
}

/**
 * Socket del modo online. Usa el mismo origen (proxy de Vite/nginx) salvo que
 * se defina VITE_API_URL.
 */
export function crearSocketOnline(): Socket {
  const base = String(import.meta.env.VITE_API_URL ?? '').trim()
  return io(base || undefined, {
    path: '/socket.io',
    auth: { token: token() },
    transports: ['websocket', 'polling'],
    autoConnect: false,
  })
}
