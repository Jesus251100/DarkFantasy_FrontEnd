import { Carton } from '../bingo/Carton'
import { nombreMetodo } from '../bingo/nombresMetodo'
import { Oraculo } from '../bingo/Oraculo'
import { patronesDesdeModos } from '../bingo/patrones/catalogoPatrones'
import type { IPatronVictoria } from '../bingo/patrones/IPatronVictoria'
import type { BingoCell, CardValue, EstadoPartida, WinMode, WinResult } from '../bingo/tipos'
import { Bot, type BotRuntime } from '../bots/Bot'
import { DificultadNivel } from '../bots/DificultadNivel'
import { FabricaBots } from '../bots/FabricaBots'
import type { ConfigPartida, FeedbackPartida } from './ConfigPartida'

export interface SnapPartida {
  v: 1
  layouts: CardValue[][]
  cards: BingoCell[][]
  calledList: number[]
  remainingPool: number[]
  status: EstadoPartida
  lastDrawn: number | null
  lastClaim: FeedbackPartida | null
  winningIndices: number[]
  winningCardIndex: number | null
  size: number
  winModes: WinMode[]
  methodLabel: string
  drawIntervalMs: number
  maxNumber: number
  phase?: 1 | 2 | 3
  bots?: BotRuntime[]
  savedAt: number
}

function mensajeSinLinea(modes: WinMode[]): string {
  if (modes.length === 1) {
    const map: Partial<Record<WinMode, string>> = {
      diagonal: 'Aún no tienes una diagonal completa marcada.',
      L: 'Aún no tienes una forma en L completa marcada.',
      O: 'Aún no tienes el marco en O completo marcado.',
      plus: 'Aún no tienes la cruz (+) completa marcada.',
      X: 'Aún no tienes la letra X completa marcada.',
      T: 'Aún no tienes una forma en T completa marcada.',
      arrow: 'Aún no tienes una flecha completa marcada.',
      H: 'Aún no tienes una forma en H completa marcada.',
      diamond: 'Aún no tienes el diamante completo marcado.',
      zigzag: 'Aún no tienes un zigzag completo marcado.',
      full: 'Aún no tienes el cartón completo marcado.',
      crown: 'Aún no tienes la corona completa marcada.',
    }
    const only = modes[0]
    if (only && map[only]) return map[only]
  }
  if (modes.includes('row') && modes.includes('column') && modes.length === 2) {
    return 'Aún no tienes una fila o columna completa marcada.'
  }
  return 'Aún no tienes un patrón de victoria completo marcado.'
}

/**
 * Motor de una ronda: cartones del jugador, oráculo y bots.
 * Vue no vive aquí; el composable solo traduce a refs.
 */
export class Partida {
  private cartones: Carton[]
  private layouts: CardValue[][]
  private oraculo: Oraculo
  private bots: Bot[]
  private patrones: IPatronVictoria[]
  private estado: EstadoPartida = 'idle'
  private lastClaim: FeedbackPartida | null = null
  private winningIndices: number[] = []
  private winningCardIndex: number | null = null
  private dificultad: DificultadNivel
  private fase: 1 | 2 | 3

  private constructor(private config: ConfigPartida) {
    this.patrones = patronesDesdeModos(config.winModes)
    this.dificultad = DificultadNivel.paraNivel(config.level)
    this.fase = config.phase ?? 1
    this.layouts = this.generarLayouts()
    this.cartones = this.layouts.map((v) => Carton.desdeValores(v))
    this.oraculo = Oraculo.nuevo(config.maxNumber, this.pool())
    this.bots = FabricaBots.roster(config.size, config.maxNumber)
    for (const b of this.bots) {
      b.progress = b.carton.progresoMejorPatron(this.patrones)
    }
  }

  static crear(config: ConfigPartida): Partida {
    return new Partida(config)
  }

