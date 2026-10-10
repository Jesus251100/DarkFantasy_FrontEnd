import type { Campania, ResultadoClear } from '../domain/campania/Campania'
import type { IClienteCampania } from '../domain/campania/IClienteCampania'
import type { DatosCampania } from '../domain/campania/IRepositorioCampania'

export class CompletarNivelRemoto {
  constructor(private readonly cliente: IClienteCampania) {}

  async ejecutar(
    nivel: number,
    local: Campania,
  ): Promise<{ resultado: ResultadoClear; campania: DatosCampania }> {
    try {
      return await this.cliente.completarNivel(nivel)
    } catch {
      const resultado = local.completarNivel(nivel)
      return { resultado, campania: local.toDatos() }
    }
  }
}
