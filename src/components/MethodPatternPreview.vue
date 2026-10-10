<template>
  <div
    class="method-preview"
    role="img"
    :aria-label="ariaLabel"
    :title="ariaLabel"
  >
    <div
      class="method-grid"
      :style="{
        gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
        gap: `${gapPx}px`,
      }"
    >
      <span
        v-for="index in total"
        :key="index"
        class="method-cell"
        :class="{ active: activeSet.has(index - 1) }"
        :style="{ width: `${cellPx}px`, height: `${cellPx}px` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPatternsForModes, type WinMode } from '../game/bingo'

const props = withDefaults(
  defineProps<{
    /** Tamaño del cartón del nivel (3, 4, 5…). */
    size: number
    /** Métodos de victoria del nivel. */
    winModes: WinMode[]
    /** Índice del patrón de ejemplo si hay varios (por defecto el primero / “clásico”). */
    patternIndex?: number
    cellPx?: number
    gapPx?: number
  }>(),
  {
    patternIndex: 0,
    cellPx: 18,
    gapPx: 4,
  },
)

const total = computed(() => props.size * props.size)

const activeIndices = computed(() => {
  const patterns = getPatternsForModes(props.size, props.winModes)
  if (patterns.length === 0) return [] as number[]
  const idx = Math.min(props.patternIndex, patterns.length - 1)
  return patterns[idx]?.indices ?? []
})

const activeSet = computed(() => new Set(activeIndices.value))

const ariaLabel = computed(() => {
  const modes = props.winModes.join(', ')
  return `Método de victoria: ${modes}`
})
</script>

<style scoped>
.method-preview {
  display: inline-flex;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 10px;
  background: rgba(10, 18, 28, 0.78);
  border: 1px solid rgba(50, 80, 110, 0.45);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(6px);
}

.method-grid {
  display: grid;
  box-sizing: border-box;
}

.method-cell {
  display: block;
  box-sizing: border-box;
  flex: none;
  border-radius: 3px;
  background: rgba(28, 48, 68, 0.92);
  border: 1px solid rgba(40, 70, 100, 0.55);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.method-cell.active {
  background: #1a6cff;
  border-color: #4d9fff;
  box-shadow:
    0 0 8px rgba(40, 140, 255, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
</style>
