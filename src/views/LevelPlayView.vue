<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BossCard from '../components/BossCard.vue'
import BossPhaseIntro from '../components/BossPhaseIntro.vue'
import MethodPatternPreview from '../components/MethodPatternPreview.vue'
import AchievementUnlockOverlay from '../components/AchievementUnlockOverlay.vue'
import VictoryChallengeOverlay from '../components/VictoryChallengeOverlay.vue'
import RuletaMetodosOverlay from '../components/RuletaMetodosOverlay.vue'
import PauseOverlay from '../components/PauseOverlay.vue'
import { nombreCorto } from '../domain/bingo/nombresMetodo'
import { patronDesdeModo } from '../domain/bingo/patrones/catalogoPatrones'
import {
  casillaDeProgreso,
  progresoDeFigura,
  UMBRAL_PROGRESO_NIEBLA,
} from '../domain/online/niebla'
import { usePartida } from '../composables/usePartida'
import { useNieblaOnline } from '../composables/useNieblaOnline'
import { useAudioStore } from '../stores/audio'
import type { BingoCell, WinMode } from '../domain/bingo/tipos'
import jefeGif from '@/assets/img/jefeFinal.gif'
import fondo10 from '@/assets/img/fondo10.png'
import level1 from '@/assets/img/level1.gif'
import level2 from '@/assets/img/level2.gif'
import level3 from '@/assets/img/level3.gif'
import level4 from '@/assets/img/level4.gif'
import level5 from '@/assets/img/level5.gif'
import level6 from '@/assets/img/level6.gif'
import level7 from '@/assets/img/level7.gif'
import level8 from '@/assets/img/level8.gif'
import level9 from '@/assets/img/level9.gif'
import level10 from '@/assets/img/level10.gif'

const FONDOS: Record<number, string> = {
  1: level1,
  2: level2,
  3: level3,
  4: level4,
  5: level5,
  6: level6,
  7: level7,
  8: level8,
  9: level9,
  10: level10,
}

const props = defineProps<{ levelNumber: number }>()
const router = useRouter()
const play = usePartida(props.levelNumber)
const audioSettings = useAudioStore()
const {
  definicion,
  cards,
  status,
  lastClaim,
  lastDrawn,
  calledList,
  methodLabel,
  size,
  winModes,
  oscuridad,
  evento,
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
  showVictoryOverlay,
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
  desmarcarCelda,
  devolverBola,
  avisar,
  claimBingo,
  previewPhase,
  isCellCalled,
  isWinningCell,
  dispose,
  clearSession,
  showRuleta,
  showBossBriefing,
  confirmarInicioJefe,
} = play

const fondo = computed(() =>
  definicion.fondo === 'final' ? fondo10 : (FONDOS[props.levelNumber] ?? level1),
)

const logroVisible = ref(false)
const logroActual = computed(() => (playerWon.value ? (lastClear.value?.logro ?? null) : null))

watch(showVictoryOverlay, (abierto) => audioSettings.setMusicPaused(abierto), { flush: 'sync' })
onUnmounted(() => audioSettings.setMusicPaused(false))

watch(showVictoryOverlay, (abierto, antes) => {
  if (antes && !abierto && logroActual.value) logroVisible.value = true
})

const multiCard = computed(() => cards.value.length > 1)
const gridClass = computed(() => `grid-${size.value}`)
const nieblaActiva = computed(() => evento.value === 'niebla')

const figurasMetodo = computed(() => {
  const modo = winModes.value[0]
  if (!modo) return []
  return patronDesdeModo(modo).indices(size.value)
})

const nieblaCardIndex = computed(() => {
  let mejor = 0
  for (let i = 1; i < cards.value.length; i++) {
    if (progresoDeFigura(cards.value[i] ?? [], figurasMetodo.value) > progresoDeFigura(cards.value[mejor] ?? [], figurasMetodo.value)) mejor = i
  }
  return mejor
})
const progresoMetodo = computed(() => Math.max(0, ...cards.value.map((card) => progresoDeFigura(card, figurasMetodo.value))))
const cortesEspada = ref<Record<number, 'slash' | 'gone' | 'regrow'>>({})
const temporizadoresEspada = new Map<number, ReturnType<typeof setTimeout>[]>()
const numerosYaCortados = new Set<number>()
const numerosCortados = computed(() => new Set(Object.keys(cortesEspada.value).map(Number)))
function programarCorteEspada() {
  if (props.levelNumber !== 10 || phase.value !== 2 || status.value !== 'playing' || progresoMetodo.value < 0.45) return
  for (const card of cards.value) {
    for (const index of figurasMetodo.value.flat()) {
      const cell = card[index]
      if (!cell || cell.free || cell.marked || !calledList.value.includes(cell.number) || numerosYaCortados.has(cell.number) || cortesEspada.value[cell.number] || temporizadoresEspada.has(cell.number)) continue
      const number = cell.number
      numerosYaCortados.add(number)
      const timers: ReturnType<typeof setTimeout>[] = []
      temporizadoresEspada.set(number, timers)
      timers.push(setTimeout(() => {
        const sigueSinMarcar = cards.value.some((tablero) => figurasMetodo.value.flat().some((index) => tablero[index]?.number === number && !tablero[index]?.marked))
        if (status.value !== 'playing' || phase.value !== 2 || !calledList.value.includes(number) || !sigueSinMarcar) { temporizadoresEspada.delete(number); return }
        cortesEspada.value = { ...cortesEspada.value, [number]: 'slash' }
        timers.push(setTimeout(() => {
          cortesEspada.value = { ...cortesEspada.value, [number]: 'gone' }
          timers.push(setTimeout(() => {
            cortesEspada.value = { ...cortesEspada.value, [number]: 'regrow' }
            timers.push(setTimeout(() => {
              void devolverBola(number).then((ok) => {
                const next = { ...cortesEspada.value }; delete next[number]; cortesEspada.value = next
                if (!ok && status.value === 'playing') avisar('La casilla volvió, pero no se pudo regresar la bola al sorteo.')
              })
              temporizadoresEspada.delete(number)
            }, 4000))
          }, 7000))
        }, 600))
      }, 4000))
    }
  }
}
function limpiarCortesEspada() {
  for (const timers of temporizadoresEspada.values()) timers.forEach(clearTimeout)
  temporizadoresEspada.clear()
  cortesEspada.value = {}
  numerosYaCortados.clear()
}
watch([progresoMetodo, calledList, status, phase], programarCorteEspada, { deep: true })
watch([status, phase], ([estado, fase]) => {
  if (estado !== 'playing' || fase !== 2) limpiarCortesEspada()
})

function iniciarPartida() {
  startMatch()
  const orientacion = typeof screen !== 'undefined' ? screen.orientation as (ScreenOrientation & { lock?: (orientation: string) => Promise<void> }) | undefined : undefined
  if (orientacion?.lock) void orientacion.lock('landscape').catch(() => undefined)
}

const nieblaProgramada = ref(false)
const {
  fase: faseNiebla,
  indices: nieblaIndices,
  rojas: nieblaRojas,
  intentos: nieblaIntentos,
  textos: nieblaTextos,
  completa: nieblaCompleta,
  saliendo: nieblaSaliendo,
  enCasillas: nieblaEnCasillas,
  startFogEvent,
  escribir: escribirNiebla,
  enviar: enviarNiebla,
  reiniciar: reiniciarNiebla,
  numeroOculto,
  bloqueaCarton,
} = useNieblaOnline({
  celdas: () => cards.value[nieblaCardIndex.value] ?? [],
  cantadas: () => calledList.value,
  avisar,
  penalizar: () => quitarCasillaDeLaFigura(),
})

function quitarCasillaDeLaFigura() {
  if (!winModes.value[0]) return
  const indice = casillaDeProgreso(cards.value[nieblaCardIndex.value] ?? [], figurasMetodo.value, nieblaIndices.value)
  if (indice === null) {
    avisar('Te equivocaste. Tu figura no tenía una casilla marcada para quitar.')
    return
  }
  desmarcarCelda(nieblaCardIndex.value, indice)
  avisar('Te equivocaste. La niebla te quitó una casilla de la figura.')
}

