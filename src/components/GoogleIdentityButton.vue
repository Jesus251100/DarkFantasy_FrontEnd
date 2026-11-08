<template>
  <div class="google-entry">
    <div v-if="clientId" ref="contenedor" class="google-button"></div>
    <p v-else class="google-note">Google se habilita al configurar su identificador de aplicación.</p>
    <p v-if="error" class="google-error" role="status">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface GoogleCredentialResponse { credential?: string }
interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void
      renderButton(element: HTMLElement, options: Record<string, string | number>): void
    }
  }
}

declare global {
  interface Window { google?: GoogleIdentityApi }
}

const emit = defineEmits<{ credential: [token: string] }>()
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
const contenedor = ref<HTMLElement | null>(null)
const error = ref('')
let cargaGoogle: Promise<void> | null = null

function cargarBiblioteca(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (cargaGoogle) return cargaGoogle
  cargaGoogle = new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    const script = existente ?? document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => window.google?.accounts?.id ? resolve() : reject(new Error('Google no terminó de cargar.'))
    script.onerror = () => reject(new Error('No se pudo cargar el acceso de Google.'))
    if (!existente) document.head.append(script)
  })
  return cargaGoogle
}

onMounted(async () => {
  if (!clientId || !contenedor.value) return
  try {
    await cargarBiblioteca()
    if (!contenedor.value) return
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (respuesta) => {
        if (!respuesta.credential) {
          error.value = 'Google no entregó una credencial válida.'
          return
        }
        emit('credential', respuesta.credential)
      },
    })
    window.google!.accounts.id.renderButton(contenedor.value, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: 280,
    })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo preparar Google.'
  }
})
</script>

<style scoped>
.google-entry { display: grid; justify-items: center; gap: 6px; margin-top: 14px; }
.google-button { min-height: 42px; }
.google-note, .google-error { margin: 0; color: rgba(235, 227, 210, 0.7); font-size: 0.76rem; text-align: center; }
.google-error { color: #ff9d9d; }
</style>
