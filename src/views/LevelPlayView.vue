<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BossCard from '../components/BossCard.vue'
import MethodPatternPreview from '../components/MethodPatternPreview.vue'
import VictoryChallengeOverlay from '../components/VictoryChallengeOverlay.vue'
import RuletaMetodosOverlay from '../components/RuletaMetodosOverlay.vue'
import PauseOverlay from '../components/PauseOverlay.vue'
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
} = play

const fondo = computed(() =>
  definicion.fondo === 'final' ? fondo10 : (FONDOS[props.levelNumber] ?? level1),
)

const multiCard = computed(() => cards.value.length > 1)
const gridClass = computed(() => `grid-${size.value}`)

const previewItems = computed(() => {
  const modes = winModes.value
  const s = size.value
  if (modes.length <= 1) return [{ size: s, winModes: modes }]
  return modes.map((m) => ({ size: s, winModes: [m] as WinMode[] }))
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

function cellVeiled(cell: BingoCell) {
  if (!oscuridad.value || !isPlaying.value) return false
  if (cell.free || cell.marked) return false
  return !isCellCalled(cell.number)
}

function cellClass(cell: BingoCell, cellIndex: number, cardIndex: number) {
  return {
    free: cell.free,
    marked: cell.marked && !cell.free,
    called: isCellCalled(cell.number) && !cell.marked && !cell.free,
    veiled: cellVeiled(cell),
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
      :qte-enabled="definicion.muestraJefe && playerWon"
      :qte-phase="phase"
      @go-levels="onVictoryLevels"
      @go-next="onVictoryNext"
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
          :disabled="status === 'playing' || status === 'paused'"
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
                  {{ cell.free ? 'free' : cellVeiled(cell) ? '·' : cell.number }}
                </button>
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

        <div v-else class="bots-column">
          <div class="boss-placeholder">
            <img :src="jefeGif + '?v=orig1'" alt="Jefe Final" decoding="async" draggable="false" />
          </div>
          <div class="jefe-rivales" aria-label="Avance de los rivales">
            <div v-for="bot in bots" :key="bot.id" class="jefe-rival" :class="{ won: bot.won }">
              <span class="jefe-rival-name">{{ bot.name }}</span>
              <div class="jefe-rival-track">
                <div class="jefe-rival-fill" :style="{ width: `${Math.round(bot.progress * 100)}%` }" />
              </div>
              <span class="jefe-rival-pct">{{ Math.round(bot.progress * 100) }}%</span>
            </div>
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
          ><template v-if="oscuridad"> · Oscuridad</template>
        </p>
      </div>

      <div
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
.bingo-number.veiled {
  color: transparent;
  background: radial-gradient(circle at 40% 30%, rgba(40, 20, 50, 0.95) 0%, rgba(8, 4, 12, 0.98) 100%);
  border-color: rgba(80, 40, 90, 0.55);
  text-shadow: none;
}
.bingo-number.veiled::after {
  content: '';
  width: 38%;
  height: 38%;
  border-radius: 50%;
  background: rgba(120, 70, 150, 0.35);
  box-shadow: 0 0 10px rgba(90, 40, 130, 0.4);
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
  height: 6px;
  border-radius: 999px;
  background: rgba(20, 12, 16, 0.7);
  overflow: hidden;
}
.jefe-rival-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1a6cff 0%, #4dc4ff 100%);
}
.jefe-rival.won .jefe-rival-fill {
  background: linear-gradient(90deg, #c9a227 0%, #f0e68c 100%);
}
.jefe-rival-pct {
  color: #c8d4d8;
  font-size: 0.62rem;
  text-align: right;
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
</style>
