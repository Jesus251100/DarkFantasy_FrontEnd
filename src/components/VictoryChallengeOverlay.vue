<template>
  <Teleport to="body">
    <Transition name="victory-fade">
      <div
        v-if="visible"
        class="victory-overlay"
        :class="{ portrait: stage === 'portrait' }"
        role="dialog"
        aria-live="assertive"
        aria-label="Animación de victoria"
        @click="tryDismiss"
      >
        <!-- Fase animación (5s): garras + texto -->
        <template v-if="stage === 'anim'">
          <div class="claws-layer" aria-hidden="true">
            <img
              class="claw claw-tl"
              :class="{ show: handsVisible }"
              :src="clawHand"
              alt=""
              draggable="false"
            />
            <img
              class="claw claw-tr"
              :class="{ show: handsVisible }"
              :src="clawHand"
              alt=""
              draggable="false"
            />
            <img
              class="claw claw-bl"
              :class="{ show: handsVisible }"
              :src="clawHand"
              alt=""
              draggable="false"
            />
            <img
              class="claw claw-br"
              :class="{ show: handsVisible }"
              :src="clawHand"
              alt=""
              draggable="false"
            />
          </div>

          <div class="victory-stage">
            <p v-if="phase === 'checking'" class="victory-text checking">
              VERIFICANDO VICTORIA...
            </p>
            <p v-else-if="phase === 'done'" class="victory-text done text-in">
              {{ message }}
            </p>
            <p v-else class="victory-text" aria-hidden="true">&nbsp;</p>
          </div>
        </template>

        <template v-else-if="stage === 'qte'">
          <BossQteOverlay :phase-number="qtePhase" @done="onQteDone" />
        </template>

        <!-- Fase ficha: foto + nombre + cartón -->
        <div v-else class="portrait-sheet" @click.stop>
          <div class="portrait-frame">
            <img
              class="portrait-photo"
              :src="winnerImage || fallbackImage"
              :alt="winnerName"
              draggable="false"
            />
          </div>
          <p class="portrait-name">{{ winnerName }}</p>
          <p class="portrait-role" :class="playerWon ? 'win' : 'lose'">
            {{ playerWon ? '¡GANADOR!' : 'GANÓ EL RIVAL' }}
          </p>
          <p v-if="playerWon && rewardText" class="portrait-reward">{{ rewardText }}</p>

          <div
            v-if="winnerCard.length"
            class="mini-card"
            :style="miniGridStyle"
            role="img"
            :aria-label="`Cartón de ${winnerName}`"
          >
            <div
              v-for="(cell, i) in winnerCard"
              :key="i"
              class="mini-cell"
              :class="{
                free: cell.free,
                marked: cell.marked && !cell.free,
                win: winningSet.has(i),
              }"
            >
              {{ cell.free ? '★' : cell.number }}
            </div>
          </div>

          <div class="portrait-actions" @click.stop>
            <button type="button" class="victory-btn ghost" @click="goLevels">
              Regresar a niveles
            </button>
            <button
              v-if="playerWon && nextPhase"
              type="button"
              class="victory-btn gold"
              @click="goNext"
            >
              <span>Avanzar a la siguiente fase</span>
              <strong>Fase {{ nextPhase }}</strong>
            </button>
            <button
              v-else-if="playerWon && nextLevel"
              type="button"
              class="victory-btn gold"
              @click="goNext"
            >
              <span>Avanzar al siguiente nivel</span>
              <strong>Nivel {{ nextLevel }}</strong>
            </button>
            <button
              v-else-if="!playerWon"
              type="button"
              class="victory-btn gold"
              @click="close"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import clawHandUrl from '@/assets/img/claw-hand.png'
import victorySfx from '@/assets/audio/victory-bingo.mp3'
import BossQteOverlay from './BossQteOverlay.vue'
import type { BingoCell } from '../game/bingo'
import { PLAYER_PORTRAIT } from '../game/portraits'

const clawHand = `${clawHandUrl}?v=clean5`
const fallbackImage = PLAYER_PORTRAIT

/** Duración total de la animación de garras + sonido antes de la ficha. */
const ANIM_MS = 8000

