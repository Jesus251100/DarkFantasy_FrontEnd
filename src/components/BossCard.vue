<template>
  <div
    class="boss-card"
    :class="{
      busy: bot.busy,
      won: bot.won,
      defeated: isDefeated,
    }"
  >
    <div class="card-header">
      <div class="card-text">
        <span class="card-title">{{ bot.name }}</span>
        <span class="card-status">{{ bot.statusText }}</span>
      </div>
      <img :src="iconSrc" :alt="bot.name" class="card-icon" />
    </div>
    <div class="progress-track" aria-hidden="true">
      <div class="progress-fill" :style="{ width: `${Math.round(bot.progress * 100)}%` }" />
    </div>
    <p class="progress-label">{{ Math.round(bot.progress * 100) }}% del patrón</p>
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
  min-height: 132px;
  height: 132px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
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
  min-height: 2.4em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
}

.card-status {
  color: #d0e8f8;
  font-size: 0.78rem;
  letter-spacing: 0.2px;
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.boss-card.won .card-status {
  color: #ffe9a0;
  font-weight: 700;
}

.card-icon {
  width: 64px;
  height: 64px;
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
  height: 7px;
  border-radius: 999px;
  background: rgba(20, 28, 34, 0.55);
  overflow: hidden;
  border: 1px solid rgba(180, 195, 200, 0.25);
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1a6cff 0%, #4dc4ff 100%);
  box-shadow: 0 0 8px rgba(40, 140, 255, 0.45);
  transition: width 0.35s ease;
}

.boss-card.won .progress-fill {
  background: linear-gradient(90deg, #c9a227 0%, #f0e68c 100%);
}

.progress-label {
  margin: 0;
  color: rgba(240, 245, 248, 0.8);
  font-size: 0.7rem;
  letter-spacing: 0.3px;
}
</style>
