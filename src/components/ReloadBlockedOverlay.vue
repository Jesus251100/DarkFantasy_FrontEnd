<template>
  <Teleport to="body">
    <Transition name="reload-warn">
      <div
        v-if="visible"
        class="reload-warn-root"
        role="alert"
        aria-live="assertive"
      >
        <div class="reload-warn-panel">
          <span class="reload-warn-icon" aria-hidden="true">⚠</span>
          <p class="reload-warn-title">Esta página no se puede recargar</p>
          <p class="reload-warn-hint">
            Los cartones se mantienen. Usa <strong>❚❚ → REINICIAR</strong> solo si quieres empezar de cero.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RELOAD_BLOCKED_EVENT } from '../composables/usePreventLevelReload'

const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function show() {
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
    hideTimer = null
  }, 2800)
}

function onBlocked() {
  show()
}

onMounted(() => {
  window.addEventListener(RELOAD_BLOCKED_EVENT, onBlocked)
})

onUnmounted(() => {
  window.removeEventListener(RELOAD_BLOCKED_EVENT, onBlocked)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
.reload-warn-root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10050;
  display: flex;
  justify-content: center;
  padding: 18px 16px;
  pointer-events: none;
}

.reload-warn-panel {
  pointer-events: none;
  max-width: min(420px, calc(100vw - 24px));
  padding: 14px 20px 16px;
  border-radius: 14px;
  background: linear-gradient(160deg, #4a1212 0%, #2a0808 55%, #1a0505 100%);
  border: 2px solid #c43c3c;
  box-shadow:
    0 0 0 1px rgba(80, 10, 10, 0.9),
    0 10px 28px rgba(0, 0, 0, 0.65),
    0 0 22px rgba(180, 30, 30, 0.35),
    inset 0 1px 0 rgba(255, 120, 120, 0.15);
  text-align: center;
}

.reload-warn-icon {
  display: block;
  font-size: 1.25rem;
  line-height: 1;
  margin-bottom: 6px;
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 60, 60, 0.55);
}

.reload-warn-title {
  margin: 0;
  color: #ffd0d0;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
}

.reload-warn-hint {
  margin: 8px 0 0;
  color: rgba(255, 200, 200, 0.78);
  font-size: 0.78rem;
  line-height: 1.35;
}

.reload-warn-hint strong {
  color: #ffb4b4;
  font-weight: 700;
}

.reload-warn-enter-active,
.reload-warn-leave-active {
  transition: opacity 0.25s ease;
}

.reload-warn-enter-active .reload-warn-panel,
.reload-warn-leave-active .reload-warn-panel {
  transition:
    transform 0.28s ease,
    opacity 0.25s ease;
}

.reload-warn-enter-from,
.reload-warn-leave-to {
  opacity: 0;
}

.reload-warn-enter-from .reload-warn-panel {
  transform: translateY(-16px) scale(0.96);
  opacity: 0;
}

.reload-warn-leave-to .reload-warn-panel {
  transform: translateY(-10px) scale(0.98);
  opacity: 0;
}
</style>
