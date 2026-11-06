import { computed, onUnmounted, ref, watch } from 'vue'
import { CatalogoNiveles } from '../domain/campania/CatalogoNiveles'
import { nombreMetodo } from '../domain/bingo/nombresMetodo'
import { useProgressStore } from '../stores/progress'
import type { BingoCell, WinMode } from '../domain/bingo/tipos'
import type { ConfirmacionVictoriaRemota } from '../domain/campania/IClienteCampania'
import type { BotRuntime } from '../domain/bots/Bot'
import { Partida } from '../domain/partida/Partida'
import type { ConfigPartida } from '../domain/partida/ConfigPartida'
import { SessionStoragePartidaRepo } from '../infrastructure/SessionStoragePartidaRepo'
import { useLevelClear } from './useLevelClear'
import { botPortrait, PLAYER_PORTRAIT } from '../game/portraits'

const repo = new SessionStoragePartidaRepo()

function syncFrom(partida: Partida) {
  return {
    cards: partida.snapshotsCartones(),
    status: partida.status,
    lastClaim: partida.feedback,
    lastDrawn: partida.ultimaBola,
    calledList: partida.bolasCantadas,
    methodLabel: partida.methodLabel,
    winningIndices: partida.indicesGanadores,
    winningCardIndex: partida.cartonGanador,
    bots: partida.snapshotsBots(),
    size: partida.size,
    winModes: partida.winModes,
    phase: partida.phase,
    oscuridad: partida.oscuridad,
  }
}

/**
 * Adaptador Vue de la clase Partida.
 * Timer y setTimeout de bots viven aquí (ciclo de vida de la vista).
 */