function reiniciarEventoNiebla() {
  reiniciarNiebla()
  nieblaProgramada.value = false
}

function intentarEventoNiebla() {
  if (!nieblaActiva.value) return
  if (nieblaProgramada.value || faseNiebla.value !== 'idle') return
  if (status.value !== 'playing' || showVictoryOverlay.value || showBossBriefing.value) return
  if (progresoMetodo.value < UMBRAL_PROGRESO_NIEBLA) return
  if (!startFogEvent()) return
  nieblaProgramada.value = true
}

function onMarcarNiebla(cardIndex: number, indice: number) {
  if (cardIndex !== nieblaCardIndex.value) return
  if (bloqueaCarton() || nieblaIndices.value.includes(indice)) return
  const antes = cards.value[cardIndex]?.[indice]
  if (!antes || antes.free) return
  const estabaMarcada = antes.marked
  toggleCell(indice)
  if (!estabaMarcada && cards.value[cardIndex]?.[indice]?.marked) intentarEventoNiebla()
}

function onMarcarCelda(cardIndex: number, cellIndex: number) {
  if (nieblaActiva.value) {
    onMarcarNiebla(cardIndex, cellIndex)
    return
  }
  if (multiCard.value) toggleCell(cardIndex, cellIndex)
  else toggleCell(cellIndex)
}

function onEscribirNiebla(indice: number, evento: Event) {
  const input = evento.target
  if (!(input instanceof HTMLInputElement)) return
  escribirNiebla(indice, input.value)
}

watch([progresoMetodo, status, showVictoryOverlay, showBossBriefing], () => {
  intentarEventoNiebla()
})

watch(status, (valor, anterior) => {
  if (valor === 'playing' && anterior === 'idle') reiniciarEventoNiebla()
  if (valor === 'won' || valor === 'lost') reiniciarEventoNiebla()
})

watch(phase, () => reiniciarEventoNiebla())
const jefe = computed(() => bots.value.find((bot) => bot.id === 'dragon') ?? null)
const metodoJefe = computed(() => methodLabel.value.replace(/^Método:\s*/i, ''))

function metodoCortoDeFase(p: number) {
  const fase = definicion.fases[p - 1]
  if (!fase || fase.winModes.length !== 1) return ''
  const modo = fase.winModes[0]
  return modo ? nombreCorto(modo) : ''
}
const dialogoJefe = computed(() => {
  if (status.value === 'idle') {
    return [
      'Que comience el sorteo. Cada bola acercará a alguien a su destino.',
      'No confundas una buena racha con una victoria, retador.',
      'El último patrón decidirá quién merece este trono.',
    ][Math.max(0, phase.value - 1)] ?? 'El oráculo aguarda la próxima bola.'
  }
  if (status.value === 'paused') return 'Hasta el azar contiene el aliento mientras esperamos.'
  if (status.value === 'won') return 'Has superado esta fase. La siguiente prueba ya te espera.'
  if (status.value === 'lost') return 'Este cartón ya tiene dueño. Vuelve cuando estés listo.'
  return jefe.value?.statusText ?? 'El oráculo aún no ha cantado.'
})

const previewItems = computed(() => {
  const modes = winModes.value
  const s = size.value
  const fase = definicion.fases[phase.value - 1]
  const nivelDeUnMetodo = props.levelNumber <= 9 && fase?.winModes.length === 1
  if ((status.value === 'idle' && props.levelNumber !== 10) || modes.length !== 1 || nivelDeUnMetodo) return []
  return [{ size: s, winModes: [modes[0] as WinMode] }]
})

const nextPhaseNum = computed(() => {
  if (!playerWon.value) return null
  if (definicion.fases.length > 1 && phase.value < definicion.fases.length) {
    return phase.value + 1
  }
  return null
})

const nextLevelNum = computed(() => {
  if (!playerWon.value) return null
  if (nextPhaseNum.value) return null
  if (props.levelNumber >= 10) return null
  return props.levelNumber + 1
})

/**
 * Bolas que el jugador no marcó. La última, si está en el cartón, espera
 * al siguiente canto para darle tiempo a pulsarla.
 * Con 5 aparece la nube al 20%. Cada 2 más suma otro 20%, hasta 100%.
 * Cada número marcado le quita 10% para que el cartón se vea de nuevo.
 */
const opacidadNube = computed(() => {
  if (!oscuridad.value || (status.value !== 'playing' && status.value !== 'paused')) return 0
  const llamadas = calledList.value
  let sinMarca = 0
  let marcas = 0
  for (const board of cards.value) {
    for (const cell of board) {
      if (!cell.free && cell.marked) marcas++
    }
  }
  for (let i = 0; i < llamadas.length; i++) {
    const numero = llamadas[i]
    let enCarton = false
    let marcada = false
    for (const board of cards.value) {
      for (const cell of board) {
        if (cell.free || cell.number !== numero) continue
        enCarton = true
        if (cell.marked) marcada = true
      }
    }
    if (marcada) continue
    if (!enCarton || i < llamadas.length - 1) sinMarca++
  }
  if (sinMarca < 5) return 0
  const base = Math.min(100, 20 + Math.floor((sinMarca - 5) / 2) * 20)
  return Math.max(0, base - marcas * 10)
})

function cellClass(cell: BingoCell, cellIndex: number, cardIndex: number) {
  return {
    free: cell.free,
    marked: cell.marked && !cell.free,
    called: isCellCalled(cell.number) && !cell.marked && !cell.free,
    winning: isWinningCell(cardIndex, cellIndex),
  }
}

function onClaim(cardIndex: number) {
  claimBingo(cardIndex)
}

function leaveLevel() {
  clearSession()
  dispose()
  router.push('/levels')
}

function onPauseToLevels() {
  clearSession()
  dispose()
  router.push('/levels')
}

function onPauseQuit() {
  clearSession()
  dispose()
  router.push('/lobby')
}

function onVictoryLevels() {
  clearSession()
  dispose()
  router.push('/levels')
}

function onVictoryNext() {
  if (nextPhaseNum.value) {
    prepararSiguienteFase()
    return
  }
  if (!nextLevelNum.value) {
    onVictoryLevels()
    return
  }
  clearSession()
  dispose()
  router.push(`/level${nextLevelNum.value}`)
}
</script>

