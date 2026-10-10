import type { IClienteCampania } from '../domain/campania/IClienteCampania'

export class RegistrarPartidaRemota {
  constructor(private readonly cliente: IClienteCampania) {}

  async ejecutar(nivel: number, gano: boolean): Promise<void> {
    try {
      await this.cliente.registrarPartida(nivel, gano)
    } catch {
      /* el historial no debe bloquear la partida */
    }
  }
}
