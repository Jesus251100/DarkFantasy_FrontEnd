import type { WinMode } from '../bingo/tipos'

export type EventoFase = 'ninguno' | 'ruleta'

export interface ConfigFase {
  size: number
  winModes: WinMode[]
  maxNumber: number
  randomCardCount: number
  drawIntervalMs: number
  methodLabel: string
  idleHint: string
  evento?: EventoFase
  /** Niebla: oculta los números que el oráculo aún no ha cantado. */
  oscuridad?: boolean
}

export interface ConfigPartida extends ConfigFase {
  level: number
  sessionKey: string
  phase?: 1 | 2 | 3
}

export interface FeedbackPartida {
  type: 'success' | 'error' | 'info'
  message: string
}