<template>
  <div
    class="level-play"
    :class="[
      'level-' + levelNumber,
      { 'is-final': definicion.fondo === 'final', 'is-oscuridad': oscuridad && isPlaying },
    ]"
    :style="{ backgroundImage: `url(${fondo})` }"
  >
    <VictoryChallengeOverlay
      v-model:show="showVictoryOverlay"
      :message="victoryMessage"
      :winner-name="winnerName"
      :winner-image="winnerImage"
      :winner-card="winnerCard"
      :card-size="winnerCardSize"
      :winning-indices="winnerIndices"
      :player-won="playerWon"
      :reward-text="playerWon && lastClear?.hint ? lastClear.hint : ''"
      :next-level="nextLevelNum"
      :next-phase="nextPhaseNum"
      :qte-enabled="definicion.muestraJefe && playerWon && nextPhaseNum !== null"
      :qte-phase="phase"
      @go-levels="onVictoryLevels"
      @go-next="onVictoryNext"
    />
    <BossPhaseIntro
      :show="showBossBriefing"
      :phase="phase"
      :method="metodoJefe"
      :dialogue="dialogoJefe"
      @start="confirmarInicioJefe"
    />
    <AchievementUnlockOverlay
      v-model:show="logroVisible"
      :nombre="logroActual?.nombre ?? ''"
      :imagen="logroActual?.imagen ?? ''"
      :monedas="logroActual?.monedas ?? 0"
      :diamantes="logroActual?.diamantes ?? 0"
    />
    <RuletaMetodosOverlay
      :show="showRuleta"
      :metodos="winModes"
      :size="size"
      @elegido="onRuletaElegido"
    />
    <PauseOverlay
      :open="isPaused"
      @resume="togglePause"
      @restart="startMatch"
      @to-levels="onPauseToLevels"
      @quit="onPauseQuit"
    />

    <div class="content">
      <button type="button" class="back-btn" aria-label="Volver a niveles" @click="leaveLevel">
        <span class="back-ico" aria-hidden="true">‹</span>
      </button>

      <div
        v-if="definicion.fases.length > 1"
        class="phase-tabs"
        role="tablist"
        aria-label="Fases del nivel"
      >
        <button
          v-for="p in definicion.fases.length"
          :key="p"
          type="button"
          class="phase-tab"
          :class="{
            active: phase === p,
            cleared: p < phase || (p === phase && status === 'won' && p === definicion.fases.length),
            locked: p > phase,
          }"
          :disabled="definicion.muestraJefe || status === 'playing' || status === 'paused'"
          @click="previewPhase(p)"
        >
          Fase {{ p }}
          <span v-if="metodoCortoDeFase(p)" class="phase-tab-method">
            {{ metodoCortoDeFase(p) }}
          </span>
        </button>
      </div>

      <div class="main-container" :class="{ 'has-jefe': definicion.muestraJefe }">
        <div v-if="!definicion.muestraJefe" class="left-section">
          <BossCard
            v-for="bot in leftBots"
            :key="bot.id"
            :bot="bot"
            :match-over="isEnded"
          />
        </div>

        <div class="center-section">
          <div :class="multiCard ? 'bingo-panels' : 'bingo-panel-wrap'">
            <div
              v-for="(board, cardIndex) in cards"
              :key="cardIndex"
              class="bingo-panel"
              :class="{ 'panel-wide': size >= 6 }"
            >
              <h1 class="title">
                {{
                  definicion.muestraJefe
                    ? phase === 3
                      ? 'REGISTRO · FINAL'
                      : `REGISTRO · F${phase}`
                    : multiCard
                      ? `REGISTRO ${cardIndex + 1}`
                      : 'REGISTRO'
                }}
              </h1>
              <p v-if="nieblaActiva && cardIndex === nieblaCardIndex && nieblaEnCasillas" class="niebla-intentos">
                Niebla · intentos {{ nieblaIntentos }}/3
              </p>
              <div class="grid-nube">
                <div class="bingo-grid" :class="gridClass" role="grid">
                  <div
                    v-for="(cell, cellIndex) in board"
                    :key="cellIndex"
                    class="cell-wrap"
                  >
                    <button
                      type="button"
                      class="bingo-number"
                      :class="cellClass(cell, cellIndex, cardIndex)"
                      :disabled="isEnded || status === 'idle' || cell.free || numerosCortados.has(cell.number)"
                      :aria-pressed="cell.marked"
                      @click="onMarcarCelda(cardIndex, cellIndex)"
                    >
                      {{
                        cell.free
                          ? 'free'
                          : numerosCortados.has(cell.number) && cortesEspada[cell.number] === 'gone'
                            ? ''
                          : nieblaActiva && cardIndex === nieblaCardIndex && numeroOculto(cellIndex)
                            ? ''
                            : cell.number
                      }}
                    </button>
                    <div
                      v-if="numerosCortados.has(cell.number)"
                      class="espada-casilla"
                      :class="`espada-${cortesEspada[cell.number]}`"
                      aria-hidden="true"
                    ><span v-if="cortesEspada[cell.number] === 'slash'">⚔</span></div>
                    <div
                      v-if="
                        nieblaActiva &&
                        cardIndex === nieblaCardIndex &&
                        (nieblaSaliendo || nieblaEnCasillas) &&
                        nieblaIndices.includes(cellIndex) &&
                        !cell.free &&
                        isCellCalled(cell.number)
                      "
                      class="niebla-casilla"
                      :class="{ roja: nieblaRojas.includes(cellIndex) }"
                    >
                      <span class="velo"></span>
                      <span class="grano g1"></span>
                      <span class="grano g2"></span>
                      <span class="sombra s1"></span>
                      <span class="humo h1"></span>
                      <input
                        v-if="nieblaEnCasillas"
                        class="niebla-input"
                        :value="nieblaTextos[cellIndex] ?? ''"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        maxlength="2"
                        autocomplete="off"
                        aria-label="Escribe el número que había en esta casilla"
                        @input="onEscribirNiebla(cellIndex, $event)"
                        @keydown.enter.prevent="enviarNiebla(cellIndex)"
                      />
                    </div>
                  </div>
                </div>
                <div
                  v-if="nieblaActiva && cardIndex === nieblaCardIndex && nieblaCompleta"
                  class="niebla-total"
                  :class="{ sale: nieblaSaliendo }"
                  aria-hidden="true"
                >
                  <span class="velo"></span>
                  <span class="grano g1"></span>
                  <span class="grano g2"></span>
                  <span class="sombra s1"></span>
                  <span class="sombra s2"></span>
                  <span class="sombra s3"></span>
                  <span class="humo h1"></span>
                  <span class="humo h2"></span>
                  <span class="humo h3"></span>
                </div>
                <svg v-if="nieblaActiva && cardIndex === nieblaCardIndex" class="niebla-defs" aria-hidden="true">
                  <filter id="df-niebla-ruido" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.007 0.015" numOctaves="5" seed="2" result="n">
                      <animate attributeName="baseFrequency" dur="20s" values="0.006 0.013;0.011 0.009;0.007 0.016;0.006 0.013" repeatCount="indefinite" />
                    </feTurbulence>
                    <feColorMatrix in="n" type="matrix" values="0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0 0 0 0 1" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncR type="linear" slope="0.85" intercept="0.12" />
                      <feFuncG type="linear" slope="0.86" intercept="0.14" />
                      <feFuncB type="linear" slope="0.8" intercept="0.18" />
                      <feFuncA type="linear" slope="0" intercept="0.92" />
                    </feComponentTransfer>
                  </filter>
                  <filter id="df-niebla-fina" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="3" seed="9" result="n">
                      <animate attributeName="baseFrequency" dur="16s" values="0.018 0.034;0.028 0.022;0.02 0.042;0.018 0.034" repeatCount="indefinite" />
                    </feTurbulence>
                    <feColorMatrix in="n" type="matrix" values="0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0 0 0 0 1" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncR type="linear" slope="0.9" intercept="0.05" />
                      <feFuncG type="linear" slope="0.9" intercept="0.06" />
                      <feFuncB type="linear" slope="0.86" intercept="0.1" />
                      <feFuncA type="linear" slope="0" intercept="1" />
                    </feComponentTransfer>
                  </filter>
                  <filter id="df-niebla-casilla" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.08 0.12" numOctaves="4" seed="5" result="n">
                      <animate attributeName="baseFrequency" dur="8s" values="0.07 0.1;0.1 0.08;0.08 0.13;0.07 0.1" repeatCount="indefinite" />
                    </feTurbulence>
                    <feColorMatrix in="n" type="matrix" values="0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0 0 0 0 1" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncR type="linear" slope="0.8" intercept="0.16" />
                      <feFuncG type="linear" slope="0.82" intercept="0.18" />
                      <feFuncB type="linear" slope="0.76" intercept="0.22" />
                      <feFuncA type="linear" slope="0" intercept="0.98" />
                    </feComponentTransfer>
                  </filter>
                  <filter id="df-niebla-roja" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.09 0.13" numOctaves="4" seed="8" result="n">
                      <animate attributeName="baseFrequency" dur="6s" values="0.08 0.11;0.12 0.09;0.09 0.14;0.08 0.11" repeatCount="indefinite" />
                    </feTurbulence>
                    <feColorMatrix in="n" type="matrix" values="0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0 0 0 0 1" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncR type="linear" slope="0.55" intercept="0.18" />
                      <feFuncG type="linear" slope="0.08" intercept="0.02" />
                      <feFuncB type="linear" slope="0.06" intercept="0.02" />
                      <feFuncA type="linear" slope="0" intercept="0.98" />
                    </feComponentTransfer>
                  </filter>
                </svg>
                <div
                  v-if="opacidadNube > 0"
                  class="nube-oscuridad"
                  :style="{ opacity: opacidadNube / 100 }"
                  aria-hidden="true"
                ></div>
              </div>
              <button
                type="button"
                class="bingo-btn"
                :disabled="status === 'idle' || isEnded"
                @click="onClaim(cardIndex)"
              >
                BINGO
              </button>
            </div>
          </div>

          <p v-if="lastClaim" class="feedback" :class="lastClaim.type" role="status">
            {{ lastClaim.message }}
          </p>
          <p v-else-if="status === 'idle'" class="feedback info" role="status">
            {{ idleHint }}
          </p>
        </div>

        <div v-if="!definicion.muestraJefe" class="right-section">
          <BossCard
            v-for="bot in rightBots"
            :key="bot.id"
            :bot="bot"
            :match-over="isEnded"
          />
        </div>

        <div v-else class="boss-arena">
          <div class="boss-placeholder">
            <img :src="jefeGif + '?v=orig1'" alt="Malgrath, Rey de las Cenizas" decoding="async" draggable="false" />
          </div>
          <div class="boss-info">
            <p class="boss-kicker">JEFE FINAL · NIVEL 10</p>
            <h2 class="boss-name">{{ jefe?.name ?? 'Malgrath, Rey de las Cenizas' }}</h2>
            <p class="boss-phase">
              Fase {{ phase }} de {{ definicion.fases.length }} · {{ metodoJefe }}
            </p>
            <div class="boss-dialogue" aria-live="polite" aria-atomic="true">
              <span>{{ dialogoJefe }}</span>
            </div>
            <div
              class="boss-progress-track"
              role="progressbar"
              :aria-label="`Progreso real del cartón de ${jefe?.name ?? 'Malgrath'}`"
              :aria-valuenow="Math.round((jefe?.progress ?? 0) * 100)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div class="boss-progress-fill" :style="{ width: `${Math.round((jefe?.progress ?? 0) * 100)}%` }" />
            </div>
            <p class="boss-progress-label">
              {{ jefe?.progressMarked ?? 0 }} de {{ jefe?.progressTotal ?? 0 }} casillas ·
              {{ Math.round((jefe?.progress ?? 0) * 100) }}%
            </p>
          </div>
        </div>
      </div>

      <div class="oraculo-section">
        <div class="oraculo-panel">
          <p class="oraculo-title">ORACULO</p>
          <div class="oraculo-dashes" aria-live="polite">
            <span
              v-for="(slot, i) in oracleSlots"
              :key="i"
              class="oracle-slot"
              :class="{ filled: slot !== null, latest: i === 2 && slot !== null }"
            >
              {{ slot ?? '—' }}
            </span>
          </div>
          <p v-if="lastDrawn !== null" class="last-drawn">
            Última bola: <strong>{{ lastDrawn }}</strong>
          </p>
          <p v-else class="last-drawn muted">Esperando bolas…</p>
        </div>
        <p class="method">
          {{ methodLabel
          }}<template v-if="definicion.fases.length > 1">
            · Fase {{ phase }}/{{ definicion.fases.length }}</template
          ><template v-if="oscuridad"> · Noches de eclipse</template>
        </p>
      </div>

      <div
        v-if="previewItems.length > 0"
        class="method-preview-wrap"
        :class="{ 'method-preview-wrap--many': previewItems.length > 1 }"
      >
        <MethodPatternPreview
          v-for="(prev, i) in previewItems"
          :key="i"
          :size="prev.size"
          :win-modes="prev.winModes"
          :cell-px="previewItems.length > 3 || size >= 6 ? 12 : 16"
          :gap-px="3"
        />
      </div>

      <div class="control-buttons">
        <button
          v-if="status === 'idle' || isEnded"
          type="button"
          class="control-btn start-btn"
          @click="iniciarPartida"
        >
          {{ primaryActionIcon }}
        </button>
        <button v-else type="button" class="control-btn" @click="togglePause">
          {{ isPaused ? '▶' : '❚❚' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.level-play {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.level-play.is-final {
  background-position: center right;
}
.content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 56px 20px 36px;
}

.back-btn {
  position: absolute;
  top: 24px;
  left: 28px;
  z-index: 20;
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(180, 195, 200, 0.55);
  background: rgba(45, 55, 62, 0.72);
  color: #e8eef4;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.back-btn .back-ico {
  display: block;
  line-height: 1;
  font-size: 1.65rem;
  font-weight: 300;
  transform: translate(-1px, -1px);
}

.main-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  max-width: 1400px;
  gap: 28px;
  z-index: 5;
}
.main-container.has-jefe {
  align-items: center;
}
.left-section,
.right-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  width: 300px;
  flex-shrink: 0;
}
.center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 1 auto;
  gap: 12px;
  min-width: 0;
}

