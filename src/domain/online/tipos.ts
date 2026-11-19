import type { BingoCell, WinMode } from '../bingo/tipos'

export type EstadoSalaOnline = 'waiting' | 'playing' | 'finished'

export type TipoEfectoBoosterOnline = 'freeze' | 'sabotage' | 'luck' | 'shield'

export interface EfectoBoosterVistaOnline {
  tipo: TipoEfectoBoosterOnline
  restanteMs: number
  lanzadoPorId: string
  lanzadoPorNombre: string
  casillasBloqueadas?: number[]
  numerosFalsos?: Record<string, number>
}

export interface EfectoActivoOnline {
  tipo: TipoEfectoBoosterOnline
  hasta: number
  lanzadoPorNombre: string
  casillasBloqueadas?: number[]
  numerosFalsos?: Record<string, number>
}

export interface JugadorVistaOnline {
  id: string
  nombre: string
  avatarUrl?: string | null
  esBot: boolean
  conectado: boolean
  ganador: boolean
  equipo?: 1 | 2
  efectos?: EfectoBoosterVistaOnline[]
}

/** Espejo de `VistaSala` del backend (src/domain/online/SalaOnline.ts). */
export interface VistaSalaOnline {
  salaId: string
  estado: EstadoSalaOnline
  size: number
  fondoNivel: number
  winModes: WinMode[]
  metodosVictoria: WinMode[]
  maxNumber: number
  calledList: number[]
  lastDrawn: number | null
  modo?: 'mesa' | 'pvp' | 'equipos'
  cupo?: number
  jugadores: JugadorVistaOnline[]
  tuCarton: BingoCell[]
  cartonRival?: { id: string; nombre: string; celdas: BingoCell[] } | null
  ganador: string | null
  apuesta?: number
  serie?: {
    ronda: number
    equipo1: number
    equipo2: number
    aviso: string | null
    equipoGanador: 1 | 2 | null
  } | null
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
  avatarUrl?: string | null
}

export interface SalaEsperaOnline {
  codigo: string
  anfitrionId: string
  completarConBots: boolean
  modo: 'mesa' | 'pvp' | 'equipos'
  cupo: 2 | 4 | 6 | 8
  permiteBots: boolean
  apuesta?: 0 | 20 | 100
  jugadores: JugadorEsperaOnline[]
}

export interface FilaRankingOnline {
  usuarioId: string
  nombre: string
  avatarUrl?: string | null
  puntos: number
  victorias: number
}

/**
 * Contrato visual del booster: booster:lanzado se normaliza a este tipo y se
 * expone en el evento de ventana `df-booster-vuelo`. La UI puede animarlo;
 * el stock y la aplicación del efecto siguen siendo autoritativos en backend.
 */
export interface VueloBoosterOnline {
  deId: string
  deNombre: string
  boosterId: number
  stockRestante?: number
  objetivoId: string
  objetivoNombre?: string
  tipo: TipoEfectoBoosterOnline
  aplicado: boolean
  bloqueadoPorEscudo: boolean
  hasta: number
  restanteMs: number
  ahora: number
  casillasBloqueadas?: number[]
  numerosFalsos?: Record<string, number>
}

export interface RechazoBoosterOnline {
  mensaje: string
}
