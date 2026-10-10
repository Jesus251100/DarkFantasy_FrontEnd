<template>
  <div class="tipo-user-page">
    <div class="tipo-panel">
      <p class="tipo-subtitle">SELECCIONA UN PERFIL</p>

      <img
        class="tipo-logo"
        src="../assets/img/logo.png"
        alt="Dark Fantasy"
      />

      <div class="tipo-actions">
        <button type="button" class="tipo-btn" @click="elegir('jugador')">
          <span class="tipo-ico" aria-hidden="true">👤</span>
          JUGADOR
        </button>

        <button type="button" class="tipo-btn" @click="elegir('administrador')">
          <span class="tipo-ico" aria-hidden="true">👤</span>
          ADMINISTRADOR
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

/** Viene de inicio: login o register */
const mode = computed(() => {
  const m = String(route.query.mode ?? 'login')
  return m === 'register' ? 'register' : 'login'
})

const elegir = (rol: 'jugador' | 'administrador') => {
  try {
    sessionStorage.setItem('df_user_role', rol)
  } catch {
    /* ignore */
  }

  // Administrador → siempre pantalla de inicio de sesión admin
  // (después del login admin se va al dashboard)
  if (rol === 'administrador') {
    router.push('/login-admin')
    return
  }

  // Jugador → registro o login de jugador
  router.push(mode.value === 'register' ? '/register' : '/login')
}
</script>

<style scoped>
.tipo-user-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('../assets/img/fondo.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.tipo-panel {
  width: min(380px, 100%);
  padding: 28px 32px 32px;
  border-radius: 18px;
  text-align: center;
  background: rgba(4, 16, 40, 0.72);
  border: 2px solid rgba(0, 180, 255, 0.45);
  box-shadow:
    0 0 28px rgba(0, 160, 255, 0.35),
    0 16px 40px rgba(0, 0, 0, 0.5),
    inset 0 0 24px rgba(0, 100, 180, 0.12);
  backdrop-filter: blur(8px);
}

.tipo-subtitle {
  margin: 0 0 10px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: #d8e8f5;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
}

.tipo-logo {
  display: block;
  width: min(280px, 90%);
  height: auto;
  margin: 0 auto 22px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45));
}

.tipo-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tipo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 18px;
  border: 2px solid #0a0a12;
  border-radius: 999px;
  background: linear-gradient(180deg, #1a3a8a 0%, #0f255f 100%);
  color: #f0f6ff;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  cursor: pointer;
  box-shadow:
    0 0 12px rgba(40, 100, 200, 0.35),
    inset 0 0 10px rgba(40, 80, 160, 0.35);
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.tipo-btn:hover {
  background: linear-gradient(180deg, #2550b0 0%, #16357a 100%);
  box-shadow:
    0 0 18px rgba(60, 150, 255, 0.5),
    inset 0 0 12px rgba(60, 120, 220, 0.4);
  transform: translateY(-1px);
}

.tipo-ico {
  font-size: 1.15rem;
  line-height: 1;
  filter: drop-shadow(0 0 4px rgba(120, 200, 255, 0.5));
}
</style>
