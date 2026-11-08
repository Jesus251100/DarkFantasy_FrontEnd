<template>
  <Teleport to="body">
    <Transition name="portal-fade">
      <div v-if="show" class="portal-loading" :class="claseNivel" role="status" aria-live="polite">
        <div class="portal-sigil" aria-hidden="true">
          <span class="sigil-ring"></span>
          <span class="sigil-star">✦</span>
        </div>
        <p class="portal-brand">DARK FANTASY</p>
        <p class="portal-kicker">{{ datos.subtitulo }}</p>
        <h2 class="portal-title">{{ datos.titulo }}</h2>
        <p class="portal-caption">{{ datos.detalle }}</p>
        <p class="portal-difficulty">{{ datos.dificultad }}</p>
        <div
          class="portal-track"
          role="progressbar"
          aria-label="Preparando la pantalla"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span :style="{ width: `${progress}%` }"></span>
        </div>
        <span class="portal-percent" aria-hidden="true">{{ progress }}%</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DatosCarga } from '../composables/useRouteTransition'

const props = defineProps<{ show: boolean; progress: number; datos: DatosCarga }>()
const claseNivel = computed(() => (props.datos.nivel ? `nivel-${props.datos.nivel}` : 'pantalla-refugio'))
</script>

<style scoped>
.portal-loading {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    ellipse at center,
    rgba(44, 30, 57, 0.83) 0%,
    rgba(11, 10, 20, 0.96) 56%,
    #07070d 100%
  );
  color: #e9e2d1;
  backdrop-filter: blur(7px);
  --portal-accent: #d9bd74;
  --portal-aura: rgba(125, 83, 166, 0.34);
  isolation: isolate;
}

.portal-sigil {
  position: relative;
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  color: var(--portal-accent);
  filter: drop-shadow(0 0 12px rgba(166, 112, 215, 0.55));
  animation: sigil-turn 5s linear infinite;
}

.sigil-ring {
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(217, 189, 116, 0.65);
  border-radius: 50%;
  box-shadow: inset 0 0 16px rgba(125, 83, 166, 0.36), 0 0 18px rgba(125, 83, 166, 0.28);
}

.sigil-ring::before,
.sigil-ring::after {
  position: absolute;
  inset: 9px;
  border: 1px dashed rgba(180, 148, 216, 0.62);
  border-radius: 50%;
  content: '';
}

.sigil-ring::after {
  inset: 18px;
  border-style: solid;
  transform: rotate(45deg);
}

.sigil-star {
  font-size: 1.7rem;
  text-shadow: 0 0 14px rgba(217, 189, 116, 0.85);
  animation: star-pulse 1.2s ease-in-out infinite alternate;
}

.portal-title {
  margin: 11px 0 0;
  color: #e5d8b4;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-shadow: 0 0 12px rgba(166, 112, 215, 0.42);
}

.portal-brand {
  margin: 19px 0 0;
  color: #e5d8b4;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3em;
}

.portal-kicker {
  margin: 16px 0 0;
  color: var(--portal-accent);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.portal-title {
  max-width: min(88vw, 520px);
  text-align: center;
}

.portal-caption {
  max-width: min(86vw, 430px);
  margin: 8px 0 10px;
  text-align: center;
  color: rgba(224, 217, 205, 0.72);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  line-height: 1.6;
}

.portal-difficulty {
  margin: 0 0 15px;
  color: rgba(217, 189, 116, 0.82);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.portal-track {
  width: min(230px, 58vw);
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(223, 212, 183, 0.18);
}

.portal-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8d69b4, var(--portal-accent));
  box-shadow: 0 0 10px rgba(216, 189, 119, 0.7);
  transition: width 0.12s linear;
}

.portal-percent {
  min-width: 34px;
  margin-top: 7px;
  color: rgba(224, 217, 205, 0.58);
  font-size: 0.65rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.nivel-1, .nivel-2 { --portal-accent: #d8c58a; --portal-aura: rgba(93, 112, 81, 0.42); }
.nivel-3, .nivel-4 { --portal-accent: #c4a3dc; --portal-aura: rgba(110, 70, 145, 0.48); }
.nivel-5, .nivel-6 { --portal-accent: #df9477; --portal-aura: rgba(143, 54, 48, 0.44); }
.nivel-7, .nivel-8, .nivel-9 { --portal-accent: #a99be0; --portal-aura: rgba(56, 45, 112, 0.58); }
.nivel-10 { --portal-accent: #e1a74f; --portal-aura: rgba(150, 51, 37, 0.62); }
.portal-loading::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at center, var(--portal-aura), transparent 63%);
  content: '';
}

.portal-fade-enter-active,
.portal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.portal-fade-enter-from,
.portal-fade-leave-to {
  opacity: 0;
}

@keyframes sigil-turn {
  to { transform: rotate(360deg); }
}

@keyframes star-pulse {
  to { transform: scale(1.18); opacity: 0.78; }
}

@media (prefers-reduced-motion: reduce) {
  .portal-sigil,
  .sigil-star,
  .portal-track span {
    animation: none;
    transition: none;
  }
}
</style>
