<script lang="ts" setup>
import '../assets/css/login.css'
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '../api/cliente'

const router = useRouter()
const correo = ref('')
const codigo = ref('')
const clave = ref('')
const confirmar = ref('')
const error = ref('')
const aviso = ref('')
const bandeja = ref('')
const cargando = ref(false)
const enviado = ref(false)
const codigoSegundosRestantes = ref(0)
let temporizadorVencimiento: ReturnType<typeof setInterval> | null = null
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CLAVE_ALFANUMERICA = /^(?=.*\p{L})(?=.*\p{N})/u
const tiempoRestanteCodigo = computed(() => {
  const minutos = Math.floor(codigoSegundosRestantes.value / 60)
  const segundos = codigoSegundosRestantes.value % 60
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
})
const codigoVencido = computed(() => codigoSegundosRestantes.value <= 0)

function iniciarContador(expiraEn: string) {
  if (temporizadorVencimiento) clearInterval(temporizadorVencimiento)
  const vencimiento = Date.parse(expiraEn)
  const actualizar = () => {
    codigoSegundosRestantes.value = Number.isFinite(vencimiento)
      ? Math.max(0, Math.ceil((vencimiento - Date.now()) / 1000))
      : 0
    if (codigoSegundosRestantes.value === 0 && temporizadorVencimiento) {
      clearInterval(temporizadorVencimiento)
      temporizadorVencimiento = null
    }
  }
  actualizar()
  if (codigoSegundosRestantes.value > 0) temporizadorVencimiento = setInterval(actualizar, 1000)
}

onUnmounted(() => {
  if (temporizadorVencimiento) clearInterval(temporizadorVencimiento)
})

async function pedirCodigo() {
  error.value = ''
  aviso.value = ''
  if (!CORREO_VALIDO.test(correo.value.trim())) {
    error.value = 'Ingresa un correo válido'
    return
  }
  cargando.value = true
  try {
    const data = await api<{ ok: boolean; bandeja?: string; expiraEn: string }>('/api/auth/olvidar-clave', {
      method: 'POST',
      body: JSON.stringify({ correo: correo.value.trim() }),
    })
    enviado.value = true
    bandeja.value = data.bandeja ?? ''
    iniciarContador(data.expiraEn)
    aviso.value = 'Te enviamos un código de 6 números. Vale 10 minutos.'
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}

async function pedirOtroCodigo() {
  if (!codigoVencido.value || cargando.value) return
  codigo.value = ''
  await pedirCodigo()
}

async function guardar() {
  error.value = ''
  if (codigoVencido.value) {
    error.value = 'El código venció. Solicita uno nuevo.'
    return
  }
  if (!/^\d{6}$/.test(codigo.value.trim())) {
    error.value = 'El código tiene 6 números'
    return
  }
  if (clave.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  if (clave.value.length > 128) {
    error.value = 'La contraseña no puede superar 128 caracteres'
    return
  }
  if (!CLAVE_ALFANUMERICA.test(clave.value)) {
    error.value = 'La contraseña debe incluir al menos una letra y un número'
    return
  }
  if (clave.value !== confirmar.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  cargando.value = true
  try {
    await api('/api/auth/restablecer-clave', {
      method: 'POST',
      body: JSON.stringify({
        correo: correo.value.trim(),
        codigo: codigo.value.trim(),
        clave: clave.value,
      }),
    })
    aviso.value = 'Listo. Ya puedes entrar con la nueva contraseña.'
    enviado.value = false
    if (temporizadorVencimiento) clearInterval(temporizadorVencimiento)
    temporizadorVencimiento = null
    codigo.value = ''
    clave.value = ''
    confirmar.value = ''
    window.setTimeout(() => router.push('/login'), 900)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <button type="button" class="btn-atras" aria-label="Volver" @click="router.push('/login')">←</button>
    <form class="login-card" @submit.prevent="enviado ? guardar() : pedirCodigo()">
      <h2 class="titulo">NUEVA CONTRASEÑA</h2>
      <img src="../assets/img/logo.png" alt="Dark Fantasy" class="logo" />

      <div class="campo">
        <label>Correo</label>
        <input v-model="correo" type="email" required maxlength="254" placeholder="Ingrese su correo" autocomplete="username" :disabled="enviado" />
      </div>

      <template v-if="enviado">
        <div class="campo">
          <label>Código</label>
          <input v-model="codigo" type="text" inputmode="numeric" pattern="[0-9]{6}" required maxlength="6" placeholder="6 números" autocomplete="one-time-code" :disabled="codigoVencido" />
        </div>
        <p class="expiry-row" :class="{ expired: codigoVencido }" aria-live="polite">
          {{ codigoVencido ? 'El código venció.' : `El código vence en ${tiempoRestanteCodigo}` }}
        </p>
        <button v-if="codigoVencido" type="button" class="resend-code" :disabled="cargando" @click="pedirOtroCodigo">
          {{ cargando ? 'ENVIANDO…' : 'SOLICITAR OTRO CÓDIGO' }}
        </button>
        <div class="campo">
          <label>Nueva contraseña</label>
          <input v-model="clave" type="password" required minlength="8" maxlength="128" placeholder="Mínimo 8; incluye letras y números" autocomplete="new-password" />
        </div>
        <div class="campo">
          <label>Confirmar contraseña</label>
          <input v-model="confirmar" type="password" required minlength="8" maxlength="128" placeholder="Confirme la contraseña" autocomplete="new-password" />
        </div>
        <p v-if="bandeja" class="pista">
          En este computador el código sale en
          <a :href="bandeja" target="_blank" rel="noreferrer">la bandeja de correo</a>.
        </p>
      </template>

      <p v-if="aviso" class="aviso">{{ aviso }}</p>
      <p v-if="error" class="login-error">{{ error }}</p>
      <button type="submit" class="btn-login" :disabled="cargando || (enviado && codigoVencido)">
        {{ cargando ? 'ESPERA…' : enviado ? 'GUARDAR' : 'ENVIAR CÓDIGO' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-error {
  margin: 0 0 10px;
  color: #ff8a8a;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
}

.aviso {
  margin: 0 0 10px;
  color: #b7f0c4;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
}

.pista {
  margin: 0 0 12px;
  color: #d8e8f5;
  font-size: 0.85rem;
  text-align: center;
}

.pista a {
  color: #9fd0ff;
}

.expiry-row {
  margin: -4px 0 12px;
  color: #e8c86a;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
}

.expiry-row.expired {
  color: #ff8a8a;
}

.resend-code {
  display: block;
  margin: 0 auto 12px;
  padding: 8px 14px;
  border: 1px solid rgba(190, 160, 70, 0.65);
  border-radius: 8px;
  background: rgba(20, 28, 40, 0.9);
  color: #e8c86a;
  font-weight: 700;
  cursor: pointer;
}

.resend-code:disabled {
  opacity: 0.55;
  cursor: wait;
}

.btn-atras {
  position: fixed;
  top: 22px;
  left: 22px;
  z-index: 5;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid rgba(0, 200, 255, 0.55);
  background: rgba(4, 16, 40, 0.8);
  color: #e8f4ff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.btn-atras:hover {
  background: rgba(0, 70, 130, 0.9);
}
</style>