const props = withDefaults(
  defineProps<{
    show: boolean
    message?: string
    winnerName?: string
    winnerImage?: string
    /** Cartón con el que se ganó. */
    winnerCard?: BingoCell[]
    cardSize?: number
    /** Índices del patrón ganador (resaltado). */
    winningIndices?: number[]
    /** true si ganó el jugador; false si ganó un bot. */
    playerWon?: boolean
    /** Texto de recompensa de campaña (monedas / desbloqueo). */
    rewardText?: string
    /** Número del siguiente nivel (null en el 10 o si aún hay fases). */
    nextLevel?: number | null
    /** Siguiente fase del mismo nivel (nivel 10). */
    nextPhase?: number | null
    /** QTE al ganar una fase del jefe final. */
    qteEnabled?: boolean
    qtePhase?: number
  }>(),
  {
    message: 'HAS SUPERADO EL DESAFIO',
    winnerName: 'Jugador',
    winnerImage: '',
    winnerCard: () => [],
    cardSize: 3,
    winningIndices: () => [],
    playerWon: true,
    rewardText: '',
    nextLevel: null,
    nextPhase: null,
    qteEnabled: false,
    qtePhase: 1,
  },
)

const emit = defineEmits<{
  'update:show': [value: boolean]
  done: []
  'go-levels': []
  'go-next': []
}>()

type Phase = 'checking' | 'slash' | 'done'
type Stage = 'anim' | 'qte' | 'portrait'

const phase = ref<Phase>('checking')
const stage = ref<Stage>('anim')
const visible = ref(false)
const handsVisible = ref(false)
const timers: number[] = []
let audio: HTMLAudioElement | null = null
let closed = false

const winningSet = computed(() => new Set(props.winningIndices ?? []))

const miniGridStyle = computed(() => {
  const n = Math.max(1, props.cardSize || 3)
  return {
    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
  }
})

function clearTimers() {
  while (timers.length) window.clearTimeout(timers.pop())
}

function stopAudio() {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
  audio.onended = null
  audio = null
}

function playVictoryAudio() {
  stopAudio()
  audio = new Audio(victorySfx)
  audio.volume = 0.9
  audio.preload = 'auto'
  void audio.play().catch(() => {
    /* autoplay bloqueado */
  })
}

function showPortrait() {
  if (closed) return
  stopAudio()
  handsVisible.value = false
  stage.value = 'portrait'
}

function startQteOrPortrait() {
  if (closed) return
  stopAudio()
  handsVisible.value = false
  if (props.qteEnabled && props.playerWon) {
    stage.value = 'qte'
    return
  }
  stage.value = 'portrait'
}

function onQteDone() {
  if (closed) return
  showPortrait()
}

/**
 * Secuencia:
 * 0–8s: animación garras + texto + sonido
 * 8s+: ficha del ganador (foto, nombre, cartón)
 */
function runSequence() {
  clearTimers()
  stopAudio()
  closed = false
  stage.value = 'anim'
  phase.value = 'checking'
  handsVisible.value = false
  visible.value = true

  playVictoryAudio()

  timers.push(
    window.setTimeout(() => {
      if (closed) return
      phase.value = 'slash'
      handsVisible.value = true
    }, 900),
  )

  timers.push(
    window.setTimeout(() => {
      if (closed) return
      phase.value = 'done'
    }, 1800),
  )

  timers.push(
    window.setTimeout(() => {
      startQteOrPortrait()
    }, ANIM_MS),
  )
}

function close() {
  if (closed) return
  closed = true
  clearTimers()
  stopAudio()
  visible.value = false
  handsVisible.value = false
  stage.value = 'anim'
  phase.value = 'checking'
  emit('update:show', false)
  emit('done')
}

function tryDismiss() {
  if (stage.value !== 'portrait') return
  if (props.playerWon) return
  close()
}

function goLevels() {
  close()
  emit('go-levels')
}

function goNext() {
  close()
  emit('go-next')
}

watch(
  () => props.show,
  (v) => {
    if (v) runSequence()
    else {
      clearTimers()
      stopAudio()
      visible.value = false
      handsVisible.value = false
      stage.value = 'anim'
      phase.value = 'checking'
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimers()
  stopAudio()
})
</script>

<style scoped>
.victory-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    165deg,
    rgba(74, 18, 18, 0.94) 0%,
    rgba(30, 6, 6, 0.96) 50%,
    rgba(10, 2, 2, 0.98) 100%
  );
  cursor: default;
  user-select: none;
  overflow: hidden;
}

