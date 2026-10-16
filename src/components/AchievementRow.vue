<template>
  <div class="fila" :class="{ bloqueado: !desbloqueado }">
    <div class="logro">
      <img :class="{ gris: !desbloqueado }" :src="imageSrc" :alt="achievement.nombre" />

      <div>
        <h3>{{ achievement.nombre }}</h3>
      </div>
    </div>

    <div>
      {{ achievement.progreso }}
    </div>

    <div class="recompensa">
      🪙 {{ achievement.oro }}

      💎 {{ achievement.diamantes }}
    </div>

    <div class="estado" :class="{ activo: desbloqueado }">
      {{ achievement.estado }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  achievement: Object,
})

const achievement = computed(() => props.achievement ?? {})
const desbloqueado = computed(() => Boolean(achievement.value?.desbloqueado))

const imageSrc = computed(() => {
  const imageName = achievement.value?.imagen
  if (!imageName) return ''

  if (typeof imageName === 'string') {
    if (
      imageName.startsWith('http') ||
      imageName.startsWith('/') ||
      imageName.startsWith('data:') ||
      imageName.startsWith('blob:')
    ) {
      return imageName
    }

    return new URL(`../assets/img/${imageName}`, import.meta.url).href
  }

  return imageName
})
</script>

<style scoped>
.fila {
  display: grid;

  grid-template-columns: 2fr 2fr 1.5fr 1.5fr;

  align-items: center;

  padding: 18px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.logro {
  display: flex;

  align-items: center;

  gap: 15px;
}

img {
  width: 95px;

  height: 60px;

  border-radius: 6px;

  object-fit: cover;

  transition: filter 0.3s ease;
}

.gris {
  filter: grayscale(1) brightness(0.7);
  opacity: 0.75;
}

.fila.bloqueado {
  opacity: 0.85;
}

.estado {
  color: #9aa4b2;

  font-weight: bold;

  font-size: 20px;
}

.estado.activo {
  color: #00ff48;
}

.recompensa {
  display: flex;

  gap: 20px;

  font-size: 18px;
}
</style>
