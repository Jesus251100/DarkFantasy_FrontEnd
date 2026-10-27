<script lang="ts" setup>
import '../assets/css/register.css'
import { useRouter } from 'vue-router'
import AccountCreatedOverlay from '../components/AccountCreatedOverlay.vue'
import VerifyEmailModal from '../components/VerifyEmailModal.vue'
import { useRegistro } from '../composables/useRegistro'
import { REGIONES, nombrePais } from '../domain/identidad/paises'

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
</script>

<template>
  <div class="login-page">
    <button type="button" class="btn-atras" aria-label="Volver" @click="router.push('/')">←</button>
    <div class="login-card">
      <img src="../assets/img/logo.png" class="logo" alt="Dark Fantasy" />

      <div class="form-grid">
        <div class="campo">
          <label>Nombre de usuario</label>
          <input v-model="username" type="text" placeholder="INGRESE SU NOMBRE DE USUARIO" />
        </div>

        <div class="campo">
          <label>Nacionalidad</label>
          <select v-model="nacionalidad" class="select-pais">
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
          <input v-model="email" type="text" placeholder="INGRESE SU CORREO" />
        </div>

        <div class="campo">
          <label>Confirmar Correo</label>
          <input v-model="confirmarEmail" type="text" placeholder="CONFIRME SU CORREO" />
        </div>

        <div class="campo">
          <label>Contraseña</label>
          <input v-model="password" type="password" placeholder="INGRESE SU CONTRASEÑA" />
        </div>

        <div class="campo">
          <label>Confirmar Contraseña</label>
          <input v-model="confirmPassword" type="password" placeholder="CONFIRME SU CONTRASEÑA" />
        </div>

        <div class="campo">
          <label>Género</label>
          <select v-model="genero" class="select-genero">
            <option value="">Selecciona tu género</option>
            <option value="M">♂️ Hombre</option>
            <option value="F">♀️ Mujer</option>
          </select>
        </div>

        <div class="campo">
          <label>Fecha de Nacimiento</label>
          <input v-model="fechaNacimiento" type="date" />
        </div>
      </div>

      <button type="button" class="btn-login" :disabled="cargando" @click="continuar">
        {{ cargando && !showVerify ? 'ENVIANDO CÓDIGO…' : 'ENVIAR CÓDIGO' }}
      </button>
    </div>

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
