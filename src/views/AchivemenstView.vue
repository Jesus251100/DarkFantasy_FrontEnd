<template>
  <div class="logros" :style="{ backgroundImage: `url(${fondo})` }">
    <button type="button" class="back-btn" aria-label="Volver al lobby" @click="volverAlLobby">
      <span class="back-ico" aria-hidden="true">‹</span>
    </button>

    <div class="map-hud" aria-label="Progreso del jugador">
      <span>🪙 {{ progress.coins }}</span>
      <span>💎 {{ progress.diamonds }}</span>
      <span>{{ desbloqueados }}/{{ total }}</span>
    </div>

    <main class="contenido">
      <header class="encabezado">
        <h1>LOGROS</h1>
        <p>Completa niveles para desbloquear logros y sus recompensas</p>
      </header>

      <div class="resumen" role="status">
        <div class="resumen-item">
          <strong>{{ desbloqueados }}</strong>
          <small>Desbloqueados</small>
        </div>
        <div class="resumen-item">
          <strong>{{ total }}</strong>
          <small>Totales</small>
        </div>
        <div class="resumen-item">
          <strong>{{ porcentaje }}%</strong>
          <small>Progreso</small>
        </div>
      </div>

      <AchievementTable />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AchievementTable from '../components/AchievementTable.vue'
import { useProgressStore, MAX_LEVEL } from '../stores/progress'
import fondo from '../assets/img/fondo.png'

const router = useRouter()
const progress = useProgressStore()

const total = MAX_LEVEL
const desbloqueados = computed(() => progress.completedCount)
const porcentaje = computed(() => Math.round((desbloqueados.value / total) * 100))

function volverAlLobby() {
  router.push('/lobby')
}
</script>

<style scoped>
.logros {
  min-height: 100vh;
  position: relative;
  background-size: cover;
  background-position: center;
  padding: 40px 24px 60px;
  box-sizing: border-box;
}

.logros::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(3, 8, 20, 0.55);
  pointer-events: none;
}

.logros > * {
  position: relative;
  z-index: 1;
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 30;
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 12px;
  border: 2px solid rgba(0, 200, 255, 0.55);
  background: linear-gradient(160deg, #0a1a35 0%, #061028 100%);
  color: #00d4ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  box-shadow:
    0 0 14px rgba(0, 180, 255, 0.4),
    inset 0 0 12px rgba(0, 120, 200, 0.25);
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: rgba(80, 230, 255, 0.9);
  color: #7aefff;
}

.back-ico {
  display: block;
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1;
  color: #00d4ff;
  text-shadow: 0 0 8px rgba(0, 220, 255, 0.7);
  transform: translate(-1px, -1px);
}

.map-hud {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 30;
  display: flex;
  gap: 14px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(4, 12, 30, 0.7);
  border: 2px solid rgba(0, 200, 255, 0.45);
  color: #d8f4ff;
  font-weight: 700;
  font-size: 0.9rem;
}

.contenido {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  padding-top: 40px;
  color: white;
}

.encabezado {
  text-align: center;
}

h1 {
  margin: 0 0 8px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  letter-spacing: 0.06em;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
}

.encabezado p {
  margin: 0;
  font-size: 1.05rem;
  color: rgba(230, 240, 255, 0.85);
}

.resumen {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: center;
}

.resumen-item {
  min-width: 110px;
  padding: 12px 20px;
  border-radius: 14px;
  text-align: center;
  background: rgba(5, 25, 70, 0.6);
  border: 2px solid rgba(0, 195, 255, 0.5);
  backdrop-filter: blur(6px);
}

.resumen-item strong {
  display: block;
  font-size: 1.6rem;
  color: #7ff0ff;
}

.resumen-item small {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(220, 240, 255, 0.8);
}

@media (max-width: 640px) {
  .logros {
    padding: 88px 12px 40px;
  }
  .map-hud {
    font-size: 0.78rem;
    gap: 10px;
  }
}
</style>