  static restaurar(config: ConfigPartida, snap: SnapPartida): Partida {
    const p = new Partida({ ...config, phase: snap.phase ?? config.phase })
    p.layouts = snap.layouts.map((row) => [...row])
    p.cartones = snap.cards.map((c) => Carton.desdeSnapshot(c, snap.size))
    p.oraculo = Oraculo.restaurar(snap.calledList, snap.remainingPool, snap.lastDrawn)
    p.estado = snap.status === 'playing' ? 'paused' : snap.status
    p.lastClaim =
      snap.lastClaim ??
      (snap.status === 'playing'
        ? { type: 'info', message: 'Partida recuperada tras recargar. Pulsa ▶ para continuar.' }
        : null)
    p.winningIndices = [...snap.winningIndices]
    p.winningCardIndex = snap.winningCardIndex
    p.patrones = patronesDesdeModos(snap.winModes)
    p.config = {
      ...p.config,
      size: snap.size,
      winModes: [...snap.winModes],
      methodLabel: snap.methodLabel,
      drawIntervalMs: snap.drawIntervalMs,
      maxNumber: snap.maxNumber,
    }
    if (snap.bots && snap.bots.length > 0) {
      p.bots = FabricaBots.desdeSnapshots(snap.bots, snap.size)
    }
    return p
  }

  get status(): EstadoPartida {
    return this.estado
  }
  get size(): number {
    return this.config.size
  }
  get winModes(): WinMode[] {
    return this.config.winModes
  }
  get methodLabel(): string {
    return this.config.methodLabel
  }
  get evento() {
    return this.config.evento ?? 'ninguno'
  }
  get oscuridad(): boolean {
    return this.config.oscuridad === true
  }

  /** La ruleta cae en un único método; bots y cartón juegan solo ese. */
  fijarModoVictoria(mode: WinMode): void {
    this.config = {
      ...this.config,
      winModes: [mode],
      methodLabel: `Método: ${nombreMetodo(mode)} (ruleta)`,
    }
    this.patrones = patronesDesdeModos([mode])
  }
  get drawIntervalMs(): number {
    return this.config.drawIntervalMs
  }
  get maxNumber(): number {
    return this.config.maxNumber
  }
  get level(): number {
    return this.config.level
  }
  get phase(): 1 | 2 | 3 {
    return this.fase
  }
  get feedback(): FeedbackPartida | null {
    return this.lastClaim
  }
  get indicesGanadores(): number[] {
    return this.winningIndices
  }
  get cartonGanador(): number | null {
    return this.winningCardIndex
  }
  get ultimaBola(): number | null {
    return this.oraculo.ultimaBola
  }
  get bolasCantadas(): number[] {
    return [...this.oraculo.lista]
  }
  get conjuntoCantadas(): ReadonlySet<number> {
    return this.oraculo.conjunto
  }
  get poolRestante(): number[] {
    return this.oraculo.restantes
  }
  get idleHint(): string {
    return this.config.idleHint
  }

  snapshotsCartones(): BingoCell[][] {
    return this.cartones.map((c) => c.toSnapshot())
  }

  snapshotCarton(i = 0): BingoCell[] {
    return this.cartones[i]?.toSnapshot() ?? []
  }

  snapshotsBots(): BotRuntime[] {
    return this.bots.map((b) => {
      const snap = b.toRuntime()
      snap.progress = b.won ? 1 : b.carton.progresoMejorPatron(this.patrones)
      return snap
    })
  }

  botsIzquierda(): BotRuntime[] {
    return this.snapshotsBots().filter((b) => b.side === 'left')
  }

  botsDerecha(): BotRuntime[] {
    return this.snapshotsBots().filter((b) => b.side === 'right')
  }

  botPorId(id: string): Bot | undefined {
    return this.bots.find((b) => b.id === id)
  }

