<script setup lang="ts">
defineProps<{
  show: boolean
  phase: number
  method: string
  dialogue: string
}>()

const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="boss-intro">
      <div v-if="show" class="boss-intro-backdrop" role="presentation">
        <section class="boss-intro" role="dialog" aria-modal="true" aria-labelledby="boss-intro-title">
          <span class="boss-intro-kicker">EL TRONO DE LAS CENIZAS</span>
          <h2 id="boss-intro-title">Malgrath, Rey de las Cenizas</h2>
          <p class="boss-intro-phase">Fase {{ phase }} · El desafío comienza</p>
          <p class="boss-intro-method">Forma de ganar: <strong>{{ method }}</strong></p>
          <p class="boss-intro-dialogue">«{{ dialogue }}»</p>
          <p class="boss-intro-hint">
            Completa el patrón en tu cartón y canta BINGO. Al superar esta fase,
            resuelve la secuencia de letras para continuar.
          </p>
          <button type="button" class="boss-intro-start" @click="emit('start')">
            ENTRAR A LA FASE
          </button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.boss-intro-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(5, 4, 9, 0.82);
  backdrop-filter: blur(7px);
}

.boss-intro {
  width: min(520px, 100%);
  padding: clamp(24px, 5vw, 42px);
  border: 1px solid rgba(219, 175, 91, 0.7);
  border-radius: 20px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(114, 44, 40, 0.42), transparent 58%),
    linear-gradient(155deg, #1d1721 0%, #100d16 68%, #21100e 100%);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.72), 0 0 36px rgba(169, 89, 53, 0.22);
  color: #eee5d5;
  text-align: center;
}

.boss-intro-kicker,
.boss-intro-phase {
  color: #d6ad65;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.boss-intro h2 {
  margin: 12px 0 8px;
  color: #f1d79e;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: clamp(1.45rem, 4vw, 2.1rem);
  text-shadow: 0 3px 16px rgba(220, 138, 60, 0.3);
}

.boss-intro-phase { margin: 0 0 20px; }

.boss-intro-method {
  margin: 0 auto;
  padding: 12px 14px;
  border: 1px solid rgba(214, 173, 101, 0.36);
  border-radius: 12px;
  background: rgba(5, 5, 9, 0.46);
  color: #ddd2c0;
}

.boss-intro-method strong { color: #f4d078; }

.boss-intro-dialogue {
  margin: 18px 0 10px;
  color: #e5c7b2;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.5;
}

.boss-intro-hint {
  margin: 0 auto 24px;
  max-width: 410px;
  color: rgba(235, 226, 210, 0.78);
  font-size: 0.88rem;
  line-height: 1.5;
}

.boss-intro-start {
  min-height: 46px;
  padding: 0 24px;
  border: 1px solid #f0d078;
  border-radius: 999px;
  background: linear-gradient(180deg, #b57436, #693126);
  color: #fff1d2;
  font-weight: 900;
  letter-spacing: 0.12em;
  cursor: pointer;
  box-shadow: 0 0 22px rgba(190, 112, 50, 0.24);
}

.boss-intro-start:hover { filter: brightness(1.12); }

.boss-intro-enter-active,
.boss-intro-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.boss-intro-enter-from,
.boss-intro-leave-to { opacity: 0; transform: scale(0.97); }
</style>
