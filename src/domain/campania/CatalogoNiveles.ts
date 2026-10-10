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

const NIVELES: DefinicionNivel[] = [
  {
    numero: 1,
    sessionKey: 'level-1',
    idleHint: 'Pulsa Iniciar: la ruleta elige fila horizontal o columna vertical.',
    previews: previewsDe(3, ['row', 'column']),
    fases: [
      fase(3, ['row', 'column'], 35, 1, 'Pulsa Iniciar: la ruleta elige fila o columna.', 3800),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 2,
    sessionKey: 'level-2',
    idleHint: 'Pulsa Iniciar: la ruleta elige fila, columna o diagonal.',
    previews: previewsDe(3, ['row', 'column', 'diagonal']),
    fases: [
      fase(3, ['row', 'column', 'diagonal'], 35, 1, 'Pulsa Iniciar: la ruleta elige fila, columna o diagonal.', 3600),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 3,
    sessionKey: 'level-3',
    idleHint: 'Pulsa Iniciar: la ruleta elige línea, L u O en el cartón 4×4.',
    previews: previewsDe(4, ['row', 'column', 'diagonal', 'L', 'O']),
    fases: [
      fase(4, ['row', 'column', 'diagonal', 'L', 'O'], 50, 1, 'Pulsa Iniciar: la ruleta elige el método 4×4.', 3400),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 4,
    sessionKey: 'level-4',
    idleHint: 'Dos cartones. La ruleta elige línea, L u O.',
    previews: previewsDe(4, ['row', 'column', 'diagonal', 'L', 'O']),
    fases: [
      fase(4, ['row', 'column', 'diagonal', 'L', 'O'], 50, 2, 'Pulsa Iniciar: la ruleta elige el método. Gana en cualquiera de los dos cartones.', 3300),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 5,
    sessionKey: 'level-5',
    idleHint: 'Pulsa Iniciar: la ruleta elige cruz (+) o letra X.',
    previews: previewsDe(5, ['plus', 'X']),
    fases: [fase(5, ['plus', 'X'], 75, 1, 'Pulsa Iniciar: la ruleta elige cruz (+) o X.', 3100)],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 6,
    sessionKey: 'level-6',
    idleHint: 'Pulsa Iniciar: la ruleta elige cruz, H o T.',
    previews: previewsDe(5, ['plus', 'H', 'T']),
    fases: [fase(5, ['plus', 'H', 'T'], 75, 1, 'Pulsa Iniciar: la ruleta elige cruz, H o T.', 3000)],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 7,
    sessionKey: 'level-7',
    idleHint: 'Pulsa Iniciar: la ruleta elige flecha o diamante.',
    previews: previewsDe(5, ['arrow', 'diamond']),
    fases: [
      fase(5, ['arrow', 'diamond'], 75, 1, 'Pulsa Iniciar: la ruleta elige flecha o diamante.', 2900),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 8,
    sessionKey: 'level-8',
    idleHint: 'Dos cartones. La ruleta elige cruz, T, H o flecha.',
    previews: previewsDe(5, ['plus', 'T', 'H', 'arrow']),
    fases: [
      fase(5, ['plus', 'T', 'H', 'arrow'], 75, 2, 'Pulsa Iniciar: la ruleta elige el método. Gana en cualquiera de los cartones.', 2800),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 9,
    sessionKey: 'level-9',
    idleHint: 'Evento oscuridad: la niebla tapa los números hasta que el oráculo los canta.',
    previews: previewsDe(5, ['zigzag']),
    fases: [
      fase(5, ['zigzag'], 75, 2, 'Pulsa Iniciar. Oscuridad: solo ves los números que ya salieron.', 2700, 'ruleta', true),
    ],
    muestraJefe: false,
    fondo: 'gif',
  },
  {
    numero: 10,
    sessionKey: 'level-10',
    idleHint: 'Fase 1: la ruleta elige el método. Los rivales están al máximo.',
    previews: previewsDe(5, ['full']),
    fases: [
      fase(5, ['full'], 75, 1, 'Fase 1: pulsa Iniciar. La ruleta elige cartón completo.', 2600),
      fase(5, ['zigzag', 'H', 'T', 'arrow'], 75, 2, 'Fase 2: la ruleta elige el método. Gana en cualquiera de los dos cartones.', 2500),
      fase(6, ['crown', 'diamond'], 90, 1, 'Fase 3 FINAL: ruleta + oscuridad. Corona o diamante en 6×6.', 2400, 'ruleta', true),
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
