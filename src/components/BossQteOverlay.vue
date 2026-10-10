<template>
  <div class="qte" :class="{ shake: flash === 'miss', slash: flash === 'hit' }">
    <img class="qte-boss" :src="jefeGif" alt="" draggable="false" />
    <div class="qte-veil" />

    <p class="qte-phase">Fase {{ phaseNumber }} · ejecuta al jefe</p>
    <p class="qte-hint">Pulsa la tecla antes de que se acabe el tiempo</p>

    <div class="qte-ring" :style="{ '--t': timerRatio }">
      <button
        type="button"
        class="qte-key"
        :class="flash"
        @click="tryKey(current?.code ?? '')"
      >
        {{ currentLabel }}
      </button>
    </div>

    <div class="qte-dots" aria-hidden="true">
      <span
        v-for="(p, i) in prompts"
        :key="i"
        class="dot"
        :class="{
          done: results[i] === 'hit',
          fail: results[i] === 'miss',
          now: i === index,
        }"
      />
    </div>

    <p v-if="summary" class="qte-summary">{{ summary }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import jefeGif from '@/assets/img/jefeFinal.gif'

const KEYS = ['KeyF', 'KeyJ', 'Space', 'KeyD', 'KeyK'] as const
const LABELS: Record<string, string> = {
  KeyF: 'F',
  KeyJ: 'J',
  Space: 'ESPACIO',
  KeyD: 'D',
  KeyK: 'K',
}

const props = withDefaults(
  defineProps<{
    phaseNumber?: number
  }>(),
  { phaseNumber: 1 },
)

const emit = defineEmits<{
  done: [ok: boolean]
}>()

type Prompt = { code: string; windowMs: number }
type Mark = 'hit' | 'miss' | null

const prompts = ref<Prompt[]>([])
const results = ref<Mark[]>([])
const index = ref(0)
const timerRatio = ref(1)
const flash = ref<'' | 'hit' | 'miss'>('')
const summary = ref('')
const current = computed(() => prompts.value[index.value] ?? null)
const currentLabel = computed(() => LABELS[current.value?.code ?? ''] ?? '—')

let started = 0
let windowMs = 1200
let raf = 0
let closed = false
let stepTimer = 0

function buildPrompts(phase: number): Prompt[] {
  const count = phase <= 1 ? 3 : phase === 2 ? 4 : 5
  const ms = phase <= 1 ? 1500 : phase === 2 ? 1100 : 850
  return Array.from({ length: count }, (_, i) => ({
    code: KEYS[i % KEYS.length],
    windowMs: ms,
  }))
}

function startPrompt(i: number) {
  const p = prompts.value[i]
  if (!p) {
    finish()
    return
  }
  index.value = i
  windowMs = p.windowMs
  started = performance.now()
  timerRatio.value = 1
  flash.value = ''
  tick()
}

function tick() {
  if (closed) return
  const elapsed = performance.now() - started
  timerRatio.value = Math.max(0, 1 - elapsed / windowMs)
  if (elapsed >= windowMs) {
    resolve('miss')
    return
  }
  raf = requestAnimationFrame(tick)
}

function resolve(mark: 'hit' | 'miss') {
  if (closed || results.value[index.value]) return
  cancelAnimationFrame(raf)
  results.value[index.value] = mark
  flash.value = mark
  const next = index.value + 1
  stepTimer = window.setTimeout(() => {
    if (closed) return
    if (next >= prompts.value.length) finish()
    else startPrompt(next)
  }, mark === 'hit' ? 280 : 420)
}

function tryKey(code: string) {
  if (closed || !current.value || results.value[index.value]) return
  if (code === current.value.code) resolve('hit')
  else resolve('miss')
}

function onKey(e: KeyboardEvent) {
  if (e.repeat) return
  if (e.code === 'Space') e.preventDefault()
  tryKey(e.code)
}

function finish() {
  if (closed) return
  closed = true
  cancelAnimationFrame(raf)
  window.clearTimeout(stepTimer)
  const hits = results.value.filter((m) => m === 'hit').length
  const total = prompts.value.length
  const ok = hits >= Math.ceil(total * 0.6)
  summary.value = ok
    ? `¡Golpe limpio! ${hits}/${total}`
    : `El jefe resistió… ${hits}/${total}`
  window.setTimeout(() => emit('done', ok), 900)
}

onMounted(() => {
  prompts.value = buildPrompts(props.phaseNumber)
  results.value = prompts.value.map(() => null)
  window.addEventListener('keydown', onKey)
  startPrompt(0)
})

onUnmounted(() => {
  closed = true
  cancelAnimationFrame(raf)
  window.clearTimeout(stepTimer)
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.qte {
  position: relative;
  z-index: 12;
  width: min(96vw, 720px);
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px 28px;
}

.qte-boss {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.55;
  pointer-events: none;
  filter: saturate(1.1) contrast(1.05);
}

.qte-veil {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, transparent 20%, rgba(8, 0, 0, 0.72) 75%);
  pointer-events: none;
}

.qte-phase,
.qte-hint,
.qte-summary {
  position: relative;
  z-index: 1;
  margin: 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 10px #000;
}

.qte-phase {
  color: #ffd060;
  font-weight: 800;
  font-size: 0.95rem;
}

.qte-hint {
  color: #f0d0d0;
  font-size: 0.78rem;
}

.qte-summary {
  color: #ffe8a0;
  font-weight: 800;
  min-height: 1.2em;
}

.qte-ring {
  position: relative;
  z-index: 1;
  width: 168px;
  height: 168px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#ffd060 calc(var(--t) * 360deg), #3a1010 0);
  box-shadow: 0 0 28px rgba(255, 180, 40, 0.35);
}

.qte-key {
  width: 142px;
  height: 142px;
  border-radius: 50%;
  border: 2px solid #ffe08a;
  background: radial-gradient(circle at 40% 30%, #5a2020, #1a0606 70%);
  color: #fff6d0;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.qte-key.hit {
  border-color: #7dff9a;
  color: #d8ffe0;
  box-shadow: 0 0 22px rgba(80, 255, 140, 0.55);
}

.qte-key.miss {
  border-color: #ff6b6b;
  color: #ffd0d0;
  box-shadow: 0 0 22px rgba(255, 60, 60, 0.5);
}

.qte-dots {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4a2020;
  border: 1px solid #8a4040;
}

.dot.now {
  background: #ffd060;
  border-color: #ffe08a;
}

.dot.done {
  background: #4caf70;
  border-color: #8dffb0;
}

.dot.fail {
  background: #c43c3c;
  border-color: #ff8a8a;
}

.qte.shake {
  animation: qte-shake 0.28s linear;
}

.qte.slash::after {
  content: '';
  position: absolute;
  inset: 18% 8%;
  background: linear-gradient(115deg, transparent 42%, rgba(255, 230, 160, 0.85) 50%, transparent 58%);
  pointer-events: none;
  animation: qte-slash 0.28s ease-out;
}

@keyframes qte-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-7px);
  }
  75% {
    transform: translateX(7px);
  }
}

@keyframes qte-slash {
  from {
    opacity: 0.9;
    transform: scaleX(0.2);
  }
  to {
    opacity: 0;
    transform: scaleX(1.2);
  }
}
</style>