.bingo-panel-wrap,
.bingo-panels {
  display: flex;
  gap: 14px;
  align-items: stretch;
  justify-content: center;
  flex-wrap: nowrap;
}
.bingo-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 20px 28px 16px;
  min-width: 0;
  overflow: visible;
  background: linear-gradient(180deg, rgba(106, 112, 113, 0.78) 0%, rgba(85, 95, 97, 0.84) 100%);
  border: 2px solid rgba(175, 185, 188, 0.55);
  border-radius: 18px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 4px;
  color: #f0f3f4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
  text-align: center;
}

.grid-nube {
  position: relative;
  z-index: 2;
}

.cell-wrap {
  position: relative;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.espada-casilla {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-items: center;
  border-radius: 8px;
  pointer-events: none;
}
.espada-slash { background: linear-gradient(135deg, transparent 42%, rgba(255, 226, 177, .98) 47%, #9d2929 50%, transparent 55%); animation: tajo-espada .6s ease-out both; }
.espada-slash span { color: #fff0cf; font-size: 1.4rem; filter: drop-shadow(0 0 8px #ff512f); }
.espada-gone { background: rgba(12, 8, 12, .88); box-shadow: inset 0 0 18px rgba(192, 50, 40, .55); }
.espada-regrow { background: rgba(224, 180, 122, .35); animation: regenerar-casilla 4s ease-out both; }
@keyframes tajo-espada { from { opacity: 0; transform: scale(.5) rotate(-12deg); } 35% { opacity: 1; } to { opacity: 0; transform: scale(1.25) rotate(12deg); } }
@keyframes regenerar-casilla { from { opacity: .75; } to { opacity: 0; } }


.niebla-intentos {
  margin: 0;
  color: #d8c6a2;
  letter-spacing: 0.08em;
  font-size: 0.82rem;
  text-align: center;
}

.nube-oscuridad {
  position: absolute;
  top: -46%;
  left: -36%;
  width: 172%;
  height: 168%;
  z-index: 6;
  pointer-events: none;
  background: url('../assets/img/eclipse.jpg') center / cover no-repeat;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.55);
  transition: opacity 0.7s ease;
}

.niebla-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.niebla-total {
  position: absolute;
  inset: -14% -10%;
  overflow: hidden;
  border-radius: 36px;
  transform-origin: 50% 58%;
  box-shadow: 0 0 28px 12px rgba(206, 214, 222, 0.22);
  -webkit-mask-image:
    linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
  mask-composite: intersect;
}

.niebla-total {
  z-index: 8;
  pointer-events: auto;
  opacity: 1;
  transform: scale(1) translateY(0);
  transition:
    opacity 1.6s cubic-bezier(0.33, 0, 0.2, 1),
    transform 1.6s cubic-bezier(0.33, 0, 0.2, 1),
    filter 1.6s ease;
}

.niebla-total.sale {
  opacity: 0;
  transform: scale(1.14) translateY(-9%);
  filter: blur(12px);
}

.velo,
.grano,
.sombra,
.humo {
  position: absolute;
  display: block;
  pointer-events: none;
}

.velo {
  inset: 0;
  background: linear-gradient(180deg, rgba(186, 194, 202, 0.94), rgba(226, 230, 234, 0.96) 46%, rgba(168, 176, 184, 0.94));
}

.grano {
  inset: -18%;
  background: #d5dde3;
  opacity: 0.95;
}

.grano.g1 {
  filter: url('#df-niebla-ruido');
  animation: drift-a 18s ease-in-out infinite;
  animation-delay: -7s;
}

.grano.g2 {
  filter: url('#df-niebla-fina');
  opacity: 0.72;
  mix-blend-mode: multiply;
  animation: drift-b 23s ease-in-out infinite;
  animation-delay: -4s;
}

.sombra {
  border-radius: 50%;
  filter: blur(22px);
  opacity: 0.85;
}

.sombra.s1 {
  width: 78%;
  height: 42%;
  left: -16%;
  top: 4%;
  background: radial-gradient(ellipse at center, rgba(90, 100, 112, 0.45), transparent 72%);
  animation: drift-a 16s ease-in-out infinite;
  animation-delay: -3s;
}

.sombra.s2 {
  width: 72%;
  height: 40%;
  right: -18%;
  bottom: -4%;
  background: radial-gradient(ellipse at center, rgba(70, 80, 92, 0.4), transparent 72%);
  animation: drift-b 20s ease-in-out infinite;
  animation-delay: -9s;
}

.sombra.s3 {
  width: 84%;
  height: 36%;
  left: 6%;
  top: 34%;
  background: radial-gradient(ellipse at center, rgba(255, 252, 248, 0.28), transparent 70%);
  animation: drift-a 17s ease-in-out infinite reverse;
  animation-delay: -5s;
}

.humo {
  height: 22%;
  width: 130%;
  left: -16%;
  filter: blur(12px);
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.28) 30%, rgba(248, 250, 252, 0.5) 50%, rgba(255, 255, 255, 0.2) 72%, transparent 100%);
}

.humo.h1 {
  top: 12%;
  animation: cinta 15s ease-in-out infinite;
  animation-delay: -6s;
}

.humo.h2 {
  top: 48%;
  opacity: 0.75;
  animation: cinta 19s ease-in-out infinite reverse;
  animation-delay: -2s;
}

.humo.h3 {
  top: 70%;
  height: 20%;
  opacity: 0.6;
  animation: cinta 13s ease-in-out infinite;
  animation-delay: -8s;
}

.niebla-casilla {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  pointer-events: auto;
  background: #d3dbe2;
  box-shadow: inset 0 0 10px rgba(70, 82, 94, 0.35);
}

.niebla-casilla .grano {
  inset: -35%;
}

.niebla-casilla .grano.g1 {
  filter: url('#df-niebla-casilla');
  opacity: 0.96;
  mix-blend-mode: normal;
}

.niebla-casilla .grano.g2 {
  filter: url('#df-niebla-casilla');
  opacity: 0.45;
  mix-blend-mode: multiply;
}

.niebla-casilla .sombra {
  filter: blur(7px);
}

.niebla-casilla .sombra.s1 {
  width: 140%;
  height: 80%;
  left: -30%;
  top: -20%;
}

.niebla-casilla .humo.h1 {
  top: 18%;
  height: 46%;
  filter: blur(5px);
}

.niebla-casilla.roja {
  background: #3c1216;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.45);
  animation: corrupta 2s ease-in-out;
}

.niebla-casilla.roja .velo {
  background: #3c1216;
}

.niebla-casilla.roja .grano.g1,
.niebla-casilla.roja .grano.g2 {
  filter: url('#df-niebla-roja');
}

.niebla-casilla.roja .sombra.s1 {
  background: radial-gradient(ellipse at center, rgba(20, 0, 0, 0.65), transparent 70%);
}

.niebla-casilla.roja .humo.h1 {
  background: linear-gradient(90deg, transparent, rgba(150, 32, 38, 0.75), transparent);
}

.niebla-input {
  position: relative;
  z-index: 3;
  width: 70%;
  height: 46%;
  min-height: 28px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid rgba(236, 226, 204, 0.85);
  background: rgba(8, 10, 14, 0.82);
  color: #f6f1e6;
  text-align: center;
  font: inherit;
  font-size: clamp(0.95rem, 2.6vw, 1.25rem);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  animation: surgir 0.4s ease;
}

.niebla-input:focus {
  outline: 2px solid #f0d78c;
  background: rgba(8, 10, 14, 0.92);
}

.grid-6 .niebla-input {
  min-height: 0;
  height: 64%;
  font-size: clamp(0.68rem, 1.5vw, 1rem);
}

@keyframes drift-a {
  0%,
  100% { transform: translate3d(-6%, 2%, 0) scale(1.04); }
  50% { transform: translate3d(8%, -6%, 0) scale(1.1); }
}

@keyframes drift-b {
  0%,
  100% { transform: translate3d(7%, -3%, 0) scale(1.06); }
  50% { transform: translate3d(-8%, 6%, 0) scale(0.98); }
}

@keyframes cinta {
  0%,
  100% { transform: translate3d(-4%, 0, 0); }
  50% { transform: translate3d(6%, 8%, 0); }
}

@keyframes corrupta {
  0%,
  100% { filter: brightness(1); }
  45% { filter: brightness(1.18); }
}

@keyframes surgir {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .grano,
  .sombra,
  .humo,
  .niebla-casilla {
    animation: none;
  }
}

.bingo-grid {
  display: grid;
  justify-content: center;
  align-content: center;
}
.grid-3 {
  grid-template-columns: repeat(3, 72px);
  gap: 12px;
}
.grid-4 {
  grid-template-columns: repeat(4, 56px);
  gap: 8px;
}
.grid-5 {
  grid-template-columns: repeat(5, 52px);
  gap: 8px;
}
.grid-6 {
  grid-template-columns: repeat(6, 44px);
  gap: 6px;
}
.bingo-panels .grid-4 {
  grid-template-columns: repeat(4, 48px);
  gap: 6px;
}
.bingo-panels .grid-5 {
  grid-template-columns: repeat(5, 44px);
  gap: 6px;
}

.bingo-number {
  width: 72px;
  height: 72px;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(78, 90, 94, 0.92);
  border: 1px solid rgba(70, 80, 84, 0.9);
  border-radius: 10px;
  color: #e6eaeb;
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.15);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.grid-4 .bingo-number {
  width: 56px;
  height: 56px;
  font-size: 1.2rem;
}
.bingo-panels .grid-4 .bingo-number {
  width: 48px;
  height: 48px;
  font-size: 1.05rem;
}
.grid-5 .bingo-number {
  width: 52px;
  height: 52px;
  font-size: 1.05rem;
}
.bingo-panels .grid-5 .bingo-number {
  width: 44px;
  height: 44px;
  font-size: 0.95rem;
}
.grid-6 .bingo-number {
  width: 44px;
  height: 44px;
  font-size: 0.92rem;
}

.bingo-number.free {
  font-size: 0.72rem;
  font-weight: 600;
  color: #c8d4d8;
  text-transform: lowercase;
  cursor: default;
}
.bingo-number:hover:not(:disabled) {
  background: rgba(95, 110, 114, 0.95);
  border-color: rgba(140, 155, 160, 0.75);
}
.bingo-number:disabled {
  cursor: default;
}
.bingo-number.called {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 2px rgba(46, 200, 232, 0.55),
    0 0 12px rgba(46, 200, 232, 0.35);
}
.level-play.is-oscuridad .bingo-panel {
  box-shadow:
    0 0 0 1px rgba(90, 40, 120, 0.45),
    0 12px 40px rgba(20, 0, 30, 0.55);
}
.bingo-number.marked {
  background: #1a6cff !important;
  border-color: #4d9fff !important;
  color: #ffffff;
  transform: scale(0.97);
}
.bingo-number.winning {
  animation: win-pulse 0.9s ease-in-out infinite alternate;
  box-shadow:
    0 0 0 2px #f0e68c,
    0 0 18px rgba(255, 215, 80, 0.75) !important;
}
@keyframes win-pulse {
  from {
    filter: brightness(1);
  }
  to {
    filter: brightness(1.25);
  }
}

.bingo-btn {
  margin-top: 2px;
  min-width: 150px;
  padding: 7px 36px;
  border: 1.5px solid rgba(40, 110, 160, 0.85);
  border-radius: 999px;
  background: linear-gradient(180deg, #1a4568 0%, #0c2840 100%);
  color: #b8c9d6;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.bingo-btn:hover:not(:disabled) {
  border-color: rgba(70, 160, 210, 0.9);
  color: #e8f4fc;
}
.bingo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback {
  max-width: 360px;
  margin: 0;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.35;
  backdrop-filter: blur(6px);
}
.feedback.success {
  color: #d8ffe8;
  background: rgba(20, 90, 50, 0.72);
  border: 1px solid rgba(100, 220, 140, 0.55);
}
.feedback.error {
  color: #ffe0e0;
  background: rgba(100, 30, 30, 0.72);
  border: 1px solid rgba(220, 100, 100, 0.55);
}
.feedback.info {
  color: #e4eef4;
  background: rgba(40, 60, 80, 0.7);
  border: 1px solid rgba(140, 170, 190, 0.45);
}

.oraculo-section {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 5;
}
.oraculo-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  padding: 14px 40px 16px;
  background: linear-gradient(180deg, rgba(95, 105, 108, 0.55) 0%, rgba(70, 80, 84, 0.62) 100%);
  border: 1.5px solid rgba(170, 180, 185, 0.45);
  border-radius: 14px;
  backdrop-filter: blur(8px);
}
.oraculo-title {
  color: #e8eced;
  font-size: 0.95rem;
  letter-spacing: 4px;
}
.oraculo-dashes {
  display: flex;
  gap: 10px;
  align-items: center;
}
.oracle-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  background: rgba(30, 40, 45, 0.55);
  border: 1px solid rgba(80, 100, 110, 0.5);
  color: rgba(200, 210, 215, 0.45);
  font-size: 0.95rem;
  font-weight: 700;
}
.oracle-slot.filled {
  color: #e8f7fc;
  background: rgba(20, 70, 90, 0.65);
  border-color: rgba(46, 200, 232, 0.45);
}
.oracle-slot.latest {
  box-shadow: 0 0 10px rgba(46, 200, 232, 0.65);
  border-color: #2ec8e8;
  color: #ffffff;
}
.last-drawn {
  margin: 0;
  color: #e8eced;
  font-size: 0.8rem;
}
.last-drawn.muted {
  color: rgba(220, 225, 228, 0.55);
}
.last-drawn strong {
  color: #2ec8e8;
}
.method {
  margin: 0;
  padding: 8px 22px;
  color: #e4e8e9;
  font-size: 0.88rem;
  background: rgba(90, 100, 104, 0.72);
  border: 1.5px solid rgba(160, 170, 175, 0.5);
  border-radius: 999px;
}

