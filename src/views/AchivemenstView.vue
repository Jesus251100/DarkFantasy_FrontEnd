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
  min-height: 100dvh;
  position: relative;
  background-size: cover;
  background-position: center;
  padding: 16px 20px 20px;
  box-sizing: border-box;
  /* Centra el contenido verticalmente; si no cabe, se alinea arriba
     (con min-height, el contenedor crece y no se recorta nada) */
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
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
  gap: 14px;
  padding-top: 8px;
  margin-block: auto;
  color: white;
}

.encabezado {
  text-align: center;
}

h1 {
  margin: 0 0 6px;
  font-size: clamp(1.75rem, 3.4vw, 2.6rem);
  letter-spacing: 0.06em;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
}

.encabezado p {
  margin: 0;
  font-size: 1rem;
  color: rgba(230, 240, 255, 0.85);
}

.resumen {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.resumen-item {
  min-width: 104px;
  padding: 10px 18px;
  border-radius: 14px;
  text-align: center;
  background: rgba(5, 25, 70, 0.6);
  border: 2px solid rgba(0, 195, 255, 0.5);
  backdrop-filter: blur(6px);
}

.resumen-item strong {
  display: block;
  font-size: 1.4rem;
  color: #7ff0ff;
}

.resumen-item small {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(220, 240, 255, 0.8);
}

/* Pantallas de poca altura: se compacta el encabezado para que la tabla
   de 10 filas siga entrando completa */
@media (max-height: 940px) {
  h1 {
    font-size: clamp(1.5rem, 2.6vw, 2rem);
  }

  .encabezado p {
    font-size: 0.92rem;
  }

  .resumen-item {
    padding: 8px 16px;
  }

  .resumen-item strong {
    font-size: 1.2rem;
  }

  .resumen-item small {
    font-size: 0.65rem;
  }
}

/* Pantallas muy bajas (portátiles de 768px) */
@media (max-height: 830px) {
  .logros {
    padding: 10px 16px 14px;
  }

  .contenido {
    gap: 10px;
    padding-top: 4px;
  }

  h1 {
    font-size: clamp(1.3rem, 2.2vw, 1.7rem);
    margin-bottom: 4px;
  }

  .encabezado p {
    font-size: 0.82rem;
  }

  .resumen-item {
    padding: 6px 12px;
  }

  .resumen-item strong {
    font-size: 1.05rem;
  }

  .resumen-item small {
    font-size: 0.6rem;
  }
}

@media (max-width: 640px) {
  .logros {
    padding: 52px 8px 12px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    top: 12px;
    left: 12px;
  }

  .map-hud {
    top: 12px;
    right: 12px;
    font-size: 0.7rem;
    gap: 7px;
    padding: 5px 9px;
  }

  .encabezado p {
    font-size: 0.8rem;
  }

  /* Los 3 indicadores deben caber en una sola fila (si no, ocupaban 2 filas) */
  .resumen {
    gap: 8px;
  }

  .resumen-item {
    min-width: 0;
    flex: 1 1 0;
    padding: 6px 8px;
  }

  .resumen-item strong {
    font-size: 1.05rem;
  }

  .resumen-item small {
    font-size: 0.58rem;
    letter-spacing: 0.06em;
  }
}
</style>
