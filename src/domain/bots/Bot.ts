import { Carton } from '../bingo/Carton'
import type { BingoCell } from '../bingo/tipos'
import type { IPatronVictoria } from '../bingo/patrones/IPatronVictoria'
import type { DificultadNivel } from './DificultadNivel'

export type BotId = 'pereza' | 'espada' | 'envidia' | 'dragon'
export type LadoBot = 'left' | 'right'
export type MomentoBot = 'pensar' | 'dudar' | 'marcar' | 'cerca' | 'bingo' | 'jugador'

/** Snapshot para la UI (Vue no instancia clases en el template). */
export interface BotRuntime {
  id: BotId
  name: string
  side: LadoBot
  speedMult: number
  missMult: number
  card: BingoCell[]
  statusText: string
  progress: number
  progressMarked: number
  progressTotal: number
  won: boolean
  busy: boolean
}

export interface DecisionBot {
  marcar: boolean
  delayMs: number
  indiceCelda: number
}

/** Rival abstracto. Las hijas solo cambian nombre, velocidad y fallo (Liskov). */
export abstract class Bot {
  abstract readonly id: BotId
  abstract readonly nombre: string
  abstract readonly multVelocidad: number
  abstract readonly multFallo: number
  abstract readonly lado: LadoBot
  abstract reaccion(momento: MomentoBot): string

  statusText = 'En espera…'
  progress = 0
  progressMarked = 0
  progressTotal = 1
  won = false
  busy = false

  constructor(public carton: Carton) {}

  decidir(bola: number, dificultad: DificultadNivel, patrones: IPatronVictoria[]): DecisionBot | null {
    if (this.won) return null
    const indice = this.carton.indiceDeNumero(bola)
    if (indice < 0) return null
    const celda = this.carton.celdaEn(indice)
    if (!celda || celda.estaMarcada) return null
    const cierra = this.carton.celdaCierraPatron(indice, patrones)
    const ayuda = cierra || this.carton.celdaAyudaPatron(indice, patrones)
    if (!cierra && !dificultad.debeMarcar(this.multFallo, ayuda)) {
      this.statusText = this.reaccion('dudar')
      return { marcar: false, delayMs: 0, indiceCelda: indice }
    }
    return {
      marcar: true,
      delayMs: dificultad.delayMs(this.multVelocidad),
      indiceCelda: indice,
    }
  }

  aplicarMarca(indice: number, patrones: IPatronVictoria[]): void {
    const celda = this.carton.celdaEn(indice)
    celda?.marcar()
    this.actualizarProgreso(patrones)
    this.statusText = this.reaccion(this.progress >= 0.75 ? 'cerca' : 'marcar')
    this.busy = false
  }

  actualizarProgreso(patrones: IPatronVictoria[]): void {
    const avance = this.carton.avanceMejorPatron(patrones)
    this.progress = avance.progreso
    this.progressMarked = avance.marcadas
    this.progressTotal = avance.total
  }

  protected elegirFrase(opciones: string[]): string {
    return opciones[Math.floor(Math.random() * opciones.length)] ?? ''
  }

  gritarBingo(): void {
    this.won = true
    this.progress = 1
    this.progressMarked = this.progressTotal
    this.statusText = this.reaccion('bingo')
    this.busy = false
  }

  toRuntime(): BotRuntime {
    return {
      id: this.id,
      name: this.nombre,
      side: this.lado,
      speedMult: this.multVelocidad,
      missMult: this.multFallo,
      card: this.carton.toSnapshot(),
      statusText: this.statusText,
      progress: this.progress,
      progressMarked: this.progressMarked,
      progressTotal: this.progressTotal,
      won: this.won,
      busy: this.busy,
    }
  }

  hidratarDesde(snap: BotRuntime): void {
    this.carton = Carton.desdeSnapshot(snap.card)
    this.statusText = snap.statusText
    this.progress = snap.progress
    this.progressMarked = snap.progressMarked ?? 0
    this.progressTotal = snap.progressTotal ?? 1
    this.won = snap.won
    this.busy = false
  }
}
