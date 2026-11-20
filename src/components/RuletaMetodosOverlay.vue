<template>
  <Teleport to="body">
    <Transition name="ruleta-fade">
      <div
        v-if="visible"
        class="ruleta-overlay"
        :class="{ 'con-fondo-nivel': fondo }"
        role="dialog"
        aria-modal="true"
        aria-label="Ruleta de método de victoria"
      >
        <section class="ruleta-panel" :style="estiloFondo">
          <p class="ruleta-kicker">{{ kicker }}</p>
          <h2 class="ruleta-title">LA RULETA</h2>
          <p class="ruleta-sub">Los sellos pasan ante la lanza hasta revelar la victoria</p>

          <div ref="viewport" class="ticker-viewport" :class="{ spinning, landed }">
            <div class="marcador" aria-hidden="true"><span>◆</span></div>
            <div class="ticker-edge ticker-edge-left" aria-hidden="true" />
            <div class="ticker-edge ticker-edge-right" aria-hidden="true" />
            <div class="ticker-track" :style="{ transform: `translate3d(${-offset}px, 0, 0)` }">
              <article
                v-for="(modo, index) in sequence"
                :key="`${modo}-${index}`"
                :ref="(element) => guardarFicha(element, index)"
                class="ticker-card"
                :class="{ 'ticker-card-winner': landed && index === targetIndex }"
              >
                <span class="card-index">SELLO {{ String(index + 1).padStart(2, '0') }}</span>
                <MethodPatternPreview :size="size" :win-modes="[modo]" :cell-px="8" :gap-px="2" />
                <strong>{{ nombreCorto(modo) }}</strong>
              </article>
            </div>
          </div>

          <p class="ruleta-name" :class="{ landed }">{{ nombreMetodo(actual) }}</p>
          <p class="ruleta-hint">
            {{ landed ? 'Método elegido' : spinning ? 'Eligiendo método…' : 'Preparando…' }}
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { nombreCorto, nombreMetodo } from '../domain/bingo/nombresMetodo'
import { RuletaMetodos } from '../domain/bingo/RuletaMetodos'
import type { WinMode } from '../domain/bingo/tipos'
import MethodPatternPreview from './MethodPatternPreview.vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    metodos: WinMode[]
    size: number
    /** Si se indica, la ruleta cae siempre en este método (lo decide el servidor). */
    resultado?: WinMode | null
    kicker?: string
    fondo?: string | null
  }>(),
  { kicker: 'Evento de campaña' },
)

const emit = defineEmits<{ elegido: [mode: WinMode] }>()
const visible = ref(false)
const spinning = ref(false)
const landed = ref(false)
const offset = ref(0)
const targetIndex = ref(0)
const actual = ref<WinMode>(props.metodos[0] ?? 'row')
const viewport = ref<HTMLElement | null>(null)
const fichas: HTMLElement[] = []

