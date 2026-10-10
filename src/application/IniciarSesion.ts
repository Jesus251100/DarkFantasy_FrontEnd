import { Sesion } from '../domain/identidad/Sesion'
import type { Administrador } from '../domain/identidad/Administrador'
import type { Usuario } from '../domain/identidad/Usuario'
import type { IRepositorioSesion } from '../domain/identidad/IRepositorioSesion'

export class IniciarSesion {
  constructor(private readonly repo: IRepositorioSesion) {}

  comoJugador(correo: string): Usuario {
    return new Sesion(this.repo).iniciarJugador(correo)
  }

  comoAdmin(correo: string): Administrador {
    return new Sesion(this.repo).iniciarAdmin(correo)
  }
}
