<template>
  <div
    class="boss-card"
    :class="{
      busy: bot.busy,
      won: bot.won,
      defeated: isDefeated,
      near: bot.progress >= 0.75 && !bot.won,
    }"
  >
    <div class="card-header">
      <div class="card-text">
        <span class="card-title">{{ bot.name }}</span>
      </div>
      <img :src="iconSrc" :alt="bot.name" class="card-icon" />
    </div>
    <div
      class="speech-bubble"
      :class="{ 'bubble-right': bot.side === 'right' }"
      aria-live="polite"
      aria-atomic="true"
    >
      <span class="speech-text">{{ bot.statusText }}</span>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      :aria-label="`Progreso de ${bot.name}`"
      :aria-valuenow="Math.round(bot.progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="progress-fill" :style="{ width: `${Math.round(bot.progress * 100)}%` }" />
    </div>
    <p class="progress-label">
      {{ bot.progressMarked }} de {{ bot.progressTotal }} casillas · {{ Math.round(bot.progress * 100) }}%
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BotRuntime } from '../game/bots'

const props = defineProps<{
  bot: BotRuntime
  /** true si la partida terminó y este bot no ganó */
  matchOver?: boolean
}>()

const icons: Record<string, string> = {
  pereza: new URL('../assets/img/arzobispo-pereza.png', import.meta.url).href,
  espada: new URL('../assets/img/santo-espada.png', import.meta.url).href,
  envidia: new URL('../assets/img/bruja-envidia.png', import.meta.url).href,
  dragon: new URL('../assets/img/dragon.png', import.meta.url).href,
}

const iconSrc = computed(() => icons[props.bot.id] ?? icons.dragon)

const isDefeated = computed(
  () => props.matchOver === true && !props.bot.won && props.bot.statusText.includes('Derrotado'),
)
</script>

<style scoped>
.boss-card {
  box-sizing: border-box;
  background: #757878;
  border: 4px solid #cad9db;
  border-radius: 18px;
  padding: 14px 16px 12px;
  min-height: 170px;
  height: 170px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.2s ease;
}

.boss-card.busy {
  border-color: #7ec8ff;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.28),
    0 0 14px rgba(40, 140, 255, 0.35);
}

.boss-card.won {
  border-color: #f0c040;
  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.35),
    0 0 20px rgba(255, 200, 60, 0.45);
  transform: scale(1.02);
}

.boss-card.defeated {
  opacity: 0.72;
  filter: grayscale(0.35);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.card-title {
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
  min-height: 1.2em;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
}

.card-icon {
  box-sizing: border-box;
  width: 56px;
  height: 56px;
  background: #5a6062;
  border: 2px solid #d0d8da;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.boss-card.busy .card-icon {
  animation: pulse-icon 0.9s ease-in-out infinite alternate;
}

@keyframes pulse-icon {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
}

.progress-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(16, 19, 24, 0.88), rgba(34, 38, 42, 0.92));
  overflow: hidden;
  border: 1px solid rgba(208, 194, 143, 0.58);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.65),
    0 1px 2px rgba(255, 241, 194, 0.14);
}

.progress-fill {
  position: relative;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #285eac 0%, #479cc9 56%, #a6d9dc 100%);
  box-shadow: 0 0 10px rgba(90, 175, 220, 0.7);
  transition: width 0.7s cubic-bezier(0.22, 0.8, 0.25, 1);
}

.progress-fill::after {
  position: absolute;
  inset: 1px 3px auto auto;
  width: 32%;
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  content: '';
}

.boss-card.busy .progress-fill {
  animation: progress-glint 1.2s ease-in-out infinite alternate;
}

.boss-card.won .progress-fill {
  background: linear-gradient(90deg, #c9a227 0%, #f0e68c 100%);
  box-shadow: 0 0 12px rgba(240, 192, 64, 0.72);
}

.boss-card.near .progress-fill {
  background: linear-gradient(90deg, #3c6d9c 0%, #86b8cb 62%, #d5d9c3 100%);
  box-shadow: 0 0 12px rgba(154, 201, 216, 0.78);
}

.progress-label {
  margin: 0;
  color: rgba(240, 245, 248, 0.8);
  font-size: 0.68rem;
  letter-spacing: 0.3px;
  text-align: center;
}

.speech-bubble {
  position: relative;
  display: flex;
  box-sizing: border-box;
  min-height: 40px;
  max-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  overflow: visible;
  border: 1px solid rgba(204, 181, 123, 0.9);
  border-radius: 12px;
  background: linear-gradient(180deg, #e1dac8 0%, #c9c0ab 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.35);
  color: #28212b;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 0.74rem;
  font-style: italic;
  font-weight: 600;
  line-height: 1.18;
  text-align: center;
}

.speech-text {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.speech-bubble::after {
  position: absolute;
  bottom: -6px;
  left: 18px;
  width: 9px;
  height: 9px;
  transform: rotate(45deg);
  border-right: 1px solid rgba(204, 181, 123, 0.9);
  border-bottom: 1px solid rgba(204, 181, 123, 0.9);
  background: #c9c0ab;
  content: '';
}

.speech-bubble.bubble-right::after {
  right: 18px;
  left: auto;
}

@keyframes progress-glint {
  from {
    filter: brightness(0.94);
  }
  to {
    filter: brightness(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .boss-card.busy .progress-fill,
  .boss-card.busy .card-icon {
    animation: none;
    transition: none;
  }
}
</style>
