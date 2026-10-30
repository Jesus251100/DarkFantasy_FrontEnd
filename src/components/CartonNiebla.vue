<script setup lang="ts">
import type { BingoCell } from '../domain/bingo/tipos'

const props = defineProps<{
  celdas: BingoCell[]
  columnas: number
  cantadas: number[]
  ganadores: number[]
  completa: boolean
  saliendo: boolean
  enCasillas: boolean
  indices: number[]
  rojas: number[]
  intentos: number
  textos: Record<number, string>
  numeroOculto: (indice: number) => boolean
  opacidadSubida: number
}>()

const emit = defineEmits<{
  marcar: [indice: number]
  escribir: [indice: number, valor: string]
  enviar: [indice: number]
}>()

function esLlamada(celda: BingoCell): boolean {
  return !celda.free && props.cantadas.includes(celda.number)
}

function alEscribir(indice: number, evento: Event) {
  const input = evento.target
  if (!(input instanceof HTMLInputElement)) return
  emit('escribir', indice, input.value)
}
</script>

<template>
  <div class="carton-niebla" :class="{ encima: completa || saliendo || enCasillas || opacidadSubida > 0 }">
    <p v-if="enCasillas" class="intentos">Niebla · intentos {{ intentos }}/3</p>
    <div class="board" :style="{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }">
      <div v-for="(celda, indice) in celdas" :key="indice" class="cell-slot">
        <button
          type="button"
          class="cell"
          :class="{
            free: celda.free,
            marked: celda.marked,
            win: ganadores.includes(indice),
            llamada: esLlamada(celda),
          }"
          @click="emit('marcar', indice)"
        >
          <span v-if="celda.free">FREE</span>
          <span v-else-if="!numeroOculto(indice)">{{ celda.number }}</span>
        </button>
        <div
          v-if="(saliendo || enCasillas) && indices.includes(indice) && esLlamada(celda)"
          class="niebla-casilla"
          :class="{ roja: rojas.includes(indice) }"
        >
          <span class="velo"></span>
          <span class="grano g1"></span>
          <span class="grano g2"></span>
          <span class="sombra s1"></span>
          <span class="humo h1"></span>
          <input
            v-if="enCasillas"
            class="niebla-input"
            :value="textos[indice] ?? ''"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            autocomplete="off"
            aria-label="Escribe el número que había en esta casilla"
            @input="alEscribir(indice, $event)"
            @keydown.enter.prevent="emit('enviar', indice)"
          />
        </div>
      </div>
      <div
        v-if="opacidadSubida > 0 && !completa && !enCasillas"
        class="niebla-sube"
        :style="{ opacity: opacidadSubida / 100 }"
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
      <div v-if="completa" class="niebla-total" :class="{ sale: saliendo }" aria-hidden="true">
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
    </div>
    <svg class="niebla-defs" aria-hidden="true">
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
  </div>
</template>

<style scoped>
.carton-niebla {
  position: relative;
}

.carton-niebla.encima {
  z-index: 5;
}

.intentos {
  margin: 0 0 8px;
  color: #d5e6f2;
  letter-spacing: 0.08em;
  font-size: 0.82rem;
}

.board {
  position: relative;
  display: grid;
  gap: 8px;
  width: var(--board-w);
}

.cell-slot {
  position: relative;
  min-width: 0;
}

.cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid #3d5f93;
  background: rgba(12, 28, 58, 0.88);
  color: #d7e4f7;
  font: inherit;
  font-weight: 700;
  font-size: clamp(0.85rem, 2.4vw, 1.15rem);
}

.cell.llamada {
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(122, 215, 255, 0.35);
}

.cell.marked,
.cell.free {
  background: linear-gradient(180deg, #3a2f10, #243018);
  color: #ffe9a8;
  border-color: #e8c86a;
}

.cell.win {
  background: linear-gradient(180deg, #e8c86a, #b58f2f);
  color: #1a1305;
}

.niebla-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.niebla-total,
.niebla-sube {
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

.niebla-sube {
  z-index: 6;
  pointer-events: none;
  transition: opacity 0.45s ease;
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
  border-radius: 8px;
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
</style>