  iniciar(): void {
    this.layouts = this.generarLayouts()
    this.cartones = this.layouts.map((v) => Carton.desdeValores(v))
    this.oraculo = Oraculo.nuevo(this.config.maxNumber, this.pool())
    this.bots = FabricaBots.roster(this.config.size, this.config.maxNumber)
    for (const b of this.bots) {
      b.progress = b.carton.progresoMejorPatron(this.patrones)
    }
    this.estado = 'playing'
    this.lastClaim = null
    this.winningIndices = []
    this.winningCardIndex = null
  }

  pausar(): void {
    if (this.estado !== 'playing') return
    this.estado = 'paused'
    for (const b of this.bots) {
      if (!b.won) {
        b.busy = false
        b.statusText = 'Pausado…'
      }
    }
  }

  reanudar(): void {
    if (this.estado !== 'paused') return
    this.estado = 'playing'
    for (const b of this.bots) {
      if (!b.won && b.statusText === 'Pausado…') {
        b.statusText = 'En espera…'
        b.busy = false
      }
    }
  }

  togglePausa(): void {
    if (this.estado === 'playing') this.pausar()
    else if (this.estado === 'paused') this.reanudar()
  }

  marcarCelda(a: number, b?: number): void {
    if (this.estado !== 'playing') return
    const cardIndex = b === undefined ? 0 : a
    const cellIndex = b === undefined ? a : b
    const carton = this.cartones[cardIndex]
    if (!carton) return
    if (carton.toggleCelda(cellIndex, this.oraculo.conjunto)) {
      this.lastClaim = null
    }
  }

  cantarSiguiente(): number | null {
    if (this.estado !== 'playing') return null
    if (!this.oraculo.quedanBolas()) {
      this.lastClaim = {
        type: 'info',
        message: 'Se acabaron las bolas del oráculo. ¡Reclama BINGO si tienes el patrón!',
      }
      return null
    }
    return this.oraculo.cantar()
  }

  reclamarBingo(cardIndex = 0): WinResult {
    if (this.estado === 'won' || this.estado === 'lost') {
      return { won: false, winningIndices: [], reason: 'already-ended' }
    }
    if (this.estado === 'idle') {
      this.lastClaim = { type: 'info', message: 'Pulsa Iniciar para empezar la partida.' }
      return { won: false, winningIndices: [], reason: 'no-line' }
    }
    if (this.estado === 'paused') {
      this.lastClaim = {
        type: 'info',
        message: 'El juego está en pausa. Reanuda para continuar.',
      }
      return { won: false, winningIndices: [], reason: 'no-line' }
    }

    const carton = this.cartones[cardIndex]
    if (!carton) return { won: false, winningIndices: [], reason: 'no-line' }

    const result = carton.evaluarVictoria(this.patrones, this.oraculo.conjunto)
    if (result.won) {
      this.estado = 'won'
      this.winningIndices = result.winningIndices
      this.winningCardIndex = cardIndex
      this.lastClaim = {
        type: 'success',
        message:
          this.cartones.length > 1
            ? `¡BINGO en el cartón ${cardIndex + 1}! Patrón validado por el oráculo.`
            : '¡BINGO! Patrón completo y validado por el oráculo.',
      }
      for (const b of this.bots) {
        if (!b.won) {
          b.statusText = 'Rendidos…'
          b.busy = false
        }
      }
      return result
    }

    this.lastClaim =
      result.reason === 'not-called'
        ? {
            type: 'error',
            message: 'Tienes el patrón marcado, pero algún número aún no ha salido en el oráculo.',
          }
        : { type: 'error', message: mensajeSinLinea(this.config.winModes) }
    return result
  }

  setWinMessage(message: string): void {
    this.lastClaim = { type: 'success', message }
  }

  perderContra(rivalName: string): void {
    if (this.estado === 'won' || this.estado === 'lost') return
    this.estado = 'lost'
    this.lastClaim = {
      type: 'error',
      message: `¡${rivalName} gritó BINGO primero! Has perdido esta ronda.`,
    }
  }

