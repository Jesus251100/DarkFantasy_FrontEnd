import { Bot, type BotId, type LadoBot } from './Bot'

export class ArzobispoPereza extends Bot {
  readonly id: BotId = 'pereza'
  readonly nombre = 'Arzobispo de la pereza'
  readonly multVelocidad = 1.35
  readonly multFallo = 1.4
  readonly lado: LadoBot = 'left'
}
