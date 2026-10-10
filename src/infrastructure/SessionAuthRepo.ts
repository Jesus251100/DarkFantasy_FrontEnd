import type { IRepositorioSesion } from '../domain/identidad/IRepositorioSesion'
import type { Usuario } from '../domain/identidad/Usuario'

export class SessionAuthRepo implements IRepositorioSesion {
  guardar(usuario: Usuario): void {
    try {
      sessionStorage.setItem('df_user_role', usuario.rol)
      sessionStorage.setItem('df_logged_in', '1')
      sessionStorage.setItem('df_user_email', usuario.correo)
    } catch {
      /* ignore */
    }
  }

  cargar(): { correo: string; rol: 'jugador' | 'administrador' } | null {
    try {
      if (sessionStorage.getItem('df_logged_in') !== '1') return null
      const rol = sessionStorage.getItem('df_user_role')
      if (rol !== 'jugador' && rol !== 'administrador') return null
      return {
        correo: sessionStorage.getItem('df_user_email') ?? '',
        rol,
      }
    } catch {
      return null
    }
  }

  borrar(): void {
    try {
      sessionStorage.removeItem('df_user_role')
      sessionStorage.removeItem('df_logged_in')
      sessionStorage.removeItem('df_user_email')
    } catch {
      /* ignore */
    }
  }
}