.method-preview-wrap {
  position: absolute;
  bottom: 28px;
  left: 22px;
  z-index: 6;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  max-width: min(48vw, 420px);
}

.method-preview-wrap--many {
  max-width: min(56vw, 520px);
}
.control-buttons {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 12;
  display: flex;
}
.control-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  background: rgba(28, 38, 48, 0.82);
  border: 1.5px solid rgba(90, 110, 120, 0.5);
  border-radius: 50%;
  color: #e8eef4;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}
.start-btn {
  border-color: rgba(46, 200, 232, 0.55);
}

.phase-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  z-index: 6;
}
.phase-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(160, 180, 190, 0.4);
  background: rgba(20, 30, 36, 0.7);
  color: #d0d8de;
  cursor: pointer;
  font-size: 0.78rem;
}
.phase-tab-method {
  margin-top: 1px;
  color: #d9ae63;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.phase-tab.active {
  border-color: rgba(46, 200, 232, 0.8);
  color: #fff;
}
.phase-tab.cleared {
  color: #b6f0c2;
}
.phase-tab.locked {
  opacity: 0.5;
}
.bots-column {
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
}
.boss-placeholder img {
  max-width: 260px;
  max-height: 280px;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.55));
}
.jefe-rivales {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(10, 6, 10, 0.55);
  border: 1px solid rgba(180, 80, 80, 0.35);
}
.jefe-rival {
  display: grid;
  grid-template-columns: 1fr 72px 36px;
  align-items: center;
  gap: 6px;
}
.jefe-rival-name {
  color: #f0d8d8;
  font-size: 0.68rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jefe-rival-track {
  height: 9px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(16, 12, 16, 0.92), rgba(40, 28, 30, 0.9));
  overflow: hidden;
  border: 1px solid rgba(190, 143, 103, 0.45);
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.6);
}
.jefe-rival-fill {
  position: relative;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #285eac 0%, #479cc9 56%, #a6d9dc 100%);
  box-shadow: 0 0 8px rgba(90, 175, 220, 0.65);
  transition: width 0.7s cubic-bezier(0.22, 0.8, 0.25, 1);
}
.jefe-rival.won .jefe-rival-fill {
  background: linear-gradient(90deg, #c9a227 0%, #f0e68c 100%);
}
.jefe-rival-pct {
  color: #c8d4d8;
  font-size: 0.62rem;
  text-align: right;
}

/* La arena final ocupa el espacio disponible y mantiene el cartón legible. */
.level-play.level-10 .content {
  gap: clamp(8px, 1.4vh, 16px);
  padding: 64px clamp(18px, 3vw, 54px) 24px;
  justify-content: space-between;
}

.level-play.level-10 .phase-tabs {
  margin: 0;
}

.level-play.level-10 .phase-tab {
  min-width: 92px;
  padding: 8px 16px;
  border-color: rgba(214, 173, 101, 0.42);
  background: rgba(18, 13, 20, 0.82);
  color: #d8c6a2;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 0.85rem;
}

.level-play.level-10 .phase-tab.active,
.level-play.level-10 .phase-tab.cleared {
  border-color: #d9ae63;
  color: #ffe7b0;
  box-shadow: 0 0 14px rgba(199, 137, 65, 0.2);
}

.level-play.level-10 .main-container.has-jefe {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 1fr);
  align-items: stretch;
  flex: 1 1 auto;
  width: 100%;
  max-width: 1800px;
  min-height: 0;
  gap: clamp(18px, 3vw, 48px);
}

