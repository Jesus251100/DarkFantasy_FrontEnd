import { urlApi } from './conexion'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function token(): string {
  try {
    return localStorage.getItem('df_token') ?? ''
  } catch {
    return ''
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const t = token()
  if (t) headers.set('Authorization', `Bearer ${t}`)
  let res: Response
  try {
    res = await fetch(urlApi(path), { ...init, headers })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Arranca Docker (docker compose up) o el backend en el puerto 3001.',
      0,
    )
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T
  if (!res.ok) {
    throw new ApiError(body.error ?? `Error ${res.status}`, res.status)
  }
  return body as T
}
