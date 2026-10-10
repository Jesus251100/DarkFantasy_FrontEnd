import { Administrador } from './Administrador'
import { Usuario } from './Usuario'
import type { IRepositorioSesion } from './IRepositorioSesion'

/** Sesión activa. No habla con sessionStorage: lo hace el repositorio (D). */
export class Sesion {
  constructor(private readonly repo: IRepositorioSesion) {}

  iniciarJugador(correo: string): Usuario {
    const usuario = new Usuario(correo || 'jugador')
    this.repo.guardar(usuario)
    return usuario
  }

  iniciarAdmin(correo: string): Administrador {
    const admin = new Administrador(correo || 'admin')
    this.repo.guardar(admin)
    return admin
  }

  actual(): Usuario | Administrador | null {
    const datos = this.repo.cargar()
    if (!datos) return null
    return datos.rol === 'administrador'
      ? new Administrador(datos.correo)
      : new Usuario(datos.correo)
  }

  estaLogueado(): boolean {
    return this.actual() !== null
  }

  cerrar(): void {
    this.repo.borrar()
  }
}