  reconfigurar(config: ConfigPartida): void {
    this.config = { ...config }
    this.patrones = patronesDesdeModos(config.winModes)
    this.dificultad = DificultadNivel.paraNivel(config.level)
    this.fase = config.phase ?? 1
    this.layouts = this.generarLayouts()
    this.cartones = this.layouts.map((v) => Carton.desdeValores(v))
    this.oraculo = Oraculo.nuevo(config.maxNumber, this.pool())
    this.bots = FabricaBots.roster(config.size, config.maxNumber)
    for (const b of this.bots) {
      b.progress = b.carton.progresoMejorPatron(this.patrones)
    }
    this.estado = 'idle'
    this.lastClaim = null
    this.winningIndices = []
    this.winningCardIndex = null
  }

  setFase(fase: 1 | 2 | 3): void {
    this.fase = fase
  }

  decidirBot(botId: string, bola: number) {
    const bot = this.botPorId(botId)
    if (!bot) return null
    return bot.decidir(bola, this.dificultad, this.patrones)
  }

  marcarBot(botId: string, indice: number): boolean {
    const bot = this.botPorId(botId)
    if (!bot || this.estado !== 'playing') return false
    bot.aplicarMarca(indice, this.patrones)
    const win = bot.carton.evaluarVictoria(this.patrones, this.oraculo.conjunto)
    if (win.won) {
      bot.progress = 1
      this.winningIndices = win.winningIndices
    }
    return win.won
  }

  confirmarBingoBot(botId: string): BotRuntime | null {
    const bot = this.botPorId(botId)
    if (!bot) return null
    bot.gritarBingo()
    for (const b of this.bots) {
      if (b.id !== bot.id && !b.won) {
        b.statusText = 'Derrotado…'
        b.busy = false
      }
    }
    return bot.toRuntime()
  }

  setBotBusy(botId: string, busy: boolean, status?: string): void {
    const bot = this.botPorId(botId)
    if (!bot) return
    bot.busy = busy
    if (status !== undefined) bot.statusText = status
  }

  esCeldaCantada(numero: number): boolean {
    return this.oraculo.yaCanto(numero)
  }

  esCeldaGanadora(a: number, b?: number): boolean {
    const cardIndex = b === undefined ? 0 : a
    const cellIndex = b === undefined ? a : b
    if (this.winningCardIndex !== null && this.winningCardIndex !== cardIndex) return false
    if (this.winningCardIndex === null && this.estado === 'won') {
      return this.winningIndices.includes(cellIndex) && cardIndex === 0
    }
    if (this.winningCardIndex === null) return false
    return this.winningIndices.includes(cellIndex)
  }

  toSnap(): SnapPartida {
    return {
      v: 1,
      layouts: this.layouts.map((row) => [...row]),
      cards: this.snapshotsCartones(),
      calledList: this.bolasCantadas,
      remainingPool: this.poolRestante,
      status: this.estado,
      lastDrawn: this.ultimaBola,
      lastClaim: this.lastClaim ? { ...this.lastClaim } : null,
      winningIndices: [...this.winningIndices],
      winningCardIndex: this.winningCardIndex,
      size: this.config.size,
      winModes: [...this.config.winModes],
      methodLabel: this.config.methodLabel,
      drawIntervalMs: this.config.drawIntervalMs,
      maxNumber: this.config.maxNumber,
      phase: this.fase,
      bots: this.snapshotsBots(),
      savedAt: Date.now(),
    }
  }

  private pool(): number[] {
    return Array.from({ length: this.config.maxNumber }, (_, i) => i + 1)
  }

  private generarLayouts(): CardValue[][] {
    const n = Math.max(1, this.config.randomCardCount)
    return Array.from({ length: n }, () => Carton.aleatorio(this.config.size, this.config.maxNumber).toValores())
  }
}
