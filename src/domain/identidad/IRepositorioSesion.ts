import type { Usuario } from './Usuario'

export interface IRepositorioSesion {
  guardar(usuario: Usuario): void
  cargar(): { correo: string; rol: 'jugador' | 'administrador' } | null
  borrar(): void
}
