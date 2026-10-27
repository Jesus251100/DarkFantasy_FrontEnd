<script lang="ts" setup>
import '../assets/css/login.css'
import { ref } from 'vue'
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

async function pedirCodigo() {
  error.value = ''
  aviso.value = ''
  if (!correo.value.includes('@')) {
    error.value = 'Ingresa un correo válido'
    return
  }
  cargando.value = true
  try {
    const data = await api<{ ok: boolean; bandeja?: string }>('/api/auth/olvidar-clave', {
      method: 'POST',
      body: JSON.stringify({ correo: correo.value.trim() }),
    })
    enviado.value = true
    bandeja.value = data.bandeja ?? ''
    aviso.value = 'Te enviamos un código de 6 números. Vale 10 minutos.'
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  error.value = ''
  if (!/^\d{6}$/.test(codigo.value.trim())) {
    error.value = 'El código tiene 6 números'
    return
  }
  if (clave.value.length < 4) {
    error.value = 'La contraseña debe tener al menos 4 caracteres'
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
        <input v-model="correo" type="text" placeholder="Ingrese su correo" autocomplete="username" :disabled="enviado" />
      </div>

      <template v-if="enviado">
        <div class="campo">
          <label>Código</label>
          <input v-model="codigo" type="text" inputmode="numeric" maxlength="6" placeholder="6 números" autocomplete="one-time-code" />
        </div>
        <div class="campo">
          <label>Nueva contraseña</label>
          <input v-model="clave" type="password" placeholder="Ingrese la nueva contraseña" autocomplete="new-password" />
        </div>
        <div class="campo">
          <label>Confirmar contraseña</label>
          <input v-model="confirmar" type="password" placeholder="Confirme la contraseña" autocomplete="new-password" />
        </div>
        <p v-if="bandeja" class="pista">
          En este computador el código sale en
          <a :href="bandeja" target="_blank" rel="noreferrer">la bandeja de correo</a>.
        </p>
      </template>

      <p v-if="aviso" class="aviso">{{ aviso }}</p>
      <p v-if="error" class="login-error">{{ error }}</p>
      <button type="submit" class="btn-login" :disabled="cargando">
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
