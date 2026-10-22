import type { BingoCell, WinMode } from '../bingo/tipos'

export type EstadoSalaOnline = 'waiting' | 'playing' | 'finished'

export interface JugadorVistaOnline {
  id: string
  nombre: string
  esBot: boolean
  conectado: boolean
  ganador: boolean
}

/** Espejo de `VistaSala` del backend (src/domain/online/SalaOnline.ts). */
export interface VistaSalaOnline {
  salaId: string
  estado: EstadoSalaOnline
  size: number
  winModes: WinMode[]
  metodosVictoria: WinMode[]
  maxNumber: number
  calledList: number[]
  lastDrawn: number | null
  jugadores: JugadorVistaOnline[]
  tuCarton: BingoCell[]
  ganador: string | null
}

export interface ResumenOnline {
  salaId: string
  ganadorId: string | null
  ganadorNombre: string | null
}

export type FaseOnline = 'idle' | 'cola' | 'jugando' | 'terminado'

export interface MensajeChatOnline {
  id: string
  nombre: string
  texto: string
}

export interface JugadorEsperaOnline {
  id: string
  nombre: string
}

export interface SalaEsperaOnline {
  codigo: string
  anfitrionId: string
  jugadores: JugadorEsperaOnline[]
}

export interface FilaRankingOnline {
  nombre: string
  puntos: number
  victorias: number
}

export interface VueloBoosterOnline {
  deId: string
  deNombre: string
  boosterId: number
  objetivoId: string
}
