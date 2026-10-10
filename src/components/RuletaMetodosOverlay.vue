<template>
  <Teleport to="body">
    <Transition name="ruleta-fade">
      <div
        v-if="visible"
        class="ruleta-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Ruleta de método de victoria"
      >
        <div class="ruleta-panel">
          <p class="ruleta-kicker">Evento de campaña</p>
          <h2 class="ruleta-title">LA RULETA</h2>
          <p class="ruleta-sub">El método que caiga bajo la lanza será la victoria</p>

          <div class="wheel-scene" :class="{ spinning, landed }">
            <img class="puntero" :src="punteroSrc" alt="" draggable="false" />

            <div class="rotor" :style="{ transform: `rotate(${rotation}deg)` }">
              <div class="disc" :style="{ background: discFill }" />
              <div class="disc-lines" :style="{ background: discLines }" />
              <div
                v-for="(modo, i) in pool"
                :key="modo + i"
                class="slice-label"
                :class="{
                  winner: landed && i === indiceElegido,
                  wide: n <= 2,
                }"
                :style="{ transform: `rotate(${midAngle(i)}deg)` }"
              >
                <span>{{ nombreCorto(modo) }}</span>
              </div>
              <img class="aro" :src="aroSrc" alt="" draggable="false" />
            </div>

            <div class="hub" :class="{ glow: landed }">
              <MethodPatternPreview
                :size="size"
                :win-modes="[actual]"
                :cell-px="hubCell"
                :gap-px="3"
              />
            </div>
          </div>

          <p class="ruleta-name" :class="{ landed }">{{ nombreMetodo(actual) }}</p>
          <p class="ruleta-hint">
            {{
              landed
                ? 'Jugarás a ganar con este método'
                : spinning
                  ? 'La rueda elige…'
                  : 'Pulsa GIRAR'
            }}
          </p>

          <button
            v-if="!spinning && !landed"
            type="button"
            class="girar-btn"
            @click="girar"
          >
            GIRAR
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { nombreCorto, nombreMetodo } from '../domain/bingo/nombresMetodo'
import { RuletaMetodos } from '../domain/bingo/RuletaMetodos'
import type { WinMode } from '../domain/bingo/tipos'
import MethodPatternPreview from './MethodPatternPreview.vue'
import aroSrc from '@/assets/img/ruleta-aro.png'
import punteroSrc from '@/assets/img/ruleta-puntero.png'

const SLICE_A = ['#7a1810', '#2a0a12', '#8a2414', '#1c080c']
const SLICE_B = ['#4a1018', '#6e1414', '#3a0c10', '#5c1810']

const props = defineProps<{
  show: boolean
  metodos: WinMode[]
  size: number
}>()

const emit = defineEmits<{
  elegido: [mode: WinMode]
}>()

const visible = ref(false)
const spinning = ref(false)
const landed = ref(false)
const rotation = ref(0)
const indiceElegido = ref(0)
const actual = ref<WinMode>(props.metodos[0] ?? 'row')

let raf = 0
let autoTimer = 0
let doneTimer = 0

const pool = computed<WinMode[]>(() =>
  props.metodos.length ? props.metodos : (['row'] as WinMode[]),
)

const n = computed(() => Math.max(1, pool.value.length))
const angle = computed(() => 360 / n.value)
const hubCell = computed(() => (props.size >= 6 ? 11 : 14))

const discFill = computed(() => {
  const parts: string[] = []
  for (let i = 0; i < n.value; i++) {
    const a = ((i * angle.value) / 360) * 100
    const b = (((i + 1) * angle.value) / 360) * 100
    const color = (i % 2 === 0 ? SLICE_A : SLICE_B)[i % 4] ?? '#4a1010'
    parts.push(`${color} ${a}% ${b}%`)
  }
  return `conic-gradient(from -90deg, ${parts.join(', ')})`
})

const discLines = computed(() => {
  const gold = '#d4b056'
  const step = angle.value
  return `repeating-conic-gradient(from -90deg, ${gold} 0deg 1.1deg, transparent 1.1deg ${step}deg)`
})

function midAngle(i: number) {
  return i * angle.value + angle.value / 2
}

function easeOutQuint(t: number) {
  return 1 - (1 - t) ** 5
}

function sliceEnPuntero(rot: number) {
  const local = ((-rot % 360) + 360) % 360
  return Math.floor(local / angle.value) % n.value
}

function stopAnim() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  if (autoTimer) window.clearTimeout(autoTimer)
  autoTimer = 0
  if (doneTimer) window.clearTimeout(doneTimer)
  doneTimer = 0
}

function reset() {
  stopAnim()
  spinning.value = false
  landed.value = false
  rotation.value = 0
  indiceElegido.value = 0
  actual.value = pool.value[0] ?? 'row'
}

