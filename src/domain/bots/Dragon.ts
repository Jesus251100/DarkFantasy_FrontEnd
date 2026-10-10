import { Bot, type BotId, type LadoBot } from './Bot'

export class Dragon extends Bot {
  readonly id: BotId = 'dragon'
  readonly nombre = 'Dragon'
  readonly multVelocidad = 0.7
  readonly multFallo = 0.55
  readonly lado: LadoBot = 'right'
}
