import { Bot, type BotId, type LadoBot, type MomentoBot } from './Bot'

export class ArzobispoPereza extends Bot {
  readonly id: BotId = 'pereza'
  readonly nombre = 'Arzobispo de la pereza'
  readonly multVelocidad = 1.35
  readonly multFallo = 1.4
  readonly lado: LadoBot = 'left'

  reaccion(momento: MomentoBot): string {
    const frases: Record<MomentoBot, string[]> = {
      pensar: ['¿Otra bola? Justo cuando iba a descansar…', 'A ver… que el oráculo no me haga trabajar mucho.'],
      dudar: ['Esa no. Tú sigue marcando.', 'Mmm… paso de esa bola.'],
      marcar: ['Una menos. No te acostumbres.', 'Ya está. Ahora déjame descansar un momento.'],
      cerca: ['Uy, casi… qué problemón.', '¿Tan cerca? Esto empieza a dar pereza.'],
      bingo: ['¡BINGO! Por fin puedo sentarme.', '¡BINGO! Se acabó el trabajo por hoy.'],
      jugador: ['Vas bien, pero aún no cantes victoria.', 'No te aceleres, que el oráculo todavía sigue.'],
    }
    return this.elegirFrase(frases[momento])
  }
}
