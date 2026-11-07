import { Bot, type BotId, type LadoBot, type MomentoBot } from './Bot'

export class SantoEspada extends Bot {
  readonly id: BotId = 'espada'
  readonly nombre = 'Santo de la Espada'
  readonly multVelocidad = 1.05
  readonly multFallo = 1.0
  readonly lado: LadoBot = 'left'

  reaccion(momento: MomentoBot): string {
    const frases: Record<MomentoBot, string[]> = {
      pensar: ['Esta bola puede cerrar mi línea. Vamos.', 'Veamos qué nos trae el oráculo.'],
      dudar: ['Esperaré el momento justo.', 'Esta vez no. Aún hay partida.'],
      marcar: ['Una marca limpia. Sigue el duelo.', 'Bien jugado, casilla marcada.'],
      cerca: ['Mi patrón casi se cierra. ¿Listo?', 'Una más y mi línea será completa.'],
      bingo: ['¡BINGO! Ha sido un duelo digno.', '¡BINGO! El oráculo decidió nuestro duelo.'],
      jugador: ['Buena marca; decide el oráculo.', 'Buen movimiento. Aún no termina la partida.'],
    }
    return this.elegirFrase(frases[momento])
  }
}
