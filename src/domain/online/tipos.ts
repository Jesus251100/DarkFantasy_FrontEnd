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
  radarProgramado?: boolean
  localizadorEspera?: number
  serie?: {
    ronda: number
    equipo1: number
    equipo2: number
    aviso: string | null
    equipoGanador: 1 | 2 | null
    fase: 'jugando' | 'intermedio'
    venceIntermedio: number | null
    nombres: { equipo1: string; equipo2: string }
    ganadoresRonda: (1 | 2 | null)[]
    pozo: number
    apuestas: Record<string, number>
    combo: { equipo1: number; equipo2: number }
    evento: string | null
    aumentaron: string[]
  } | null
}

export interface ResumenOnline {
  salaId: string
  ganadorId: string | null
  ganadorNombre: string | null
  pozo?: number
  pozoPagado?: boolean
  diamantesPremio?: number
  equipoGanador?: 1 | 2 | null
  pozoPorGanador?: Record<string, number>
  anfitrionAbandono?: boolean
}

export type FaseOnline = 'idle' | 'cola' | 'apuesta' | 'jugando' | 'terminado'

export interface MensajeChatOnline {
  id: string
  usuarioId: string
  nombre: string
  avatarUrl?: string | null
  texto: string
  creadoEn: string
}

export interface JugadorEsperaOnline {
  id: string
  nombre: string
  avatarUrl?: string | null
  apuesta?: number
}

export interface SalaEsperaOnline {
  codigo: string
  anfitrionId: string
  completarConBots: boolean
  modo: 'mesa' | 'pvp' | 'equipos'
  cupo: 2 | 4 | 6 | 8
  permiteBots: boolean
  apuesta: number
  global?: boolean
  escaneo?: boolean
  jugadores: JugadorEsperaOnline[]
}

export interface RadarVisible {
  nombre: string
  hechas: number
  total: number
}

export interface FilaRankingOnline {
  usuarioId: string
  nombre: string
  avatarUrl?: string | null
  apuesta?: number
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
