import type { IClienteCampania } from '../domain/campania/IClienteCampania'
import { logrosConEstado, type LogroVista } from '../domain/logros/Logros'

/**
 * Devuelve el catálogo de logros con el estado real del jugador.
 * Si el API no responde, se deriva de los niveles completados en local.
 */
export class ListarLogros {
  constructor(private readonly cliente: IClienteCampania) {}

  async ejecutar(completados: number[]): Promise<LogroVista[]> {
    try {
      return await this.cliente.listarLogros()
    } catch {
      return logrosConEstado(completados)
    }
  }
}
