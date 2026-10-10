<template>
  <div class="map-container">
    <button
      type="button"
      class="back-btn"
      aria-label="Volver al lobby"
      @click="router.push('/lobby')"
    >
      <span class="back-ico" aria-hidden="true">‹</span>
    </button>

    <div class="map-hud" aria-label="Progreso de campaña">
      <span>🪙 {{ progress.coins }}</span>
      <span>💎 {{ progress.diamonds }}</span>
      <span>{{ progress.completedCount }}/10</span>
    </div>

    <p v-if="lockHint" class="lock-hint" role="status">{{ lockHint }}</p>

    <button
      v-for="nivel in niveles"
      :key="nivel.id"
      class="nivel"
      :class="nivelClass(nivel.id)"
      :style="{
        left: nivel.x,
        top: nivel.y,
      }"
      :aria-label="labelNivel(nivel.id)"
      @click="abrirNivel(nivel.id)"
    >
      <span v-if="progress.isCompleted(nivel.id)" class="nivel-mark" aria-hidden="true">✓</span>
      <span v-else-if="!progress.isUnlocked(nivel.id)" class="nivel-mark lock" aria-hidden="true">🔒</span>
      {{ nivel.id }}
    </button>

    <div class="corona">👑</div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const progress = useProgressStore()
const lockHint = ref('')

const niveles = [
  { id: 1, x: '20%', y: '32%' },
  { id: 2, x: '38%', y: '35%' },
  { id: 3, x: '58%', y: '42%' },
  { id: 4, x: '77%', y: '40%' },
  { id: 5, x: '94%', y: '52%' },

  { id: 6, x: '84%', y: '80%' },
  { id: 7, x: '64%', y: '76%' },
  { id: 8, x: '46%', y: '80%' },
  { id: 9, x: '26%', y: '70%' },

  { id: 10, x: '7%', y: '58%' },
]

function nivelClass(id: number) {
  if (!progress.isUnlocked(id)) return 'locked'
  if (progress.isCompleted(id)) return 'cleared'
  return 'current'
}

function labelNivel(id: number) {
  if (!progress.isUnlocked(id)) return `Nivel ${id} bloqueado`
  if (progress.isCompleted(id)) return `Nivel ${id} superado`
  return `Jugar nivel ${id}`
}

const abrirNivel = (id: number) => {
  if (!progress.isUnlocked(id)) {
    lockHint.value = `Gana el nivel ${id - 1} para desbloquear el ${id}`
    return
  }
  lockHint.value = ''
  router.push(`/level${id}`)
}

onMounted(() => {
  if (auth.usuario?.rol === 'administrador') return
  const locked = Number(route.query.locked)
  if (Number.isInteger(locked) && locked >= 2 && locked <= 10) {
    lockHint.value = `Gana el nivel ${locked - 1} para desbloquear el ${locked}`
  }
})
</script>

<style scoped>
.map-container {
  position: relative;

  width: 100%;
  height: 100vh;

  background-image: url('../assets/img/fondo niveles.jpeg');
  background-size: cover;
  background-position: center;

  overflow: hidden;
}

/* Botón volver estilo Figma: cuadrado redondeado + glow cyan */
.back-btn {
  position: absolute;
  top: 22px;
  left: 24px;
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 14px;
  border: 2px solid rgba(0, 200, 255, 0.55);
  background: linear-gradient(160deg, #0a1a35 0%, #061028 100%);
  color: #00d4ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  backdrop-filter: blur(8px);
  box-shadow:
    0 0 16px rgba(0, 180, 255, 0.45),
    0 0 28px rgba(0, 140, 255, 0.2),
    inset 0 0 14px rgba(0, 120, 200, 0.25);
  z-index: 20;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: rgba(80, 230, 255, 0.9);
  box-shadow:
    0 0 22px rgba(0, 210, 255, 0.65),
    0 0 36px rgba(0, 160, 255, 0.3),
    inset 0 0 16px rgba(0, 150, 220, 0.35);
  color: #7aefff;
}

.back-ico {
  display: block;
  font-size: 1.7rem;
  font-weight: 600;
  line-height: 1;
  color: #00d4ff;
  text-shadow: 0 0 8px rgba(0, 220, 255, 0.7);
  transform: translate(-1px, -1px);
}

.map-hud {
  position: absolute;
  top: 22px;
  right: 24px;
  z-index: 20;
  display: flex;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(6, 16, 40, 0.78);
  border: 1.5px solid rgba(0, 200, 255, 0.45);
  color: #e8f7ff;
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.03em;
  box-shadow: 0 0 16px rgba(0, 180, 255, 0.25);
}

.lock-hint {
  position: absolute;
  top: 86px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 21;
  margin: 0;
  padding: 8px 16px;
  border-radius: 10px;
  background: rgba(40, 8, 12, 0.88);
  border: 1px solid rgba(255, 90, 90, 0.55);
  color: #ffd0d0;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

/* NIVELES */

.nivel {
  position: absolute;

  width: 75px;
  height: 75px;

  border-radius: 50%;

  border: 3px solid #00d4ff;

  background: rgba(0, 40, 120, 0.8);

  color: #fff5b7;

  font-size: 32px;
  font-weight: bold;

  cursor: pointer;

  transform: translate(-50%, -50%);

  box-shadow:
    0 0 15px #00d4ff,
    inset 0 0 15px rgba(0, 212, 255, 0.4);
}

.nivel-mark {
  position: absolute;
  top: -6px;
  right: -4px;
  font-size: 16px;
  line-height: 1;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}

.nivel-mark.lock {
  font-size: 14px;
}

.nivel.current {
  border-color: #7aefff;
  box-shadow:
    0 0 18px #00d4ff,
    0 0 32px rgba(0, 212, 255, 0.45),
    inset 0 0 15px rgba(0, 212, 255, 0.4);
}

.nivel.cleared {
  border-color: #e8c56b;
  background: rgba(80, 55, 10, 0.85);
  color: #fff3c2;
  box-shadow:
    0 0 16px rgba(232, 197, 107, 0.55),
    inset 0 0 12px rgba(232, 197, 107, 0.25);
}

.nivel.locked {
  border-color: rgba(120, 140, 160, 0.45);
  background: rgba(18, 22, 32, 0.72);
  color: rgba(200, 210, 220, 0.45);
  cursor: not-allowed;
  filter: grayscale(0.7);
  box-shadow: none;
}

/* EFECTO HOVER */

.nivel:hover {
  transform: translate(-50%, -50%) scale(1.1);

  box-shadow:
    0 0 25px #00d4ff,
    0 0 40px #00d4ff;
}

.nivel.locked:hover {
  transform: translate(-50%, -50%);
  box-shadow: none;
}

.nivel.cleared:hover {
  box-shadow:
    0 0 24px rgba(232, 197, 107, 0.7),
    0 0 36px rgba(232, 197, 107, 0.35);
}

/* CORONA */

.corona {
  position: absolute;

  left: 5%;
  top: 48%;

  font-size: 50px;

  transform: translateY(-50%);
}
</style>
