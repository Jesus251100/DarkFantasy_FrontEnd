<template>
  <div class="fila">
    <div class="logro">
      <img :src="imageSrc" />

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

    <div class="estado">
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
}

.estado {
  color: #00ff48;

  font-weight: bold;

  font-size: 20px;
}

.recompensa {
  display: flex;

  gap: 20px;

  font-size: 18px;
}
</style>
