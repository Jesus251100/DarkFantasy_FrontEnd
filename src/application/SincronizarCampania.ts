import type { Campania } from '../domain/campania/Campania'
import type { IClienteCampania } from '../domain/campania/IClienteCampania'
import type { DatosCampania } from '../domain/campania/IRepositorioCampania'

export class SincronizarCampania {
  constructor(private readonly cliente: IClienteCampania) {}

  async ejecutar(): Promise<DatosCampania> {
    return this.cliente.obtener()
  }
}

export function aplicarDatosEnCampania(campania: Campania, datos: DatosCampania): void {
  campania.highestUnlocked = datos.highestUnlocked
  campania.completed = [...datos.completed]
  campania.wins = datos.wins
  campania.jugador.nombre = datos.displayName
  campania.jugador.monedas = datos.coins
  campania.jugador.diamantes = datos.diamonds
  campania.jugador.boosters = { ...datos.boosters }
  campania.persistir()
}
