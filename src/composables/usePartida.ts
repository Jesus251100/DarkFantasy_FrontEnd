import { computed, onUnmounted, ref, watch } from 'vue'
import { CatalogoNiveles } from '../domain/campania/CatalogoNiveles'
import { useProgressStore } from '../stores/progress'
import type { BingoCell, WinMode } from '../domain/bingo/tipos'
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
  const saved = repo.cargar(definicion.sessionKey)
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

  const canClear = computed(() => {
    if (definicion.fases.length <= 1) return true
    return ui.value.phase === definicion.fases.length
  })

  const { lastClear, registrarVictoria, registrarDerrota } = useLevelClear(levelNumber, canClear)

  let timerId: ReturnType<typeof setInterval> | null = null
  const pending = new Map<string, ReturnType<typeof setTimeout>>()
  const colas = new Map<string, number[]>()

  function refresh() {
    ui.value = syncFrom(partida)
    persist()
  }

  function persist() {
    repo.guardar(definicion.sessionKey, partida.toSnap())
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId)
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
    timerId = setInterval(() => {
      const n = partida.cantarSiguiente()
      refresh()
      if (n !== null) onNumberCalled(n)
    }, partida.drawIntervalMs)
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
            await registrarDerrota()
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

  function beginPlaying() {
    partida.iniciar()
    startTimer()
    refresh()
  }

  function maybeRuletaThenStart() {
    const faseDef = definicion.fases[partida.phase - 1]
    if ((faseDef?.evento ?? 'ruleta') === 'ruleta' && partida.winModes.length > 0) {
      showRuleta.value = true
      refresh()
      return
    }
    beginPlaying()
  }

  function startMatch() {
    if (showRuleta.value) return
    clearPending()
    stopTimer()
    let faseIdx = Math.max(0, partida.phase - 1)
    if (ui.value.status === 'won' && definicion.fases.length > 1 && ui.value.phase < definicion.fases.length) {
      faseIdx = ui.value.phase
    } else if (ui.value.status === 'won' && definicion.fases.length > 1 && ui.value.phase === definicion.fases.length) {
      faseIdx = 0
    }
    aplicarFase(faseIdx)
    maybeRuletaThenStart()
  }

  function onRuletaElegido(mode: WinMode) {
    showRuleta.value = false
    partida.fijarModoVictoria(mode)
    beginPlaying()
  }

  function prepararSiguienteFase() {
    showVictoryOverlay.value = false
    if (definicion.fases.length <= 1 || partida.phase >= definicion.fases.length) return
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
      startTimer()
    }
    refresh()
  }

  function toggleCell(a: number, b?: number) {
    partida.marcarCelda(a, b)
    refresh()
  }

  async function claimBingo(cardIndex = 0) {
    const result = partida.reclamarBingo(cardIndex)
    if (result.won) {
      stopTimer()
      clearPending()
      if (definicion.fases.length > 1 && partida.phase < definicion.fases.length) {
        partida.setWinMessage(`¡Fase ${partida.phase} superada! Pulsa → para la siguiente.`)
      } else if (definicion.fases.length > 1) {
        partida.setWinMessage('¡VICTORIA TOTAL! Completaste las 3 fases del nivel 10.')
      }
    }
    refresh()
    if (result.won) {
      await registrarVictoria()
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
