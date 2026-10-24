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

  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1.5fr);

  align-items: center;

  padding: var(--fila-pad-y, 10px) var(--fila-pad-x, 14px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.logro {
  display: flex;

  align-items: center;

  gap: 12px;

  min-width: 0;
}

/* El bloque del nombre es un flex item: sin min-width:0 no se encoge y el
   texto invadía la columna de recompensa */
.logro > div {
  min-width: 0;
  overflow: hidden;
}

/* Sin margin por defecto (1em) la fila crecía 37px por encima de la imagen */
.fila h3 {
  margin: 0;
  font-size: var(--h3-size, 1rem);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

img {
  width: var(--img-w, 72px);

  height: var(--img-h, 46px);

  border-radius: 6px;

  object-fit: cover;

  flex-shrink: 0;

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

  font-size: var(--estado-size, 18px);
}

.estado.activo {
  color: #00ff48;
}

.recompensa {
  display: flex;

  gap: var(--recomp-gap, 16px);

  font-size: var(--recomp-size, 17px);
}

/* ==========================================================================
   MÓVIL: la columna "Progreso" solo muestra 1/1 o 0/1, así que se oculta
   para ganar ancho y compactar la fila todavía más.
   ========================================================================== */
@media (max-width: 640px) {
  .fila {
    grid-template-columns: minmax(0, 2.4fr) minmax(0, 1.4fr) minmax(0, 1.2fr);
  }

  .fila > div:nth-child(2) {
    display: none;
  }

  .logro {
    gap: 7px;
  }

  .estado {
    white-space: nowrap;
  }

  .recompensa {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
  }
}
</style>