const pool = computed<WinMode[]>(() => props.metodos.length ? props.metodos : ['row'])
const estiloFondo = computed(() => props.fondo ? {
  backgroundImage: `linear-gradient(165deg, rgba(35, 10, 10, .88), rgba(9, 3, 3, .95)), url("${props.fondo}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
} : undefined)

let raf = 0
let autoTimer = 0
let doneTimer = 0
const sequence = ref<WinMode[]>([])

function guardarFicha(element: unknown, index: number) {
  if (element instanceof HTMLElement) fichas[index] = element
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
  offset.value = 0
  targetIndex.value = 0
  actual.value = pool.value[0] ?? 'row'
  sequence.value = []
  fichas.length = 0
}

function construirSecuencia(modoElegido: WinMode) {
  const total = 64
  const final = total - 2
  sequence.value = Array.from({ length: total }, () => pool.value[Math.floor(Math.random() * pool.value.length)] ?? 'row')
  sequence.value[final] = modoElegido
  targetIndex.value = final
  return sequence
}

async function girar() {
  if (spinning.value || landed.value || !viewport.value) return
  const forzado = props.resultado && pool.value.includes(props.resultado) ? props.resultado : null
  const modo = forzado ?? new RuletaMetodos(pool.value).girarIndice().modo

  construirSecuencia(modo)
  actual.value = sequence.value[0] ?? modo
  spinning.value = true
  await nextTick()
  if (!visible.value) return

  const fichasPreparadas = fichas[targetIndex.value]
  const contenedor = viewport.value
  if (!fichasPreparadas || !contenedor) {
    actual.value = modo
    landed.value = true
    spinning.value = false
    doneTimer = window.setTimeout(() => emit('elegido', modo), 900)
    return
  }

  const destino = fichasPreparadas.offsetLeft + fichasPreparadas.offsetWidth / 2 - contenedor.clientWidth / 2
  const duracion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1400 : 6200
  const inicio = performance.now()

  function frame(ahora: number) {
    const progreso = Math.min(1, (ahora - inicio) / duracion)
    const ease = 1 - (1 - progreso) ** 5
    offset.value = destino * ease
    const centro = offset.value + (contenedor.clientWidth / 2)
    const paso = fichas[1] && fichas[0]
      ? fichas[1].offsetLeft - fichas[0].offsetLeft
      : (fichas[0]?.offsetWidth ?? 120) + 12
    const indiceActual = Math.max(0, Math.min(sequence.value.length - 1, Math.round((centro - (fichas[0]?.offsetWidth ?? 120) / 2) / paso)))
    actual.value = sequence.value[indiceActual] ?? modo

    if (progreso < 1) {
      raf = requestAnimationFrame(frame)
      return
    }
    offset.value = destino
    actual.value = modo
    spinning.value = false
    landed.value = true
    doneTimer = window.setTimeout(() => emit('elegido', modo), 1200)
  }

  raf = requestAnimationFrame(frame)
}

watch(() => props.show, (show) => {
  visible.value = show
  reset()
  if (show) autoTimer = window.setTimeout(girar, 700)
}, { immediate: true })

onUnmounted(stopAnim)
</script>

<style scoped>
.ruleta-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background:
    radial-gradient(ellipse at 50% 42%, rgba(92, 23, 17, .42), transparent 58%),
    linear-gradient(165deg, rgba(35, 8, 9, .96), rgba(7, 2, 4, .985));
}

.ruleta-panel {
  width: min(94vw, 900px);
  padding: clamp(22px, 4vw, 42px) clamp(16px, 4vw, 38px) 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(207, 165, 81, .78);
  border-radius: 20px;
  background: linear-gradient(155deg, #351111, #17080b 62%, #0b0508);
  box-shadow: 0 22px 70px #000c, 0 0 42px rgba(170, 38, 28, .2), inset 0 0 0 4px rgba(212, 176, 86, .07);
}

.ruleta-kicker { margin: 0; color: #dfbc69; font-size: .72rem; font-weight: 800; letter-spacing: .24em; text-transform: uppercase; }
.ruleta-title { margin: 0; color: #f3e0c8; font: 700 clamp(1.5rem, 4vw, 2.1rem) Georgia, serif; letter-spacing: .16em; text-shadow: 0 2px 12px #000; }
.ruleta-sub { margin: 0 0 12px; color: rgba(255, 218, 201, .74); font-size: .9rem; text-align: center; }

.ticker-viewport {
  position: relative;
  width: 100%;
  height: clamp(150px, 24vw, 205px);
  overflow: hidden;
  border-block: 1px solid rgba(207, 165, 81, .54);
  background: linear-gradient(180deg, rgba(0, 0, 0, .48), rgba(75, 19, 16, .38), rgba(0, 0, 0, .55));
  mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
}

.ticker-track { position: absolute; inset: 0 auto 0 0; display: flex; align-items: center; gap: 12px; will-change: transform; }
.ticker-card {
  flex: 0 0 clamp(108px, 15vw, 142px);
  height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid rgba(210, 180, 116, .26);
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(74, 24, 22, .95), rgba(18, 8, 11, .98));
  color: #f4e5c8;
  box-shadow: inset 0 0 22px #0007;
  transition: border-color .25s, box-shadow .25s, transform .25s;
}
.card-index { color: rgba(220, 192, 137, .58); font-size: .53rem; font-weight: 800; letter-spacing: .15em; }
.ticker-card strong { max-width: 90%; color: #e9d6b5; font: 700 .75rem Georgia, serif; letter-spacing: .04em; text-align: center; text-transform: uppercase; }
.ticker-card-winner { border-color: #f2cf70; background: linear-gradient(160deg, #624318, #27130d); box-shadow: 0 0 24px rgba(255, 203, 80, .48), inset 0 0 18px rgba(255, 218, 130, .12); transform: scale(1.04); }
.ticker-card-winner strong { color: #ffe28e; }

.marcador { position: absolute; z-index: 3; inset: -1px auto -1px 50%; width: 2px; transform: translateX(-50%); background: linear-gradient(transparent, #f4d16c 15%, #f4d16c 85%, transparent); box-shadow: 0 0 16px #f3c451; }
.marcador span { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); color: #ffe08a; font-size: 17px; text-shadow: 0 0 10px #f8c947; }
.ticker-edge { position: absolute; z-index: 2; top: 0; bottom: 0; width: 12%; pointer-events: none; }
.ticker-edge-left { left: 0; background: linear-gradient(90deg, #19090c, transparent); }
.ticker-edge-right { right: 0; background: linear-gradient(270deg, #100609, transparent); }

.ruleta-name { min-height: 1.5em; margin: 10px 0 0; color: #ffd0d0; font: 700 clamp(1.1rem, 3vw, 1.55rem) Georgia, serif; letter-spacing: .07em; text-align: center; text-transform: uppercase; }
.ruleta-name.landed { color: #ffd060; text-shadow: 0 0 16px rgba(255, 180, 40, .55); }
.ruleta-hint { margin: 0; color: rgba(255, 211, 196, .68); font-size: .8rem; letter-spacing: .06em; text-align: center; }
.ruleta-fade-enter-active, .ruleta-fade-leave-active { transition: opacity .25s ease; }
.ruleta-fade-enter-from, .ruleta-fade-leave-to { opacity: 0; }

@media (max-width: 520px) {
  .ruleta-overlay { padding: 12px; }
  .ruleta-panel { width: 100%; padding-inline: 12px; }
  .ticker-viewport { height: 148px; }
  .ticker-track { gap: 8px; }
  .ticker-card { flex-basis: 104px; }
  .ruleta-sub { font-size: .78rem; }
}
</style>
