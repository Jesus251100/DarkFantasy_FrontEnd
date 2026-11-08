import { Bot, type BotId, type LadoBot, type MomentoBot } from './Bot'
import { Carton } from '../bingo/Carton'

export class Dragon extends Bot {
  readonly id: BotId = 'dragon'
  readonly nombre: string
  readonly multVelocidad = 0.7
  readonly multFallo = 0.55
  readonly lado: LadoBot = 'right'
  private readonly esJefeFinal: boolean

  constructor(carton: Carton, nombre = 'Dragon', esJefeFinal = false) {
    super(carton)
    this.nombre = nombre
    this.esJefeFinal = esJefeFinal
    if (esJefeFinal) this.statusText = 'Que caiga la primera bola, retador.'
  }

  reaccion(momento: MomentoBot): string {
    if (this.esJefeFinal) {
      const frasesJefe: Record<MomentoBot, string[]> = {
        pensar: ['El oráculo ya habló. ¿Te atreves a seguir su llamado?', 'Una nueva bola cae bajo mi mirada.'],
        dudar: ['Ese número no alimenta mi patrón… todavía.', 'La fortuna se demora, pero siempre termina ante mí.'],
        marcar: ['Otra casilla cae bajo mi dominio.', 'Mi cartón se acerca al destino que ya elegí.'],
        cerca: ['Una sola línea más y este bingo será mío.', 'Siento la victoria en las casillas que faltan.'],
        bingo: ['¡BINGO! Ni el azar pudo salvarte.', '¡La última casilla! Este reino del bingo me pertenece.'],
        jugador: ['Marca con cuidado, retador. No todas las bolas te favorecen.', 'Veo tu avance… aún estás lejos de mi cartón.'],
      }
      return this.elegirFrase(frasesJefe[momento])
    }

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
