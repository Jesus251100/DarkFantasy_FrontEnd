<template>
  <Teleport to="body">
    <Transition name="pause-fade">
      <div
        v-if="open"
        class="pause-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
      >
        <div class="pause-backdrop" aria-hidden="true" />
        <div class="pause-panel">
          <h2 id="pause-title" class="pause-title">JUEGO PAUSADO</h2>
          <div class="pause-grid">
            <button type="button" class="pause-btn" @click="emit('resume')">
              REANUDAR
            </button>
            <button type="button" class="pause-btn" @click="emit('restart')">
              REINICIAR
            </button>
            <button type="button" class="pause-btn" @click="emit('to-levels')">
              VOLVER A NIVELES
            </button>
            <button type="button" class="pause-btn" @click="emit('quit')">
              SALIR
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  /** true cuando el juego está en pausa */
  open: boolean
}>()

const emit = defineEmits<{
  resume: []
  restart: []
  'to-levels': []
  quit: []
}>()
</script>

<style scoped>
.pause-root {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.pause-backdrop {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    rgba(74, 18, 18, 0.92) 0%,
    rgba(42, 8, 8, 0.94) 45%,
    rgba(18, 4, 4, 0.96) 100%
  );
  backdrop-filter: blur(3px);
  box-shadow: inset 0 0 80px rgba(120, 20, 20, 0.35);
}

.pause-panel {
  position: relative;
  z-index: 1;
  width: min(420px, calc(100vw - 32px));
  padding: 28px 32px 30px;
  border-radius: 22px;
  background: linear-gradient(160deg, #4a1212 0%, #2a0808 55%, #1a0505 100%);
  border: 3px solid #c43c3c;
  box-shadow:
    0 0 0 1px rgba(80, 10, 10, 0.9),
    0 12px 40px rgba(0, 0, 0, 0.55),
    0 0 28px rgba(180, 30, 30, 0.35),
    inset 0 1px 0 rgba(255, 120, 120, 0.12);
}

.pause-title {
  margin: 0 0 22px;
  text-align: center;
  color: #ffd0d0;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: clamp(1.55rem, 4vw, 2rem);
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.55),
    0 0 18px rgba(200, 40, 40, 0.35);
}

.pause-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.pause-btn {
  appearance: none;
  border: 2.5px solid #e8b0b0;
  border-radius: 14px;
  background: linear-gradient(180deg, #8b1e1e 0%, #5a1010 100%);
  color: #ffe8e8;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: clamp(0.72rem, 2.2vw, 0.92rem);
  font-weight: 700;
  letter-spacing: 0.6px;
  padding: 14px 10px;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 140, 140, 0.18);
  transition:
    background 0.15s ease,
    transform 0.12s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.pause-btn:hover {
  background: linear-gradient(180deg, #a82828 0%, #6e1414 100%);
  border-color: #ffc8c8;
  transform: translateY(-1px);
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.4),
    0 0 14px rgba(200, 40, 40, 0.35),
    inset 0 1px 0 rgba(255, 160, 160, 0.22);
}

.pause-btn:active {
  transform: translateY(1px);
  background: linear-gradient(180deg, #6a1414 0%, #3a0808 100%);
}

.pause-fade-enter-active,
.pause-fade-leave-active {
  transition: opacity 0.2s ease;
}

.pause-fade-enter-active .pause-panel,
.pause-fade-leave-active .pause-panel {
  transition:
    transform 0.22s ease,
    opacity 0.2s ease;
}

.pause-fade-enter-from,
.pause-fade-leave-to {
  opacity: 0;
}

.pause-fade-enter-from .pause-panel,
.pause-fade-leave-to .pause-panel {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}
</style>
