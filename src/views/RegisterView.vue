<script lang="ts" setup>
import '../assets/css/register.css'
import { useRouter } from 'vue-router'
import AccountCreatedOverlay from '../components/AccountCreatedOverlay.vue'
import VerifyEmailModal from '../components/VerifyEmailModal.vue'
import { useRegistro } from '../composables/useRegistro'
import { REGIONES, nombrePais } from '../domain/identidad/paises'
import GoogleIdentityButton from '../components/GoogleIdentityButton.vue'
import { ApiError } from '../api/cliente'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'

const router = useRouter()

const {
  username,
  email,
  confirmarEmail,
  password,
  confirmPassword,
  nacionalidad,
  genero,
  fechaNacimiento,
  showVerify,
  showAccountCreated,
  toast,
  bandeja,
  cargando,
  emailDisplay,
  canResend,
  resendLabel,
  continuar,
  reenviarCodigo,
  verificarCodigo,
  cerrarVerify,
} = useRegistro()

const auth = useAuthStore()
const progress = useProgressStore()

async function registrarConGoogle(idToken: string) {
  toast.value = ''
  if (!username.value.trim() || !nacionalidad.value || !genero.value || !fechaNacimiento.value) {
    toast.value = 'Completa nombre, país, género y fecha de nacimiento para crear tu perfil.'
    return
  }
  cargando.value = true
  try {
    await auth.ingresarConGoogle(idToken, username.value.trim() ? {
      nombre: username.value.trim(),
      nacionalidad: nacionalidad.value,
      genero: genero.value as 'M' | 'F',
      fechaNacimiento: fechaNacimiento.value,
    } : undefined)
    await progress.hidratarDesdeApi()
    router.push('/lobby')
  } catch (error) {
    toast.value = error instanceof ApiError ? error.message : 'No se pudo crear la cuenta con Google.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <button type="button" class="btn-atras" aria-label="Volver" @click="router.push('/')">←</button>
    <form class="login-card" @submit.prevent="continuar">
      <img src="../assets/img/logo.png" class="logo" alt="Dark Fantasy" />

      <div class="form-grid">
        <div class="campo">
          <label>Nombre de usuario</label>
          <input v-model="username" type="text" required minlength="1" maxlength="40" placeholder="INGRESE SU NOMBRE DE USUARIO" />
        </div>

        <div class="campo">
          <label>Nacionalidad</label>
          <select v-model="nacionalidad" class="select-pais" required>
            <option value="">Selecciona un país</option>
            <optgroup
              v-for="region in REGIONES"
              :key="region.nombre"
              :label="region.nombre"
            >
              <option
                v-for="codigo in region.codigos"
                :key="codigo"
                :value="codigo.toUpperCase()"
              >
                {{ nombrePais(codigo) }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="campo">
          <label>Correo Electrónico</label>
          <input v-model="email" type="email" required maxlength="254" autocomplete="email" placeholder="INGRESE SU CORREO" />
        </div>

        <div class="campo">
          <label>Confirmar Correo</label>
          <input v-model="confirmarEmail" type="email" required maxlength="254" autocomplete="off" placeholder="CONFIRME SU CORREO" />
        </div>

        <div class="campo">
          <label>Contraseña</label>
          <input v-model="password" type="password" required minlength="8" maxlength="128" autocomplete="new-password" placeholder="Mínimo 8; incluye letras y números" />
        </div>

        <div class="campo">
          <label>Confirmar Contraseña</label>
          <input v-model="confirmPassword" type="password" required minlength="8" maxlength="128" autocomplete="new-password" placeholder="CONFIRME SU CONTRASEÑA" />
        </div>

        <div class="campo">
          <label>Género</label>
          <select v-model="genero" class="select-genero" required>
            <option value="">Selecciona tu género</option>
            <option value="M">♂️ Hombre</option>
            <option value="F">♀️ Mujer</option>
          </select>
        </div>

        <div class="campo">
          <label>Fecha de Nacimiento</label>
          <input v-model="fechaNacimiento" type="date" min="1900-01-01" required />
        </div>
      </div>

      <button type="submit" class="btn-login" :disabled="cargando">
        {{ cargando && !showVerify ? 'ENVIANDO CÓDIGO…' : 'ENVIAR CÓDIGO' }}
      </button>
      <div class="google-separator"><span>o</span></div>
      <p class="google-help">También puedes entrar con Google. Para una cuenta nueva, completa nombre, país, género y fecha de nacimiento; Google confirmará el correo y usará su foto de perfil.</p>
      <GoogleIdentityButton @credential="registrarConGoogle" />
    </form>

    <VerifyEmailModal
      v-if="showVerify"
      :email="emailDisplay"
      :bandeja="bandeja"
      :resend-label="resendLabel"
      :can-resend="canResend"
      :cargando="cargando"
      @close="cerrarVerify"
      @verify="verificarCodigo"
      @resend="reenviarCodigo"
    />

    <AccountCreatedOverlay v-if="showAccountCreated" />

    <div v-if="toast" class="reg-toast" role="status">
      {{ toast }}
    </div>
  </div>
</template>

<style scoped>
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

.reg-toast {
  position: fixed;
  top: 28px;
  right: 28px;
  z-index: 70;
  padding: 12px 26px;
  border-radius: 14px;
  background: #1a1e16;
  border: 2px solid rgba(190, 160, 70, 0.85);
  color: #e8c86a;
  font-weight: 800;
  letter-spacing: 0.8px;
  font-size: 0.9rem;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.4),
    0 6px 20px rgba(0, 0, 0, 0.45);
  animation: toast-in 0.25s ease;
}

.google-separator { display: flex; align-items: center; gap: 12px; margin-top: 16px; color: rgba(232, 220, 195, 0.65); }
.google-separator::before, .google-separator::after { content: ''; flex: 1; height: 1px; background: rgba(190, 160, 70, 0.3); }
.google-help { margin: 10px auto 0; max-width: 430px; color: rgba(235, 227, 210, 0.75); font-size: 0.78rem; line-height: 1.5; text-align: center; }

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .reg-toast {
    right: 16px;
    left: 16px;
    text-align: center;
  }
}
</style>