.victory-overlay.portrait {
  cursor: default;
}

.claws-layer {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  overflow: hidden;
}

.victory-stage {
  position: relative;
  z-index: 5;
  width: min(86vw, 680px);
  min-height: 130px;
  padding: 36px 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #3a1010 0%, #1e0808 100%);
  border: 2px solid #c43c3c;
  box-shadow:
    0 0 0 1px rgba(80, 10, 10, 0.9),
    0 20px 60px rgba(0, 0, 0, 0.55),
    0 0 30px rgba(180, 30, 30, 0.3);
  pointer-events: none;
}

.victory-text {
  margin: 0;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #ffd0d0;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
  line-height: 1.3;
  font-size: clamp(1rem, 2.5vw, 1.65rem);
}

.victory-text.checking {
  letter-spacing: 0.18em;
  animation: pulse-check 1s ease-in-out infinite;
}

.victory-text.done.text-in {
  animation: pop-in 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}

/* —— Ficha del ganador —— */
.portrait-sheet {
  position: relative;
  z-index: 10;
  width: min(92vw, 420px);
  padding: 28px 24px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  background: linear-gradient(165deg, #4a1414 0%, #220808 60%, #140404 100%);
  border: 3px solid #c43c3c;
  box-shadow:
    0 0 0 1px rgba(60, 8, 8, 0.9),
    0 18px 50px rgba(0, 0, 0, 0.6),
    0 0 36px rgba(180, 30, 30, 0.35);
  animation: pop-in 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) both;
  cursor: default;
}

