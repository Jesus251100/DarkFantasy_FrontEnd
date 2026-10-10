<script lang="ts" setup>
import '../assets/css/register.css'
import AccountCreatedOverlay from '../components/AccountCreatedOverlay.vue'
import VerifyEmailModal from '../components/VerifyEmailModal.vue'
import { useRegistro } from '../composables/useRegistro'

const {
  username,
  email,
  password,
  confirmPassword,
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
    <div class="login-card">
      <img src="../assets/img/logo.png" class="logo" alt="Dark Fantasy" />

      <div class="campo">
        <label>Nombre de usuario</label>
        <input v-model="username" type="text" placeholder="INGRESE SU NOMBRE DE USUARIO" />
      </div>

      <div class="campo">
        <label>Correo Electrónico</label>
        <input v-model="email" type="text" placeholder="INGRESE SU CORREO" />
      </div>

      <div class="campo">
        <label>Contraseña</label>
        <input v-model="password" type="password" placeholder="INGRESE SU CONTRASEÑA" />
      </div>

      <div class="campo">
        <label>Confirmar Contraseña</label>
        <input v-model="confirmPassword" type="password" placeholder="INGRESE SU CONTRASEÑA" />
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

@media (max-width: 600px) {
  .reg-toast {
    right: 16px;
    left: 16px;
    text-align: center;
  }
}
</style>
