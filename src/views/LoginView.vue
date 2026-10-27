<script lang="ts" setup>
import '../assets/css/login.css'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { destinoTrasLogin } from '../router/destino'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import { ApiError } from '../api/cliente'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)
const auth = useAuthStore()
const progress = useProgressStore()

async function ingresar() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Ingresa correo y contraseña'
    return
  }
  cargando.value = true
  try {
    const usuario = await auth.login(email.value.trim(), password.value)
    await progress.hidratarDesdeApi()
    const next = route.query.next
    if (usuario.rol === 'administrador' && !next) {
      router.push('/dashboard')
      return
    }
    router.push(destinoTrasLogin(next))
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <button type="button" class="btn-atras" aria-label="Volver" @click="router.push('/')">←</button>
    <form class="login-card" @submit.prevent="ingresar">
      <h2 class="titulo">INICIO DE SESIÓN</h2>

      <img src="../assets/img/logo.png" alt="Dark Fantasy" class="logo" />

      <div class="campo">
        <label>Correo</label>
        <input
          v-model="email"
          type="text"
          placeholder="Ingrese su correo"
          autocomplete="username"
        />
      </div>

      <div class="campo">
        <label>Contraseña</label>
        <input
          v-model="password"
          type="password"
          placeholder="Ingrese su contraseña"
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>
      <button type="button" class="olvido" @click="router.push('/recuperar')">¿Olvidaste tu contraseña?</button>
      <button type="submit" class="btn-login" :disabled="cargando">
        {{ cargando ? 'INGRESANDO…' : 'INGRESAR' }}
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

.olvido {
  display: block;
  margin: 0 0 18px auto;
  padding: 0;
  border: none;
  background: none;
  color: #d9d9d9;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.olvido:hover {
  color: #fff;
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
