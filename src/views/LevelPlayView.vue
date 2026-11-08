<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BossCard from '../components/BossCard.vue'
import BossPhaseIntro from '../components/BossPhaseIntro.vue'
import MethodPatternPreview from '../components/MethodPatternPreview.vue'
import AchievementUnlockOverlay from '../components/AchievementUnlockOverlay.vue'
import VictoryChallengeOverlay from '../components/VictoryChallengeOverlay.vue'
import RuletaMetodosOverlay from '../components/RuletaMetodosOverlay.vue'
import PauseOverlay from '../components/PauseOverlay.vue'
import { nombreMetodo } from '../domain/bingo/nombresMetodo'
import { usePartida } from '../composables/usePartida'
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

watch(showVictoryOverlay, (abierto, antes) => {
  if (antes && !abierto && logroActual.value) logroVisible.value = true
})

const multiCard = computed(() => cards.value.length > 1)
const gridClass = computed(() => `grid-${size.value}`)
const jefe = computed(() => bots.value.find((bot) => bot.id === 'dragon') ?? null)
const metodoJefe = computed(() => methodLabel.value.replace(/^Método:\s*/i, ''))
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
  if (status.value === 'idle' || modes.length !== 1 || nivelDeUnMetodo) return []
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
              <div class="grid-nube">
                <div class="bingo-grid" :class="gridClass" role="grid">
                  <button
                    v-for="(cell, cellIndex) in board"
                    :key="cellIndex"
                    type="button"
                    class="bingo-number"
                    :class="cellClass(cell, cellIndex, cardIndex)"
                    :disabled="isEnded || status === 'idle' || cell.free"
                    :aria-pressed="cell.marked"
                    @click="multiCard ? toggleCell(cardIndex, cellIndex) : toggleCell(cellIndex)"
                  >
                    {{ cell.free ? 'free' : cell.number }}
                  </button>
                </div>
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
            <p class="boss-phase">Fase {{ phase }} de {{ definicion.fases.length }}</p>
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
          @click="startMatch"
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
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(160, 180, 190, 0.4);
  background: rgba(20, 30, 36, 0.7);
  color: #d0d8de;
  cursor: pointer;
  font-size: 0.78rem;
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
  grid-template-columns: minmax(0, 1.18fr) minmax(300px, 0.82fr);
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
  max-height: min(54vh, 560px);
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
.level-play.level-10 .method-preview-wrap { display: none; }
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

  .method-preview-wrap {
    display: none;
  }
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
</style>
