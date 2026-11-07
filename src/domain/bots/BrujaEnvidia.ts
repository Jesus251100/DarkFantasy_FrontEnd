import { Bot, type BotId, type LadoBot, type MomentoBot } from './Bot'

export class BrujaEnvidia extends Bot {
  readonly id: BotId = 'envidia'
  readonly nombre = 'Bruja de la Envidia'
  readonly multVelocidad = 0.85
  readonly multFallo = 0.75
  readonly lado: LadoBot = 'right'

  reaccion(momento: MomentoBot): string {
    const frases: Record<MomentoBot, string[]> = {
      pensar: ['Esa bola… claro que la quiero.', '¿También te salió? Qué casualidad…'],
      dudar: ['¿Ya te acercas? No te dejaré ganar.', 'No te emociones; esa suerte puede cambiar.'],
      marcar: ['¡Esa casilla es mía!', 'Me quedo con esta. Te toca buscar otra.'],
      cerca: ['No me robes ese BINGO…', 'Tan cerca… no pienso dejar que te adelantes.'],
      bingo: ['¡BINGO! Esta vez me eligió la suerte.', '¡BINGO! Sabía que esa victoria debía ser mía.'],
      jugador: ['¿Ya marcaste? No pienso perder.', 'Qué bien por ti… pero yo voy a alcanzarte.'],
    }
    return this.elegirFrase(frases[momento])
  }
}