.level-play.level-10 .center-section {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  gap: clamp(8px, 1.5vh, 16px);
}

.level-play.level-10 .bingo-panel-wrap,
.level-play.level-10 .bingo-panels {
  width: 100%;
  min-height: 0;
  align-items: center;
  gap: clamp(8px, 1vw, 18px);
}

.level-play.level-10 .bingo-panel {
  flex: 1 1 0;
  padding: clamp(12px, 2vh, 24px) clamp(10px, 1.5vw, 22px);
  gap: clamp(8px, 1.4vh, 16px);
  border-color: rgba(196, 151, 86, 0.58);
  background: linear-gradient(160deg, rgba(36, 29, 38, 0.91), rgba(15, 15, 22, 0.9));
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 234, 190, 0.12);
}

.level-play.level-10 .title {
  color: #f3dba8;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: clamp(0.95rem, 1.6vw, 1.3rem);
  letter-spacing: 0.16em;
}

.level-play.level-10 .grid-5 {
  grid-template-columns: repeat(5, clamp(36px, min(5.7vh, 4.4vw), 60px));
  gap: clamp(4px, 0.7vh, 8px);
}

.level-play.level-10 .grid-5 .bingo-number {
  width: clamp(36px, min(5.7vh, 4.4vw), 60px);
  height: clamp(36px, min(5.7vh, 4.4vw), 60px);
  font-size: clamp(0.82rem, min(1.8vh, 1.4vw), 1.3rem);
}

.level-play.level-10 .grid-6 {
  grid-template-columns: repeat(6, clamp(32px, min(4.8vh, 3.8vw), 52px));
  gap: clamp(3px, 0.55vh, 7px);
}

.level-play.level-10 .grid-6 .bingo-number {
  width: clamp(32px, min(4.8vh, 3.8vw), 52px);
  height: clamp(32px, min(4.8vh, 3.8vw), 52px);
  font-size: clamp(0.72rem, min(1.5vh, 1.2vw), 1.05rem);
}

.level-play.level-10 .bingo-number.marked {
  background: linear-gradient(145deg, #8d542b, #5c2d23) !important;
  border-color: #e5b35f !important;
  color: #fff2d6;
}

.level-play.level-10 .bingo-number.called {
  box-shadow: 0 0 0 2px rgba(225, 185, 105, 0.82), 0 0 14px rgba(225, 154, 75, 0.48);
}

.level-play.level-10 .boss-arena {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  padding: clamp(14px, 2vw, 28px);
  overflow: hidden;
  border: 1px solid rgba(190, 118, 73, 0.52);
  border-radius: 22px;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(130, 51, 43, 0.28), transparent 55%),
    linear-gradient(165deg, rgba(22, 17, 25, 0.86), rgba(8, 9, 14, 0.92));
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(239, 194, 126, 0.12);
}

