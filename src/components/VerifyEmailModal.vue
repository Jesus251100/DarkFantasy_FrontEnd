<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  email: string
  bandeja: string | null
  resendLabel: string
  canResend: boolean
  cargando: boolean
}>()

const emit = defineEmits<{
  close: []
  verify: [codigo: string]
  resend: []
}>()

const digits = ref<string[]>(['', '', '', '', '', ''])
const codeValue = computed(() => digits.value.join(''))

watch(
  () => props.email,
  () => {
    digits.value = ['', '', '', '', '', '']
  },
)

function onDigitInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const digit = input.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = digit
  input.value = digit
  if (digit && index < 5) {
    const next = document.getElementById(`code-digit-${index + 1}`) as HTMLInputElement | null
    next?.focus()
  }
}

function onDigitKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    const prev = document.getElementById(`code-digit-${index - 1}`) as HTMLInputElement | null
    prev?.focus()
  }
}

function onDigitPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? ''
  if (!text) return
  const chars = text.split('')
  for (let i = 0; i < 6; i++) {
    digits.value[i] = chars[i] ?? ''
  }
  const focusIdx = Math.min(chars.length, 5)
  const el = document.getElementById(`code-digit-${focusIdx}`) as HTMLInputElement | null
  el?.focus()
}

function confirmar() {
  emit('verify', codeValue.value)
}
</script>

<template>
  <div class="verify-backdrop" @click.self="emit('close')">
    <div class="verify-modal" role="dialog" aria-labelledby="verify-title">
      <div class="verify-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
          <rect x="8" y="14" width="48" height="36" rx="4" stroke="#7ec8e8" stroke-width="2.5" />
          <path d="M10 18 L32 34 L54 18" stroke="#7ec8e8" stroke-width="2.5" stroke-linejoin="round" />
        </svg>
      </div>

      <p id="verify-title" class="verify-text">
        Te enviamos un código de<br />
        verificación a:
      </p>
      <p class="verify-email">{{ email }}</p>
      <a v-if="bandeja" class="verify-bandeja" :href="bandeja" target="_blank" rel="noreferrer">
        Abrir bandeja de correo (Docker)
      </a>

      <div class="code-inputs" @paste="onDigitPaste">
        <input
          v-for="(_, i) in digits"
          :id="'code-digit-' + i"
          :key="i"
          class="code-digit"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :value="digits[i]"
          autocomplete="one-time-code"
          :disabled="cargando"
          @input="onDigitInput(i, $event)"
          @keydown="onDigitKeydown(i, $event)"
        />
      </div>

      <p class="resend-row">
        ¿No recibiste el código?
        <button
          type="button"
          class="resend-btn"
          :class="{ disabled: !canResend }"
          :disabled="!canResend"
          @click="emit('resend')"
        >
          {{ resendLabel }}
        </button>
      </p>

      <button type="button" class="btn-verify" :disabled="cargando" @click="confirmar">
        {{ cargando ? 'Verificando…' : 'verificar código' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.verify-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 20px;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.verify-modal {
  width: min(300px, 100%);
  padding: 28px 24px 24px;
  border-radius: 16px;
  background: linear-gradient(180deg, #1a2838 0%, #121c28 100%);
  border: 2px solid rgba(80, 140, 180, 0.45);
  box-shadow:
    0 0 28px rgba(40, 120, 180, 0.25),
    0 16px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
  color: #e8eef4;
}

.verify-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
  opacity: 0.95;
}

.verify-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.35;
  color: #d0dce8;
}

.verify-email {
  margin: 8px 0 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #3dce6a;
  word-break: break-all;
}

.verify-bandeja {
  display: inline-block;
  margin: 0 0 16px;
  color: #7ad7ff;
  font-size: 0.78rem;
  font-weight: 700;
}

.code-inputs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.code-digit {
  width: 28px;
  height: 28px;
  border: none;
  border-bottom: 2px solid rgba(180, 200, 220, 0.55);
  border-radius: 0;
  background: transparent;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  text-align: center;
  outline: none;
  caret-color: #7ad7ff;
}

.code-digit:focus {
  border-bottom-color: #7ad7ff;
}

.resend-row {
  margin: 0 0 18px;
  font-size: 0.78rem;
  color: rgba(200, 210, 220, 0.75);
}

.resend-btn {
  border: none;
  background: transparent;
  color: #5b9fd4;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0 2px;
  text-decoration: underline;
}

.resend-btn.disabled,
.resend-btn:disabled {
  color: #5b9fd4;
  opacity: 0.85;
  cursor: default;
  text-decoration: none;
}

.btn-verify {
  width: 100%;
  padding: 11px 16px;
  border: 2px solid rgba(200, 160, 70, 0.75);
  border-radius: 999px;
  background: linear-gradient(180deg, #1a2840 0%, #121c30 100%);
  color: #e8c86a;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 0 14px rgba(180, 140, 50, 0.2);
  transition: all 0.2s ease;
}

.btn-verify:disabled {
  opacity: 0.7;
  cursor: wait;
}

.btn-verify:hover:not(:disabled) {
  border-color: rgba(232, 200, 106, 0.95);
  color: #f5e0a0;
  box-shadow: 0 0 18px rgba(200, 160, 60, 0.35);
}
</style>