function girar() {
  if (spinning.value || landed.value) return
  spinning.value = true
  const { modo, indice } = new RuletaMetodos(pool.value).girarIndice()
  indiceElegido.value = indice
  const extra = 360 * (5 + Math.floor(Math.random() * 2))
  const destino = extra - midAngle(indice)
  const duracion = 4600
  const t0 = performance.now()

  function frame(now: number) {
    const t = Math.min(1, (now - t0) / duracion)
    rotation.value = destino * easeOutQuint(t)
    const idx = sliceEnPuntero(rotation.value)
    actual.value = pool.value[idx] ?? modo
    if (t < 1) {
      raf = requestAnimationFrame(frame)
      return
    }
    rotation.value = destino
    actual.value = modo
    spinning.value = false
    landed.value = true
    doneTimer = window.setTimeout(() => emit('elegido', modo), 1400)
  }

  raf = requestAnimationFrame(frame)
}

watch(
  () => props.show,
  (v) => {
    visible.value = v
    if (v) {
      reset()
      autoTimer = window.setTimeout(() => girar(), 900)
    } else {
      reset()
    }
  },
  { immediate: true },
)

onUnmounted(stopAnim)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

.ruleta-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 50% 40%, rgba(90, 20, 16, 0.45) 0%, transparent 55%),
    linear-gradient(165deg, rgba(48, 10, 10, 0.96) 0%, rgba(10, 2, 2, 0.98) 100%);
}

.ruleta-panel {
  width: min(94vw, 460px);
  padding: 22px 18px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border-radius: 18px;
  background: linear-gradient(165deg, #3a1010 0%, #160606 70%, #0c0303 100%);
  border: 2px solid #c43c3c;
  box-shadow:
    0 0 0 1px rgba(60, 8, 8, 0.9),
    0 18px 50px rgba(0, 0, 0, 0.65),
    0 0 40px rgba(180, 40, 30, 0.28);
}

.ruleta-kicker {
  margin: 0;
  color: #e8c56b;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.ruleta-title {
  margin: 0;
  font-family: MedievalSharp, Georgia, serif;
  color: #f3e0c8;
  font-size: 1.7rem;
  letter-spacing: 0.16em;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
}

.ruleta-sub {
  margin: 0 0 4px;
  color: rgba(255, 214, 200, 0.72);
  font-size: 0.8rem;
  text-align: center;
}

.wheel-scene {
  position: relative;
  width: min(78vw, 340px);
  aspect-ratio: 1;
  margin: 4px 0 2px;
}

.rotor {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.disc,
.disc-lines {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
}

.disc {
  box-shadow:
    inset 0 0 18px rgba(0, 0, 0, 0.55),
    0 0 0 2px rgba(212, 176, 86, 0.35);
}

.disc-lines {
  opacity: 0.7;
  pointer-events: none;
}

.aro {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 3;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.55));
}

.slice-label {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  padding-top: 26%;
  pointer-events: none;
  z-index: 2;
}

.slice-label span {
  color: #f6e4b8;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
}

.slice-label.wide span {
  font-size: 0.78rem;
  letter-spacing: 0.1em;
}

.slice-label.winner span {
  color: #ffe08a;
  font-size: 0.72rem;
  text-shadow: 0 0 10px rgba(255, 200, 80, 0.7);
}

.puntero {
  position: absolute;
  top: -6%;
  left: 50%;
  z-index: 6;
  width: 18%;
  transform: translateX(-50%);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7));
  pointer-events: none;
}

.hub {
  position: absolute;
  inset: 34%;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #3a1810 0%, #140606 75%);
  border: 3px solid #c9a04a;
  box-shadow:
    0 0 0 2px #2a0c0c,
    0 6px 16px rgba(0, 0, 0, 0.55);
}

.hub.glow {
  box-shadow:
    0 0 0 2px #2a0c0c,
    0 0 18px rgba(255, 190, 60, 0.55);
}

.ruleta-name {
  margin: 8px 0 0;
  min-height: 1.5em;
  color: #ffd0d0;
  font-family: MedievalSharp, Georgia, serif;
  font-size: 1.35rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ruleta-name.landed {
  color: #ffd060;
  text-shadow: 0 0 16px rgba(255, 180, 40, 0.55);
}

.ruleta-hint {
  margin: 0;
  color: rgba(255, 200, 200, 0.7);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-align: center;
}

.girar-btn {
  margin-top: 8px;
  min-width: 160px;
  padding: 10px 22px;
  border-radius: 12px;
  border: 1.5px solid #ffe08a;
  background: linear-gradient(180deg, #f0d070 0%, #c89428 100%);
  color: #2a1600;
  font-weight: 800;
  letter-spacing: 0.16em;
  cursor: pointer;
  box-shadow: 0 0 14px rgba(255, 200, 60, 0.35);
}

.girar-btn:hover {
  transform: translateY(-1px);
}

.wheel-scene.spinning .puntero {
  animation: puntero-tick 0.18s ease-in-out infinite alternate;
}

@keyframes puntero-tick {
  from {
    transform: translateX(-50%) rotate(-6deg);
  }
  to {
    transform: translateX(-50%) rotate(6deg);
  }
}

.ruleta-fade-enter-active,
.ruleta-fade-leave-active {
  transition: opacity 0.25s ease;
}
.ruleta-fade-enter-from,
.ruleta-fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .slice-label {
    padding-top: 20%;
  }
  .slice-label span {
    font-size: 0.55rem;
  }
  .ruleta-title {
    font-size: 1.35rem;
  }
}
</style>