.level-play.level-10 .boss-placeholder {
  display: grid;
  place-items: center;
  min-height: 0;
  overflow: hidden;
}

.level-play.level-10 .boss-placeholder img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: min(62vh, 640px);
  object-fit: contain;
  filter: drop-shadow(0 14px 30px rgba(0, 0, 0, 0.72)) drop-shadow(0 0 22px rgba(155, 63, 42, 0.25));
}

.boss-info {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 16px 18px 14px;
  border: 1px solid rgba(190, 143, 103, 0.35);
  border-radius: 16px;
  background: rgba(5, 6, 10, 0.58);
}

.boss-kicker,
.boss-phase,
.boss-progress-label { margin: 0; text-align: center; }

.boss-kicker {
  color: #c7925b;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.2em;
}

.boss-name {
  margin: 0;
  color: #f3dba8;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  line-height: 1.16;
  text-align: center;
  text-shadow: 0 0 18px rgba(194, 113, 62, 0.32);
}

.boss-phase {
  color: #b9a995;
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.boss-dialogue {
  display: grid;
  min-height: 62px;
  place-items: center;
  padding: 10px 14px;
  border: 1px solid rgba(208, 177, 119, 0.68);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(218, 205, 177, 0.96), rgba(169, 151, 126, 0.96));
  color: #241a1b;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 0.88rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
}

.boss-progress-track {
  height: 15px;
  overflow: hidden;
  border: 1px solid rgba(218, 180, 117, 0.64);
  border-radius: 999px;
  background: rgba(8, 8, 12, 0.86);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.65);
}

.boss-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #682b2a, #b76639 58%, #ebc36c);
  box-shadow: 0 0 14px rgba(218, 141, 67, 0.62);
  transition: width 0.55s cubic-bezier(0.22, 0.8, 0.25, 1);
}

