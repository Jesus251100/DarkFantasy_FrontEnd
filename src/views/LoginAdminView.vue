<script lang="ts" setup>
import '../assets/css/login.css'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import { ApiError } from '../api/cliente'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)
const auth = useAuthStore()
const progress = useProgressStore()

async function ingresarAdmin() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Ingresa correo y contraseña'
    return
  }
  cargando.value = true
  try {
    await auth.login(email.value.trim(), password.value, 'administrador')
    await progress.hidratarDesdeApi()
    router.push('/dashboard')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}

function volverTipoUser() {
  router.push({ path: '/tipo-user', query: { mode: 'login' } })
}
</script>

<template>
  <div class="login-page">
    <div class="login-card login-card--admin">
      <p class="role-badge">ADMINISTRADOR</p>
      <h2 class="titulo">INICIO DE SESIÓN</h2>

      <img src="../assets/img/logo.png" alt="Dark Fantasy" class="logo" />

      <div class="campo">
        <label>Correo</label>
        <input
          v-model="email"
          type="text"
          placeholder="Ingrese su correo de administrador"
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
      <p class="login-hint">
        Prueba: <strong>admin@darkfantasy.com</strong> / <strong>admin123</strong>
        <br />
        Entra por perfil Administrador, no por Jugador.
      </p>
      <div class="olvido">¿Olvidaste tu contraseña?</div>
      <button type="button" class="btn-login" :disabled="cargando" @click="ingresarAdmin">
        {{ cargando ? 'INGRESANDO…' : 'INGRESAR' }}
      </button>

      <button type="button" class="btn-back-role" @click="volverTipoUser">
        ← Cambiar tipo de perfil
      </button>
    </div>
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

.login-card--admin {
  border-color: rgba(232, 200, 106, 0.45);
  box-shadow:
    0 0 25px rgba(200, 160, 60, 0.25),
    0 0 60px rgba(0, 0, 0, 0.35);
}

.role-badge {
  margin: 0 0 8px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: #e8c86a;
  text-transform: uppercase;
}

.btn-back-role {
  margin-top: 14px;
  width: 100%;
  border: none;
  background: transparent;
  color: rgba(220, 230, 240, 0.75);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px;
}

.btn-back-role:hover {
  color: #fff;
}
</style>
