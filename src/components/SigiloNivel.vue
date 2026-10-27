<template>
  <span class="nivel-sigilo" :class="tramo" aria-hidden="true">
    <svg
      class="sigilo"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <path v-for="(d, i) in paths" :key="i" :d="d" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ nivel: number }>()

/**
 * Glifos del mapa de campaña. Cada uno alude a lo que el nivel trae de
 * nuevo (sacado de CatalogoNiveles): el 1 abre la ruleta, el 4 mete un
 * segundo cartón, el 9 introduce la oscuridad y el 10 al jefe final.
 */
const SIGILOS: Record<number, string[]> = {
  // 1 · 3x3, fila o columna -> llama
  1: [
    'M12 3c0 3-2 3.7-3.6 5.7C7.3 10.5 7 11.7 7 13a5 5 0 0 0 10 0c0-2-1-3.5-2.2-4.9-.5 1-1 1.6-1.6 2-.2-3-.8-5.4-1.2-7.1Z',
    'M12 12.6c-.9 1-1.5 1.8-1.5 2.8a1.5 1.5 0 0 0 3 0c0-1-.5-1.9-1.5-2.8Z',
  ],
  // 2 · + diagonal -> llave
  2: ['M12 3.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z', 'M12 11.5v9', 'M12 16.5h3.5', 'M12 19h2.5'],
  // 3 · 4x4, entran L y O -> espada
  3: ['M12 2.5 9.3 8.5V15h5.4V8.5L12 2.5Z', 'M6 15h12v2.2H6Z', 'M10.8 17.2h2.4v3h-2.4Z', 'M9.8 20.2h4.4v2h-4.4Z'],
  // 4 · 4x4 con dos cartones -> escudo
  4: ['M12 2.5 4.5 5v6.5c0 4.6 3.2 7.9 7.5 10 4.3-2.1 7.5-5.4 7.5-10V5L12 2.5Z'],
  // 5 · 5x5, cruz (+) y X -> cruz rúnica
  5: ['M12 3v18', 'M3 12h18', 'M12 8.5l3.5 3.5-3.5 3.5-3.5-3.5Z'],
  // 6 · 5x5, + H y T -> reloj de arena
  6: ['M6 3h12v3c0 3.2-3 4.6-3 6s3 2.8 3 6v3H6v-3c0-3.2 3-4.6 3-6s-3-2.8-3-6V3Z'],
  // 7 · 5x5, flecha y diamante -> ojo
  7: ['M12 5c5 0 9 4.6 9 7s-4 7-9 7-9-4.6-9-7 4-7 9-7Z', 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z'],
  // 8 · 5x5, dos cartones y cuatro métodos -> calavera
  8: [
    'M12 3c-4.4 0-7.5 3-7.5 7 0 2.4 1 4 2.5 5.2V19h10v-3.8c1.5-1.2 2.5-2.8 2.5-5.2 0-4-3.1-7-7.5-7Z',
    'M9.3 9.5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z',
    'M14.7 9.5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z',
    'M12 14.5v4.5',
  ],
  // 9 · oscuridad (niebla) -> luna creciente
  9: [
    'M15.5 2.5a9.5 9.5 0 1 0 6 14.5A7.5 7.5 0 0 1 15.5 2.5Z',
    'M5 3.5l.9 2.3 2.3.9-2.3.9L5 9.9l-.9-2.3-2.3-.9 2.3-.9L5 3.5Z',
  ],
  // 10 · jefe final, 3 fases y 6x6 -> craneo de dragon con cuernos
  10: [
    'M4 3c3.6 0 5.8 2.4 6.2 5.6',
    'M20 3c-3.6 0-5.8 2.4-6.2 5.6',
    'M12 6.5c-4 0-6.5 2.8-6.5 6.4 0 2.2.9 3.8 2.3 5V21h8.4v-3.1c1.4-1.2 2.3-2.8 2.3-5 0-3.6-2.5-6.4-6.5-6.4Z',
    'M9.6 12a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z',
    'M14.4 12a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z',
    'M12 16.5v3.5',
  ],
}

/** Tramos de dificultad: de mas frio (nivel 1) a mas caliente (nivel 10). */
const TRAMOS = ['sigilo--t1', 'sigilo--t1', 'sigilo--t2', 'sigilo--t2', 'sigilo--t3', 'sigilo--t3', 'sigilo--t4', 'sigilo--t4', 'sigilo--t5', 'sigilo--t6']

const paths = computed(() => SIGILOS[props.nivel] ?? SIGILOS[1]!)
const tramo = computed(() => TRAMOS[props.nivel - 1] ?? 'sigilo--t1')
</script>

<style scoped>
.nivel-sigilo {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  display: block;
  pointer-events: none;
  filter: drop-shadow(0 0 7px currentColor);
  transition: opacity 0.25s ease;
}

.sigilo {
  width: 30px;
  height: 30px;
  display: block;
}

/* Rampa de dificultad: frio -> caliente */
.sigilo--t1 {
  color: #7aefff;
}

.sigilo--t2 {
  color: #7be9a6;
}

.sigilo--t3 {
  color: #b96cff;
}

.sigilo--t4 {
  color: #e8c56b;
}

.sigilo--t5 {
  color: #ff8a3c;
}

.sigilo--t6 {
  color: #ff4d4d;
}

@media (max-width: 700px) {
  .sigilo {
    width: 22px;
    height: 22px;
  }

  .nivel-sigilo {
    bottom: calc(100% + 5px);
  }
}
</style>