.boss-progress-label {
  color: #dccba9;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

.level-play.level-10 .oraculo-section { margin-top: 0; }
.level-play.level-10 .oraculo-panel {
  border-color: rgba(190, 143, 103, 0.45);
  background: linear-gradient(180deg, rgba(42, 34, 39, 0.84), rgba(15, 15, 21, 0.9));
}
.level-play.level-10 .oraculo-title { color: #e9ce9a; }
.level-play.level-10 .control-btn {
  border-color: rgba(214, 173, 101, 0.72);
  background: rgba(27, 18, 23, 0.9);
  color: #f2d79f;
}

@media (max-width: 1100px) {
  .main-container {
    gap: 16px;
  }
  .left-section,
  .right-section {
    width: 240px;
  }
  .grid-3 {
    grid-template-columns: repeat(3, 58px);
    gap: 8px;
  }
  .grid-3 .bingo-number {
    width: 58px;
    height: 58px;
    font-size: 1.25rem;
  }
  .grid-4 {
    grid-template-columns: repeat(4, 46px);
    gap: 6px;
  }
  .grid-4 .bingo-number {
    width: 46px;
    height: 46px;
    font-size: 1rem;
  }
  .grid-5 {
    grid-template-columns: repeat(5, 42px);
    gap: 6px;
  }
  .grid-5 .bingo-number {
    width: 42px;
    height: 42px;
    font-size: 0.9rem;
  }
  .bingo-panels .grid-5 {
    grid-template-columns: repeat(5, 36px);
    gap: 5px;
  }
  .bingo-panels .grid-5 .bingo-number {
    width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }
  .grid-6 {
    grid-template-columns: repeat(6, 36px);
    gap: 5px;
  }
  .grid-6 .bingo-number {
    width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }
}

/* ==========================================================================
   PANTALLAS ESTRECHAS: las columnas de bots (240px cada una, sin poder
   encogerse) exigían 512px y quedaban recortadas. Se ocultan para que el
   tablero quede centrado y completo.
   ========================================================================== */
@media (max-width: 820px) {
  .content {
    padding: 48px 12px 24px;
  }

  .left-section,
  .right-section {
    display: none;
  }

  .main-container {
    gap: 10px;
  }

  .bingo-panel {
    padding: 14px 16px 12px;
    gap: 10px;
  }

  .title {
    font-size: 1rem;
    letter-spacing: 2px;
  }

  .grid-3 {
    grid-template-columns: repeat(3, 52px);
    gap: 6px;
  }
  .grid-3 .bingo-number {
    width: 52px;
    height: 52px;
    font-size: 1.1rem;
  }
  .grid-4 {
    grid-template-columns: repeat(4, 42px);
    gap: 5px;
  }
  .grid-4 .bingo-number {
    width: 42px;
    height: 42px;
    font-size: 0.95rem;
  }
  .grid-5 {
    grid-template-columns: repeat(5, 38px);
    gap: 5px;
  }
  .grid-5 .bingo-number {
    width: 38px;
    height: 38px;
    font-size: 0.85rem;
  }
  .bingo-panels .grid-5 {
    grid-template-columns: repeat(5, 32px);
    gap: 4px;
  }
  .bingo-panels .grid-5 .bingo-number {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
  .grid-6 {
    grid-template-columns: repeat(6, 32px);
    gap: 4px;
  }
  .grid-6 .bingo-number {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .bingo-btn {
    min-width: 130px;
    padding: 6px 24px;
  }

  .oraculo-section {
    margin-top: 10px;
    gap: 8px;
  }

  .oraculo-panel {
    min-width: 0;
    padding: 10px 20px 12px;
  }

  .oraculo-title {
    font-size: 0.8rem;
    letter-spacing: 2px;
  }

  .oracle-slot {
    min-width: 30px;
    height: 24px;
    font-size: 0.85rem;
  }

  .method {
    padding: 6px 16px;
    font-size: 0.8rem;
  }

  .feedback {
    max-width: 100%;
    font-size: 0.8rem;
    padding: 6px 10px;
  }

  .phase-tabs {
    gap: 6px;
    margin-bottom: 6px;
  }

  .phase-tab {
    padding: 5px 9px;
    font-size: 0.72rem;
  }

  .method-preview-wrap {
    bottom: 12px;
    left: 12px;
    max-width: min(70vw, 320px);
  }
}

@media (max-width: 900px) and (orientation: portrait) {
  /* Algunos móviles no permiten Screen Orientation Lock desde el navegador.
     Giramos el lienzo para conservar la composición horizontal igualmente. */
  .level-play {
    position: fixed;
    top: 0;
    left: 100vw;
    width: 100dvh;
    height: 100vw;
    min-height: 0;
    transform: rotate(90deg);
    transform-origin: top left;
    overflow: hidden;
  }
  .level-play .content { height: 100%; min-height: 0; padding: 42px 10px 8px; gap: 5px; }
  .level-play .main-container { gap: 8px; }
  .level-play .center-section { height: auto; min-height: 0; }
  .level-play .bingo-panel { padding: 8px; gap: 6px; }
  .level-play .method-preview-wrap { bottom: 4px; left: 5px; transform: scale(.55); transform-origin: bottom left; }
  .level-play.level-10 .main-container.has-jefe { grid-template-columns: minmax(0, 1fr) minmax(210px, .78fr); gap: 8px; }
  .level-play.level-10 .boss-arena { min-height: 0; padding: 6px; grid-template-rows: minmax(0, 1fr) auto; }
  .level-play.level-10 .boss-placeholder img { max-height: 27vh; }
  .level-play.level-10 .boss-info { padding: 6px; gap: 3px; }
  .level-play.level-10 .boss-dialogue { min-height: 0; padding: 4px; font-size: .62rem; }
  .level-play.level-10 .boss-progress-track { height: 6px; }
  .level-play.level-10 .oraculo-panel { padding: 5px 9px; gap: 4px; }
}

@media (max-width: 900px) and (orientation: landscape) {
  .level-play .content { padding: 46px 12px 12px; }
  .method-preview-wrap { bottom: 10px; left: 10px; transform: scale(.72); transform-origin: bottom left; }
}

/* ==========================================================================
   PANTALLAS MUY BAJAS (móvil en horizontal): el juego no cabe a pantalla
   completa, así que se permite el desplazamiento en vez de recortar el
   tablero o el botón ¡BINGO!.
   ========================================================================== */
@media (max-height: 560px) {
  .level-play {
    overflow-y: auto;
  }

  .content {
    height: auto;
    min-height: 100%;
    justify-content: flex-start;
    padding: 44px 12px 24px;
  }

  .oraculo-section {
    margin-top: 8px;
  }

  .method-preview-wrap { transform: scale(.78); transform-origin: bottom left; }
}

@media (max-width: 1100px) {
  .level-play.level-10 .main-container.has-jefe {
    grid-template-columns: minmax(0, 1fr) minmax(270px, 0.76fr);
    gap: 16px;
  }
}

@media (max-width: 820px) {
  .level-play.level-10 {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .level-play.level-10 .content {
    height: auto;
    min-height: 100%;
    justify-content: flex-start;
    padding: 70px 14px 26px;
  }

  .level-play.level-10 .main-container.has-jefe {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    flex: 0 0 auto;
    gap: 12px;
  }

  .level-play.level-10 .boss-arena {
    order: -1;
    grid-template-columns: minmax(110px, 0.62fr) minmax(0, 1fr);
    grid-template-rows: 1fr;
    min-height: 210px;
    padding: 12px;
  }

  .level-play.level-10 .boss-placeholder img { max-height: 190px; }
  .level-play.level-10 .boss-info { padding: 10px; gap: 6px; }
  .level-play.level-10 .boss-dialogue { min-height: 52px; padding: 8px; font-size: 0.78rem; }
  .level-play.level-10 .center-section { height: auto; }
  .level-play.level-10 .bingo-panels { flex-wrap: wrap; }
  .level-play.level-10 .bingo-panel { flex: 1 1 230px; }
}

@media (max-width: 520px) {
  .level-play.level-10 .content { padding-right: 9px; padding-left: 9px; }
  .level-play.level-10 .boss-arena {
    grid-template-columns: minmax(82px, 0.42fr) minmax(0, 1fr);
    min-height: 192px;
    padding: 8px;
  }
  .level-play.level-10 .boss-placeholder img { max-height: 170px; }
  .level-play.level-10 .boss-kicker { font-size: 0.55rem; }
  .level-play.level-10 .boss-name { font-size: 1rem; }
  .level-play.level-10 .boss-phase,
  .level-play.level-10 .boss-progress-label { font-size: 0.65rem; }
  .level-play.level-10 .boss-dialogue { min-height: 48px; font-size: 0.7rem; }
  .level-play.level-10 .bingo-panel { flex-basis: 170px; padding: 10px 8px; }
  .level-play.level-10 .grid-5 {
    grid-template-columns: repeat(5, clamp(28px, 7.4vw, 36px));
    gap: 4px;
  }
  .level-play.level-10 .grid-5 .bingo-number {
    width: clamp(28px, 7.4vw, 36px);
    height: clamp(28px, 7.4vw, 36px);
    font-size: 0.76rem;
  }
  .level-play.level-10 .grid-6 {
    grid-template-columns: repeat(6, clamp(26px, 6.6vw, 34px));
    gap: 3px;
  }
  .level-play.level-10 .grid-6 .bingo-number {
    width: clamp(26px, 6.6vw, 34px);
    height: clamp(26px, 6.6vw, 34px);
    font-size: 0.68rem;
  }
  .level-play.level-10 .oraculo-panel { padding: 10px 14px; }
  .level-play.level-10 .oracle-slot { min-width: 28px; }
}

@media (max-width: 900px) and (orientation: landscape) {
  .level-play.level-10 { overflow: hidden; }
  .level-play.level-10 .content { height: 100%; min-height: 0; padding: 42px 10px 8px; gap: 5px; }
  .level-play.level-10 .main-container.has-jefe { grid-template-columns: minmax(0, 1fr) minmax(210px, .78fr); gap: 8px; }
  .level-play.level-10 .boss-arena { min-height: 0; padding: 6px; grid-template-rows: minmax(0, 1fr) auto; }
  .level-play.level-10 .boss-placeholder img { max-height: 27vh; }
  .level-play.level-10 .boss-info { padding: 6px; gap: 3px; }
  .level-play.level-10 .boss-dialogue { min-height: 0; padding: 4px; font-size: .62rem; }
  .level-play.level-10 .boss-progress-track { height: 6px; }
  .level-play.level-10 .oraculo-panel { padding: 5px 9px; gap: 4px; }
  .level-play.level-10 .method-preview-wrap { bottom: 4px; left: 5px; transform: scale(.55); }
}

@media (max-width: 900px) and (orientation: portrait) {
  .level-play.level-10 { overflow: hidden; }
  .level-play.level-10 .content { width: 100%; height: 100%; min-height: 0; padding: 42px 10px 8px; justify-content: space-between; gap: 5px; }
  .level-play.level-10 .main-container.has-jefe { display: grid; grid-template-columns: minmax(0, 1fr) minmax(210px, .78fr); flex: 1 1 auto; gap: 8px; }
  .level-play.level-10 .boss-arena { order: initial; min-height: 0; padding: 6px; grid-template-rows: minmax(0, 1fr) auto; grid-template-columns: minmax(0, 1fr); }
  .level-play.level-10 .boss-placeholder img { max-height: 27vh; }
  .level-play.level-10 .boss-info { padding: 6px; gap: 3px; }
  .level-play.level-10 .boss-dialogue { min-height: 0; padding: 4px; font-size: .62rem; }
  .level-play.level-10 .boss-progress-track { height: 6px; }
  .level-play.level-10 .oraculo-panel { padding: 5px 9px; gap: 4px; }
  .level-play.level-10 .center-section { height: 100%; }
  .level-play.level-10 .bingo-panels { flex-wrap: nowrap; }
}

/* Móvil apaisado: mantener la partida completa dentro del alto visible. */
@media (max-width: 900px) and (orientation: landscape) and (max-height: 560px) {
  .level-play,
  .level-play.level-10 {
    height: 100dvh;
    overflow: hidden;
  }

  .level-play .content,
  .level-play.level-10 .content {
    width: 100%;
    height: 100%;
    min-height: 0;
    justify-content: space-between;
    padding:
      max(34px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(4px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
    gap: 3px;
  }

  .level-play .back-btn {
    top: 5px;
    left: 8px;
    width: 30px;
    height: 30px;
  }

  .level-play .main-container {
    flex: 1 1 auto;
    min-height: 0;
    gap: 6px;
  }

  .level-play .center-section,
  .level-play.level-10 .center-section {
    height: auto;
    min-height: 0;
    gap: 4px;
  }

  .level-play .bingo-panel {
    gap: 4px;
    padding: 6px 8px;
    border-radius: 10px;
  }

  .level-play .title { font-size: 0.78rem; letter-spacing: 1px; }
  .level-play .feedback { padding: 3px 7px; font-size: 0.65rem; }
  .level-play .bingo-btn { min-height: 28px; padding: 4px 18px; font-size: 0.7rem; }
  .level-play .oraculo-section { margin-top: 0; gap: 3px; }
  .level-play .oraculo-panel { gap: 3px; padding: 4px 10px; }
  .level-play .method-preview-wrap { display: none; }

  .level-play.level-10 .main-container.has-jefe {
    grid-template-columns: minmax(0, 1.15fr) minmax(150px, 0.85fr);
    gap: 6px;
  }

  .level-play.level-10 .boss-arena {
    min-height: 0;
    padding: 5px;
  }

  .level-play.level-10 .bingo-panels { flex-wrap: nowrap; gap: 4px; }
  .level-play.level-10 .bingo-panel { padding: 5px 4px; gap: 4px; }
  .level-play.level-10 .phase-tab { min-width: 0; padding: 4px 8px; font-size: 0.65rem; }
}
</style>
