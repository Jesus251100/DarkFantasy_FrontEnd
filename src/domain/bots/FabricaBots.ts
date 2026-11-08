import { Carton } from '../bingo/Carton'
import { ArzobispoPereza } from './ArzobispoPereza'
import { Bot, type BotId, type BotRuntime } from './Bot'
import { BrujaEnvidia } from './BrujaEnvidia'
import { Dragon } from './Dragon'
import { SantoEspada } from './SantoEspada'

export const ORDEN_RIVALES: BotId[] = ['pereza', 'espada', 'envidia', 'dragon']
const NOMBRE_JEFE_FINAL = 'Malgrath, Rey de las Cenizas'

/** Instancia la hija concreta. Un rival nuevo = clase nueva + un case. */
export function crearRival(id: BotId, carton: Carton, jefeFinal = false): Bot {
  switch (id) {
    case 'pereza':
      return new ArzobispoPereza(carton)
    case 'espada':
      return new SantoEspada(carton)
    case 'envidia':
      return new BrujaEnvidia(carton)
    case 'dragon':
      return new Dragon(carton, jefeFinal ? NOMBRE_JEFE_FINAL : 'Dragon', jefeFinal)
  }
}

/** Roster y rehidratación. No define comportamiento de cada rival. */
export class FabricaBots {
  static roster(tamano: number, maxNumber: number, jefeFinal = false): Bot[] {
    if (jefeFinal) {
      return [crearRival('dragon', Carton.aleatorio(tamano, maxNumber), true)]
    }
    return ORDEN_RIVALES.map((id) => crearRival(id, Carton.aleatorio(tamano, maxNumber)))
  }

  static desdeSnapshots(snaps: BotRuntime[], tamano: number, jefeFinal = false): Bot[] {
    return snaps.map((snap) => {
      const bot = crearRival(
        snap.id as BotId,
        Carton.desdeSnapshot(snap.card, tamano),
        jefeFinal && snap.id === 'dragon',
      )
      bot.hidratarDesde(snap)
      return bot
    })
  }
}
