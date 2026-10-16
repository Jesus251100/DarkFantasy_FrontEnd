<template>
  <Teleport to="body">
    <Transition name="logro-fade">
      <div
        v-if="show"
        class="logro-overlay"
        role="dialog"
        aria-live="assertive"
        aria-label="Logro desbloqueado"
        @click="close"
      >
        <div class="logro-card" @click.stop>
          <p class="logro-tag">¡LOGRO DESBLOQUEADO!</p>
          <img class="logro-img" :src="imageSrc" :alt="nombre" draggable="false" />
          <h2 class="logro-name">{{ nombre }}</h2>
          <p class="logro-reward">🪙 {{ monedas }} · 💎 {{ diamantes }}</p>
          <button type="button" class="logro-btn" @click="close">Continuar</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    nombre?: string
    imagen?: string
    monedas?: number
    diamantes?: number
  }>(),
  {
    nombre: '',
    imagen: '',
    monedas: 0,
    diamantes: 0,
  },
)

const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const imageSrc = computed(() => {
  const name = props.imagen
  if (!name) return ''
  if (
    name.startsWith('http') ||
    name.startsWith('/') ||
    name.startsWith('data:') ||
    name.startsWith('blob:')
  ) {
    return name
  }
  return new URL(`../assets/img/${name}`, import.meta.url).href
})

function close() {
  emit('update:show', false)
}
</script>

<style scoped>
.logro-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 8, 20, 0.78);
  cursor: pointer;
}

.logro-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(90vw, 380px);
  padding: 26px 24px 22px;
  border-radius: 18px;
  background: linear-gradient(165deg, #06304a 0%, #041d33 60%, #02101d 100%);
  border: 3px solid #00c3ff;
  box-shadow:
    0 0 0 1px rgba(0, 120, 180, 0.9),
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(0, 180, 255, 0.35);
  animation: pop-in 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) both;
  cursor: default;
}

.logro-tag {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #7ff0ff;
  text-shadow: 0 0 12px rgba(0, 200, 255, 0.5);
}

.logro-img {
  width: 160px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid rgba(0, 195, 255, 0.7);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.5);
}

.logro-name {
  margin: 4px 0 0;
  text-align: center;
  color: #eafafF;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.logro-reward {
  margin: 2px 0 6px;
  color: #ffd060;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(255, 190, 50, 0.4);
}

.logro-btn {
  margin-top: 4px;
  padding: 10px 26px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #04202f;
  background: linear-gradient(180deg, #9beaff 0%, #23b6e6 100%);
  border: 1.5px solid #bff3ff;
  box-shadow: 0 0 16px rgba(0, 190, 255, 0.4);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.logro-btn:hover {
  transform: translateY(-1px);
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.logro-fade-enter-active,
.logro-fade-leave-active {
  transition: opacity 0.25s ease;
}
.logro-fade-enter-from,
.logro-fade-leave-to {
  opacity: 0;
}
</style>
