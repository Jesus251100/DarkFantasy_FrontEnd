import { Bot, type BotId, type LadoBot } from './Bot'

export class BrujaEnvidia extends Bot {
  readonly id: BotId = 'envidia'
  readonly nombre = 'Bruja de la Envidia'
  readonly multVelocidad = 0.85
  readonly multFallo = 0.75
  readonly lado: LadoBot = 'right'
}
