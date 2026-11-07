import { Bot, type BotId, type LadoBot, type MomentoBot } from './Bot'

export class Dragon extends Bot {
  readonly id: BotId = 'dragon'
  readonly nombre = 'Dragon'
  readonly multVelocidad = 0.7
  readonly multFallo = 0.55
  readonly lado: LadoBot = 'right'

  reaccion(momento: MomentoBot): string {
    const frases: Record<MomentoBot, string[]> = {
      pensar: ['La fortuna habló. Atiende, mortal.', 'El oráculo ha revelado su siguiente número.'],
      dudar: ['Esa bola no basta para detenerme.', 'No me sirve. Mi victoria sigue cerca.'],
      marcar: ['Una más. Sigo a la cabeza.', 'El patrón avanza bajo mi dominio.'],
      cerca: ['El BINGO se acerca. ¿Puedes seguirme?', 'Ya casi. ¿Aún crees poder alcanzarme?'],
      bingo: ['¡BINGO! El oráculo me reconoce.', '¡BINGO! Hasta la fortuna se inclina ante mí.'],
      jugador: ['Buen intento, mortal. Alcánzame.', 'Vaya, esa marca sí estuvo a la altura.'],
    }
    return this.elegirFrase(frases[momento])
  }
}
