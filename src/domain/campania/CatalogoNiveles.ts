import { etiquetaMetodos } from '../bingo/nombresMetodo'
import type { WinMode } from '../bingo/tipos'
import type { ConfigFase, ConfigPartida, EventoFase } from '../partida/ConfigPartida'

export interface PreviewMetodo {
  size: number
  winModes: WinMode[]
}

export interface DefinicionNivel {
  numero: number
  sessionKey: string
  idleHint: string
  previews: PreviewMetodo[]
  fases: ConfigFase[]
  muestraJefe: boolean
  fondo: 'gif' | 'final'
}

function previewsDe(size: number, modes: WinMode[]): PreviewMetodo[] {
  return modes.map((m) => ({ size, winModes: [m] }))
}

function fase(
  size: number,
  winModes: WinMode[],
  maxNumber: number,
  randomCardCount: number,
  idleHint: string,
  drawIntervalMs = 2500,
  evento: EventoFase = 'ruleta',
  oscuridad = false,
): ConfigFase {
  return {
    size,
    winModes,
    maxNumber,
    randomCardCount,
    drawIntervalMs,
    methodLabel: etiquetaMetodos(winModes, evento === 'ruleta'),
    idleHint,
    evento,
    oscuridad,
  }
}

/** Cada nivel conserva los métodos previos y agrega los que presenta por primera vez. */
const METODOS_ACUMULADOS: Record<number, WinMode[]> = {
  1: ['row', 'column'],
  2: ['row', 'column', 'diagonal'],
  3: ['row', 'column', 'diagonal', 'L', 'O'],
  4: ['row', 'column', 'diagonal', 'L', 'O'],
  5: ['row', 'column', 'diagonal', 'L', 'O', 'plus', 'X'],
  6: ['row', 'column', 'diagonal', 'L', 'O', 'plus', 'X', 'H', 'T'],
  7: ['row', 'column', 'diagonal', 'L', 'O', 'plus', 'X', 'H', 'T', 'arrow', 'diamond'],
  8: ['row', 'column', 'diagonal', 'L', 'O', 'plus', 'X', 'H', 'T', 'arrow', 'diamond'],
  9: ['row', 'column', 'diagonal', 'L', 'O', 'plus', 'X', 'H', 'T', 'arrow', 'diamond', 'zigzag'],
}

function metodosAcumulados(nivel: number): WinMode[] {
  return [...(METODOS_ACUMULADOS[nivel] ?? [])]
}

const NIVELES: DefinicionNivel[] = [
  {
    numero: 1,
    sessionKey: 'level-1',
    idleHint: 'Pulsa Iniciar: la ruleta elige fila horizontal o columna vertical.',
    previews: previewsDe(3, metodosAcumulados(1)),
    fases: [
      fase(3, metodosAcumulados(1), 35, 1, 'Pulsa Iniciar: la ruleta elige fila o columna.', 3800),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 2,
    sessionKey: 'level-2',
    idleHint: 'Pulsa Iniciar: la ruleta elige fila, columna o diagonal.',
    previews: previewsDe(3, metodosAcumulados(2)),
    fases: [
      fase(3, metodosAcumulados(2), 35, 1, 'Pulsa Iniciar: la ruleta elige entre los métodos disponibles.', 3600),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 3,
    sessionKey: 'level-3',
    idleHint: 'Pulsa Iniciar: la ruleta elige línea, L u O en el cartón 4×4.',
    previews: previewsDe(4, metodosAcumulados(3)),
    fases: [
      fase(4, metodosAcumulados(3), 50, 1, 'Pulsa Iniciar: la ruleta elige entre los métodos disponibles en el cartón 4×4.', 3400),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 4,
    sessionKey: 'level-4',
    idleHint: 'Dos cartones. La ruleta elige línea, L u O.',
    previews: previewsDe(4, metodosAcumulados(4)),
    fases: [
      fase(4, metodosAcumulados(4), 50, 2, 'Dos cartones: la ruleta elige el método. Gana en cualquiera de ellos.', 3300),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 5,
    sessionKey: 'level-5',
    idleHint: 'Pulsa Iniciar: la ruleta elige entre los métodos acumulados.',
    previews: previewsDe(5, metodosAcumulados(5)),
    fases: [
      fase(5, metodosAcumulados(5), 75, 1, 'Pulsa Iniciar: la ruleta elige entre los métodos acumulados.', 3100),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 6,
    sessionKey: 'level-6',
    idleHint: 'Pulsa Iniciar: la ruleta elige cruz, H o T.',
    previews: previewsDe(5, metodosAcumulados(6)),
    fases: [fase(5, metodosAcumulados(6), 75, 1, 'Pulsa Iniciar: la ruleta elige entre los métodos acumulados.', 3000)],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 7,
    sessionKey: 'level-7',
    idleHint: 'Pulsa Iniciar: la ruleta elige entre los métodos acumulados.',
    previews: previewsDe(5, metodosAcumulados(7)),
    fases: [
      fase(5, metodosAcumulados(7), 75, 1, 'Pulsa Iniciar: la ruleta elige entre los métodos acumulados.', 2900),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 8,
    sessionKey: 'level-8',
    idleHint: 'Dos cartones. La ruleta elige entre los métodos acumulados.',
    previews: previewsDe(5, metodosAcumulados(8)),
    fases: [
      fase(5, metodosAcumulados(8), 75, 2, 'Dos cartones: la ruleta elige entre los métodos acumulados.', 2800),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 9,
    sessionKey: 'level-9',
    idleHint: 'Dos cartones. La ruleta elige entre los métodos acumulados.',
    previews: previewsDe(5, metodosAcumulados(9)),
    fases: [
      fase(5, metodosAcumulados(9), 75, 2, 'Dos cartones: la ruleta elige entre los métodos acumulados.', 2700),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 10,
    sessionKey: 'level-10',
    idleHint: 'Fase 1: completa el cartón entero y canta BINGO.',
    previews: previewsDe(5, ['full']),
    fases: [
      fase(5, ['full'], 75, 1, 'Fase 1: completa el cartón entero y canta BINGO.', 2600, 'ninguno'),
      fase(5, ['zigzag'], 75, 2, 'Fase 2: completa el zigzag en cualquiera de tus dos cartones.', 2500, 'ninguno'),
      fase(6, ['crown'], 90, 1, 'Fase 3 final: completa la corona en tu cartón 6×6.', 2400, 'ninguno'),
    ],
    muestraJefe: true,
    fondo: 'final',
  },
]

export class CatalogoNiveles {
  static todos(): DefinicionNivel[] {
    return NIVELES
  }

  static obtener(numero: number): DefinicionNivel {
    const def = NIVELES.find((n) => n.numero === numero)
    if (!def) throw new Error(`Nivel ${numero} no existe`)
    return def
  }

  static configPartida(numero: number, faseIndex = 0): ConfigPartida {
    const def = CatalogoNiveles.obtener(numero)
    const cfg = def.fases[faseIndex] ?? def.fases[0]
    if (!cfg) throw new Error(`Fase inválida en nivel ${numero}`)
    return {
      ...cfg,
      level: numero,
      sessionKey: def.sessionKey,
      phase: (faseIndex + 1) as 1 | 2 | 3,
    }
  }
}
