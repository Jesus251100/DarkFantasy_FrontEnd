import { Bot, type BotId, type LadoBot } from './Bot'

export class SantoEspada extends Bot {
  readonly id: BotId = 'espada'
  readonly nombre = 'Santo de la Espada'
  readonly multVelocidad = 1.05
  readonly multFallo = 1.0
  readonly lado: LadoBot = 'left'
}