export function usePartida(levelNumber: number) {
  const definicion = CatalogoNiveles.obtener(levelNumber)
  const guardada = repo.cargar(definicion.sessionKey)
  // Las sesiones anteriores a la validación del servidor no se pueden reanudar con seguridad.
  const saved = guardada?.serverRoundId || guardada?.serverRunId ? guardada : null
  if (guardada && !saved) repo.borrar(definicion.sessionKey)
  const faseInicial = Math.min(Math.max((saved?.phase ?? 1) - 1, 0), definicion.fases.length - 1)

  let config: ConfigPartida = CatalogoNiveles.configPartida(levelNumber, faseInicial)
  const partida = saved
    ? Partida.restaurar(config, saved)
    : Partida.crear(config)

  const ui = ref(syncFrom(partida))
  const restoredFromSession = ref(!!saved)

  const showVictoryOverlay = ref(false)
  const showRuleta = ref(false)
  const victoryMessage = ref('HAS SUPERADO EL DESAFIO')
  const progress = useProgressStore()
  const winnerName = ref(progress.displayName || 'Jugador')
  const winnerImage = ref(PLAYER_PORTRAIT)
  const winnerCard = ref<BingoCell[]>([])
  const winnerCardSize = ref(partida.size)
  const winnerIndices = ref<number[]>([])
  const playerWon = ref(true)

  const { lastClear, registrarVictoria, registrarDerrota } = useLevelClear(levelNumber)

  let timerId: ReturnType<typeof setTimeout> | null = null
  let serverRoundId: string | null = saved?.serverRoundId ?? null
  let serverRunId: string | null = saved?.serverRunId ?? null
  let modoElegido: WinMode | null = null
  let solicitudBolaEnCurso = false
  let bolaPendienteBots: number | null = null
  let timerGeneration = 0
  const pending = new Map<string, ReturnType<typeof setTimeout>>()
  const colas = new Map<string, number[]>()

  function refresh() {
    ui.value = syncFrom(partida)
    persist()
  }

  function persist() {
    repo.guardar(definicion.sessionKey, {
      ...partida.toSnap(),
      serverRoundId,
      serverRunId,
    })
  }

  function stopTimer() {
    timerGeneration += 1
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function clearPending() {
    for (const t of pending.values()) clearTimeout(t)
    pending.clear()
    colas.clear()
  }

  function startTimer() {
    stopTimer()
    const generation = timerGeneration
    const programarBola = () => {
      if (generation !== timerGeneration || partida.status !== 'playing' || !serverRoundId) return
      timerId = setTimeout(() => {
        const rondaId = serverRoundId
        if (!rondaId || generation !== timerGeneration) return
        if (solicitudBolaEnCurso) {
          programarBola()
          return
        }
        solicitudBolaEnCurso = true
        void progress
          .siguienteBola(rondaId)
          .then((numero) => {
            if (serverRoundId !== rondaId) return
            if (!partida.registrarBolaCantada(numero)) {
              throw new Error('El servidor y el juego dejaron de estar sincronizados. Vuelve a abrir el nivel.')
            }
            refresh()
            if (partida.status === 'playing') onNumberCalled(numero)
            else bolaPendienteBots = numero
          })
          .catch((error: unknown) => {
            if (serverRoundId !== rondaId) return
            const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0
            if (status !== 429) {
              stopTimer()
              partida.pausar()
              partida.mostrarError(error instanceof Error ? error.message : 'No se pudo conectar con la partida.')
              refresh()
            }
          })
          .finally(() => {
            solicitudBolaEnCurso = false
            if (generation === timerGeneration) programarBola()
          })
      }, partida.drawIntervalMs)
    }
    programarBola()
  }

  function openVictory(opts: {
    message: string
    name: string
    image: string
    card: BingoCell[]
    cardSize: number
    indices: number[]
    playerWon: boolean
  }) {
    victoryMessage.value = opts.message
    winnerName.value = opts.name
    winnerImage.value = opts.image
    winnerCard.value = opts.card.map((c) => ({ ...c }))
    winnerCardSize.value = opts.cardSize
    winnerIndices.value = [...opts.indices]
    playerWon.value = opts.playerWon
    showVictoryOverlay.value = true
  }

  function onNumberCalled(number: number) {
    if (partida.status !== 'playing') return
    for (const bot of partida.snapshotsBots()) {
      if (bot.won) continue
      encolarOMarcar(bot.id, number)
    }
  }

  function encolarOMarcar(botId: BotRuntime['id'], number: number) {
    const actual = partida.snapshotsBots().find((b) => b.id === botId)
    if (actual?.busy) {
      const q = colas.get(botId) ?? []
      if (!q.includes(number)) q.push(number)
      colas.set(botId, q)
      return
    }
    scheduleMark(botId, number)
  }

  function siguienteDeCola(botId: BotRuntime['id']) {
    const q = colas.get(botId)
    if (!q?.length) return
    const n = q.shift()
    if (!q.length) colas.delete(botId)
    else colas.set(botId, q)
    if (n === undefined) return
    scheduleMark(botId, n)
  }

  function scheduleMark(botId: BotRuntime['id'], number: number) {
    const key = `${botId}:${number}`
    if (pending.has(key)) {
      siguienteDeCola(botId)
      return
    }
    const decision = partida.decidirBot(botId, number)
    if (!decision) {
      siguienteDeCola(botId)
      return
    }
    if (!decision.marcar) {
      refresh()
      siguienteDeCola(botId)
      return
    }
    partida.setBotBusy(botId, true, 'Pensando…')
    refresh()
    const timer = setTimeout(() => {
      pending.delete(key)
      if (partida.status !== 'playing') {
        partida.setBotBusy(botId, false)
        refresh()
        return
      }
      const bingo = partida.marcarBot(botId, decision.indiceCelda)
      refresh()
      if (bingo) {
        colas.delete(botId)
        partida.setBotBusy(botId, true, '¡BINGO!')
        refresh()
        const winTimer = setTimeout(() => {
          void (async () => {
            if (partida.status !== 'playing') return
            const runtime = partida.confirmarBingoBot(botId)
            if (!runtime) return
            partida.perderContra(runtime.name)
            await registrarDerrota(serverRoundId ?? undefined)
            openVictory({
              message: `¡${runtime.name} gritó BINGO primero!`,
              name: runtime.name,
              image: botPortrait(runtime.id),
              card: runtime.card,
              cardSize: partida.size,
              indices: [...partida.indicesGanadores],
              playerWon: false,
            })
            stopTimer()
            clearPending()
            refresh()
          })()
        }, 700)
        pending.set(`${botId}:win`, winTimer)
        return
      }
      siguienteDeCola(botId)
    }, decision.delayMs)
    pending.set(key, timer)
  }

  function aplicarFase(index: number) {
    config = CatalogoNiveles.configPartida(levelNumber, index)
    partida.reconfigurar(config)
    refresh()
  }

  async function beginPlaying() {
    try {
      if (serverRoundId && (partida.status === 'playing' || partida.status === 'paused')) {
        await progress.cerrarRonda(serverRoundId).catch(() => undefined)
      }
      const ronda = await progress.iniciarRonda(
        levelNumber,
        partida.phase,
        modoElegido ?? undefined,
        serverRunId ?? undefined,
      )
      serverRoundId = ronda.id
      serverRunId = ronda.runId
      config = {
        ...config,
        level: levelNumber,
        phase: ronda.fase as 1 | 2 | 3,
        size: ronda.tamano,
        maxNumber: ronda.maxNumero,
        randomCardCount: ronda.cartones.length,
        drawIntervalMs: ronda.intervaloMs,
        winModes: [...ronda.modos],
        methodLabel:
          ronda.modos.length === 1 && ronda.modos[0]
            ? `Método: ${nombreMetodo(ronda.modos[0])}`
            : config.methodLabel,
      }
      partida.reconfigurar(config)
      if (modoElegido) partida.fijarModoVictoria(modoElegido)
      partida.iniciarConCartones(ronda.cartones)
      if (levelNumber <= 9 && !modoElegido && ronda.modos.length === 1 && ronda.modos[0]) {
        partida.mostrarInfo(`Forma de ganar: ${nombreMetodo(ronda.modos[0])}.`)
      }
      modoElegido = null
    } catch (error) {
      partida.mostrarError(error instanceof Error ? error.message : 'No se pudo iniciar una ronda validada por el servidor.')
      refresh()
      return
    }
    startTimer()
    refresh()
  }

  function maybeRuletaThenStart() {
    const faseDef = definicion.fases[partida.phase - 1]
    const requiereRuleta =
      levelNumber === 10
        ? (faseDef?.evento ?? 'ruleta') === 'ruleta' && partida.winModes.length > 0
        : partida.winModes.length > 1
    if (requiereRuleta) {
      showRuleta.value = true
      refresh()
      return
    }
    if (levelNumber <= 9 && partida.winModes.length === 1 && partida.winModes[0]) {
      partida.mostrarInfo(`Forma de ganar: ${nombreMetodo(partida.winModes[0])}.`)
      refresh()
    }
    void beginPlaying()
  }

  function startMatch() {
    if (showRuleta.value) return
    if (serverRoundId && (partida.status === 'playing' || partida.status === 'paused')) {
      void progress.cerrarRonda(serverRoundId).catch(() => undefined)
      serverRoundId = null
    }
    clearPending()
    stopTimer()
    let faseIdx = Math.max(0, partida.phase - 1)
    if (ui.value.status === 'won' && definicion.fases.length > 1 && ui.value.phase < definicion.fases.length) {
      faseIdx = ui.value.phase
    } else if (ui.value.status === 'won' && definicion.fases.length > 1 && ui.value.phase === definicion.fases.length) {
      faseIdx = 0
      serverRunId = null
    }
    modoElegido = null
    aplicarFase(faseIdx)
    maybeRuletaThenStart()
  }

  function onRuletaElegido(mode: WinMode) {
    showRuleta.value = false
    modoElegido = mode
    partida.fijarModoVictoria(mode)
    void beginPlaying()
  }

  function prepararSiguienteFase() {
    showVictoryOverlay.value = false
    if (definicion.fases.length <= 1 || partida.phase >= definicion.fases.length) return
    serverRoundId = null
    aplicarFase(partida.phase)
    refresh()
  }

  function togglePause() {
    if (partida.status === 'playing') {
      stopTimer()
      clearPending()
      partida.pausar()
    } else if (partida.status === 'paused') {
      partida.reanudar()
      if (bolaPendienteBots !== null) {
        onNumberCalled(bolaPendienteBots)
        bolaPendienteBots = null
      }
      startTimer()
    }
    refresh()
  }

  function toggleCell(a: number, b?: number) {
    partida.marcarCelda(a, b)
    refresh()
  }

  async function claimBingo(cardIndex = 0) {
    if (solicitudBolaEnCurso) {
      partida.mostrarError('Espera a que termine de llegar la bola del oráculo y vuelve a reclamar.')
      refresh()
      return { won: false, winningIndices: [], reason: 'no-line' as const }
    }
    const result = partida.reclamarBingo(cardIndex)
    if (result.won) {
      stopTimer()
      clearPending()
      if (!serverRoundId) {
        partida.rechazarReclamo('No hay una ronda activa en el servidor. Inicia la partida de nuevo.')
        refresh()
        return { won: false, winningIndices: [], reason: 'no-line' as const }
      }
      try {
        let confirmacion: ConfirmacionVictoriaRemota
        try {
          confirmacion = await registrarVictoria(serverRoundId, cardIndex)
        } catch (primerError) {
          const status = primerError && typeof primerError === 'object' && 'status' in primerError
            ? Number(primerError.status)
            : 0
          if (status !== 0) throw primerError
          // Si se perdió la respuesta luego de guardar la victoria, el segundo
          // intento devuelve la confirmación de forma segura e idempotente.
          confirmacion = await registrarVictoria(serverRoundId, cardIndex)
        }
        if (!confirmacion.ok) throw new Error('El servidor no confirmó esta victoria.')
        if (confirmacion.nivelCompleto) serverRunId = null
      } catch (error) {
        partida.rechazarReclamo(error instanceof Error ? error.message : 'El servidor no confirmó esta victoria.')
        const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0
        if (status !== 0) startTimer()
        refresh()
        return { won: false, winningIndices: [], reason: 'no-line' as const }
      }
      if (definicion.fases.length > 1 && partida.phase < definicion.fases.length) {
        partida.setWinMessage(`¡Fase ${partida.phase} superada! Pulsa → para la siguiente.`)
      } else if (definicion.fases.length > 1) {
        partida.setWinMessage('¡VICTORIA TOTAL! Completaste las 3 fases del nivel 10.')
      }
    }
    refresh()
    if (result.won) {
      const board = partida.snapshotCarton(partida.cartonGanador ?? 0)
      const msg =
        definicion.fases.length > 1 && partida.phase < definicion.fases.length
          ? `HAS SUPERADO LA FASE ${partida.phase}`
          : 'HAS SUPERADO EL DESAFIO'
      openVictory({
        message: msg,
        name: progress.displayName || 'Jugador',
        image: PLAYER_PORTRAIT,
        card: board,
        cardSize: partida.size,
        indices: [...partida.indicesGanadores],
        playerWon: true,
      })
    }
    return result
  }

  function previewPhase(p: number) {
    if (partida.status === 'playing' || partida.status === 'paused') return
    if (partida.status === 'won' || partida.status === 'lost') return
    if (p < 1 || p > definicion.fases.length) return
    aplicarFase(p - 1)
  }

  function isCellCalled(number: number) {
    return partida.esCeldaCantada(number)
  }

  function isWinningCell(a: number, b?: number) {
    return partida.esCeldaGanadora(a, b)
  }

  function dispose() {
    stopTimer()
    clearPending()
  }

  function clearSession() {
    if (serverRoundId && (partida.status === 'playing' || partida.status === 'paused')) {
      void progress.cerrarRonda(serverRoundId).catch(() => undefined)
    }
    repo.borrar(definicion.sessionKey)
  }

  const cards = computed(() => ui.value.cards)
  const card = computed(() => ui.value.cards[0] ?? [])
  const status = computed(() => ui.value.status)
  const lastClaim = computed(() => ui.value.lastClaim)
  const lastDrawn = computed(() => ui.value.lastDrawn)
  const calledList = computed(() => ui.value.calledList)
  const methodLabel = computed(() => ui.value.methodLabel)
  const winningIndices = computed(() => ui.value.winningIndices)
  const size = computed(() => ui.value.size)
  const winModes = computed(() => ui.value.winModes)
  const oscuridad = computed(() => ui.value.oscuridad)
  const phase = computed(() => ui.value.phase)
  const bots = computed(() => ui.value.bots)
  const leftBots = computed(() => ui.value.bots.filter((b) => b.side === 'left'))
  const rightBots = computed(() => ui.value.bots.filter((b) => b.side === 'right'))
  const isPaused = computed(() => ui.value.status === 'paused')
  const isEnded = computed(() => ui.value.status === 'won' || ui.value.status === 'lost')
  const isPlaying = computed(() => ui.value.status === 'playing')
  const recentCalls = computed(() => ui.value.calledList.slice(-3))
  const oracleSlots = computed(() => {
    const slots: (number | null)[] = [null, null, null]
    const recent = recentCalls.value
    const start = slots.length - recent.length
    recent.forEach((n, i) => {
      slots[start + i] = n
    })
    return slots
  })

  const idleHint = computed(() => {
    const f = definicion.fases[phase.value - 1]
    if (levelNumber <= 9 && f?.winModes.length === 1 && f.winModes[0]) {
      return `Forma de ganar: ${nombreMetodo(f.winModes[0])}.`
    }
    return f?.idleHint ?? definicion.idleHint
  })

  const primaryActionIcon = computed(() => {
    if (status.value === 'won' && definicion.fases.length > 1 && phase.value < definicion.fases.length) {
      return '→'
    }
    if (status.value === 'idle') return '▶'
    return '↻'
  })

  watch(
    () => ui.value.status,
    (s) => {
      if (s === 'won' || s === 'lost') {
        stopTimer()
        clearPending()
      }
    },
  )

  onUnmounted(() => dispose())

  return {
    definicion,
    levelNumber,
    cards,
    card,
    status,
    lastClaim,
    lastDrawn,
    calledList,
    methodLabel,
    winningIndices,
    size,
    winModes,
    oscuridad,
    phase,
    bots,
    leftBots,
    rightBots,
    isPaused,
    isEnded,
    isPlaying,
    oracleSlots,
    idleHint,
    primaryActionIcon,
    lastClear,
    restoredFromSession,
    showVictoryOverlay,
    showRuleta,
    victoryMessage,
    winnerName,
    winnerImage,
    winnerCard,
    winnerCardSize,
    winnerIndices,
    playerWon,
    startMatch,
    onRuletaElegido,
    prepararSiguienteFase,
    togglePause,
    toggleCell,
    claimBingo,
    previewPhase,
    isCellCalled,
    isWinningCell,
    dispose,
    clearSession,
    persist,
  }
}