.portrait-frame {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(145deg, #e8a0a0, #7a2020);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}

.portrait-photo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #2a1010;
  border: 2px solid #1a0808;
  display: block;
}

.portrait-name {
  margin: 6px 0 0;
  text-align: center;
  color: #ffe8e8;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
}

.portrait-role {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.portrait-role.win {
  color: #ffd060;
  text-shadow: 0 0 12px rgba(255, 180, 40, 0.45);
}

.portrait-role.lose {
  color: #ff8a8a;
  text-shadow: 0 0 10px rgba(255, 60, 60, 0.35);
}

.portrait-reward {
  margin: 6px 0 0;
  color: #e8c56b;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-shadow: 0 0 10px rgba(200, 160, 40, 0.45);
}

.mini-card {
  margin-top: 8px;
  display: grid;
  gap: 4px;
  width: 100%;
  max-width: 260px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(12, 4, 4, 0.75);
  border: 1.5px solid rgba(196, 60, 60, 0.55);
}

.mini-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #2a3034;
  color: #e8eef0;
  font-size: clamp(0.55rem, 2.2vw, 0.72rem);
  font-weight: 700;
  border: 1px solid rgba(120, 140, 150, 0.35);
}

.mini-cell.free {
  color: #c8d4d8;
  font-size: 0.65rem;
  opacity: 0.85;
}

.mini-cell.marked {
  background: #5a2020;
  border-color: #c43c3c;
  color: #ffd0d0;
}

.mini-cell.win {
  background: #8b6a10;
  border-color: #ffd060;
  color: #fff6d0;
  box-shadow: 0 0 8px rgba(255, 200, 60, 0.4);
}

.portrait-actions {
  width: 100%;
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.victory-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1 1 140px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.victory-btn strong {
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.victory-btn.ghost {
  color: #f0d8d8;
  background: rgba(40, 10, 10, 0.55);
  border: 1.5px solid rgba(200, 90, 90, 0.55);
}

.victory-btn.gold {
  color: #2a1600;
  background: linear-gradient(180deg, #f0d070 0%, #c89428 100%);
  border: 1.5px solid #ffe08a;
  box-shadow: 0 0 14px rgba(255, 200, 60, 0.35);
}

.victory-btn:hover {
  transform: translateY(-1px);
}

.victory-btn:active {
  transform: translateY(0);
}

.claw {
  position: absolute;
  width: min(34vw, 320px);
  height: auto;
  opacity: 0;
  filter:
    drop-shadow(0 0 6px rgba(200, 100, 255, 0.75))
    drop-shadow(0 0 18px rgba(120, 30, 220, 0.65))
    drop-shadow(0 0 36px rgba(80, 0, 160, 0.4))
    contrast(1.12)
    brightness(0.95);
  will-change: transform, opacity;
}

.claw-tl {
  top: 0;
  left: 0;
  transform: translate(-40%, -40%) scaleY(-1) rotate(12deg);
}

.claw-tr {
  top: 0;
  right: 0;
  transform: translate(40%, -40%) scaleX(-1) scaleY(-1) rotate(12deg);
}

.claw-bl {
  bottom: 0;
  left: 0;
  transform: translate(-40%, 40%) rotate(18deg);
}

.claw-br {
  bottom: 0;
  right: 0;
  transform: translate(40%, 40%) scaleX(-1) rotate(18deg);
}

.claw-tl.show {
  animation:
    enter-tl 0.7s cubic-bezier(0.2, 0.85, 0.25, 1) 0s both,
    menace-pulse 2.2s ease-in-out 0.7s infinite;
}
.claw-tr.show {
  animation:
    enter-tr 0.7s cubic-bezier(0.2, 0.85, 0.25, 1) 0.25s both,
    menace-pulse 2.2s ease-in-out 0.95s infinite;
}
.claw-bl.show {
  animation:
    enter-bl 0.7s cubic-bezier(0.2, 0.85, 0.25, 1) 0.5s both,
    menace-pulse 2.2s ease-in-out 1.2s infinite;
}
.claw-br.show {
  animation:
    enter-br 0.7s cubic-bezier(0.2, 0.85, 0.25, 1) 0.75s both,
    menace-pulse 2.2s ease-in-out 1.45s infinite;
}

@keyframes menace-pulse {
  0%,
  100% {
    filter:
      drop-shadow(0 0 6px rgba(200, 100, 255, 0.75))
      drop-shadow(0 0 18px rgba(120, 30, 220, 0.55))
      drop-shadow(0 0 36px rgba(80, 0, 160, 0.35))
      contrast(1.12)
      brightness(0.95);
  }
  50% {
    filter:
      drop-shadow(0 0 10px rgba(230, 140, 255, 0.95))
      drop-shadow(0 0 28px rgba(160, 40, 255, 0.8))
      drop-shadow(0 0 50px rgba(100, 0, 180, 0.55))
      contrast(1.18)
      brightness(1.05);
  }
}

@keyframes enter-tl {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleY(-1) rotate(25deg) scale(0.75, 0.9);
  }
  100% {
    opacity: 1;
    transform: translate(0%, 0%) scaleY(-1) rotate(8deg) scale(1.05, 1.28);
  }
}

@keyframes enter-tr {
  0% {
    opacity: 0;
    transform: translate(50%, -50%) scaleX(-1) scaleY(-1) rotate(25deg) scale(0.75, 0.9);
  }
  100% {
    opacity: 1;
    transform: translate(0%, 0%) scaleX(-1) scaleY(-1) rotate(8deg) scale(1.05, 1.28);
  }
}

@keyframes enter-bl {
  0% {
    opacity: 0;
    transform: translate(-55%, 55%) rotate(30deg) scale(0.75, 0.9);
  }
  100% {
    opacity: 1;
    transform: translate(0%, 0%) rotate(8deg) scale(1.05, 1.28);
  }
}

@keyframes enter-br {
  0% {
    opacity: 0;
    transform: translate(55%, 55%) scaleX(-1) rotate(30deg) scale(0.75, 0.9);
  }
  100% {
    opacity: 1;
    transform: translate(0%, 0%) scaleX(-1) rotate(18deg) scale(1.05, 1.28);
  }
}

@keyframes pulse-check {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.victory-fade-enter-active,
.victory-fade-leave-active {
  transition: opacity 0.28s ease;
}
.victory-fade-enter-from,
.victory-fade-leave-to {
  opacity: 0;
}

@media (max-width: 700px) {
  .claw {
    width: min(40vw, 200px);
  }
  .victory-stage {
    min-height: 100px;
    padding: 24px 18px;
  }
  .portrait-frame {
    width: 112px;
    height: 112px;
  }
}
</style>
