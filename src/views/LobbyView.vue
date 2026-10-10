<template>
  <div class="lobby">
    <!-- Avatar perfil (abre overlay) -->
    <button type="button" class="profile-avatar" aria-label="Abrir perfil" @click="openProfile">
      <span class="avatar-face figma" aria-hidden="true">
        <span class="eye-slot left"></span>
        <span class="eye-slot right"></span>
      </span>
    </button>

    <div class="menu-panel">
      <h1>
        <img src="../assets/img/logo.png" alt="Dark Fantasy" class="logo" />
      </h1>
      <div class="menu">
        <button type="button" class="btn-full" @click="onOnline">ONLINE</button>
        <button type="button" class="btn-full" @click="router.push('/levels')">NIVELES</button>
        <button type="button" class="btn-full" @click="router.push('/inventory')">INVENTARIO</button>
        <div class="row">
          <button type="button" @click="router.push('/store')">TIENDA</button>
          <button type="button" @click="router.push('/achivements')">LOGROS</button>
        </div>
        <div class="row">
          <button type="button" @click="router.push('/')">SALIR</button>
          <button type="button" @click="openSettings">CONFIGURACIÓN</button>
        </div>
      </div>
    </div>

    <!-- ========== OVERLAY PERFIL ========== -->
    <div
      v-if="showProfile"
      class="modal-backdrop"
      @click.self="closeProfile"
    >
      <div class="profile-modal" role="dialog" aria-labelledby="profile-title">
        <header class="profile-header">
          <h2 id="profile-title" class="profile-title">Perfil</h2>
          <button type="button" class="profile-close" aria-label="Cerrar" @click="closeProfile">
            X
          </button>
        </header>

        <div class="profile-body">
          <div class="profile-avatar-lg" aria-hidden="true">
            <span class="avatar-face figma">
              <span class="eye-slot left"></span>
              <span class="eye-slot right"></span>
            </span>
          </div>
          <div class="profile-info">
            <p class="profile-line">Nombre: {{ progress.displayName }}</p>
            <p class="profile-line">Nivel: {{ progress.campaignLevel }}</p>
            <p class="profile-line xp-line">Experiencia: {{ progress.xp }} XP</p>
            <div class="xp-bar" aria-hidden="true">
              <div class="xp-fill" :style="{ width: progress.progressPercent + '%' }"></div>
            </div>
          </div>
        </div>

        <ul class="profile-stats">
          <li>
            <span class="stat-icon" aria-hidden="true">⚔️</span>
            <span class="stat-label">Niveles superados</span>
            <strong>{{ progress.completedCount }}/10</strong>
          </li>
          <li>
            <span class="stat-icon" aria-hidden="true">🏆</span>
            <span class="stat-label">Victorias</span>
            <strong>{{ progress.wins }}</strong>
          </li>
          <li>
            <span class="stat-icon" aria-hidden="true">📊</span>
            <span class="stat-label">Progreso</span>
            <strong>{{ progress.progressPercent }}%</strong>
          </li>
        </ul>

        <div class="profile-currency">
          <div class="currency-pill coin-pill">
            <span class="currency-icon" aria-hidden="true">🪙</span>
            <div class="currency-text">
              <strong>{{ progress.coins }}</strong>
              <small>MONEDAS</small>
            </div>
          </div>
          <div class="currency-pill diamond-pill">
            <span class="currency-icon" aria-hidden="true">💎</span>
            <div class="currency-text">
              <strong>{{ progress.diamonds }}</strong>
              <small>DIAMANTES</small>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button type="button" class="btn-account" @click="switchAccount">
            INICIAR SESION EN OTRA CUENTA
          </button>
          <button type="button" class="btn-logout" @click="logout">
            CERRAR SESIÓN
          </button>
        </div>
      </div>
    </div>

    <!-- ========== OVERLAY CONFIGURACIÓN ========== -->
    <div
      v-if="showSettings"
      class="modal-backdrop settings-backdrop"
      @click.self="closeSettings"
    >
      <div class="settings-modal" role="dialog" aria-labelledby="settings-title">
        <header class="settings-header">
          <h2 id="settings-title">CONFIGURACIÓN</h2>
        </header>

        <section class="settings-section">
          <h3>AUDIO</h3>
          <label class="slider-row">
            <span class="slider-label">
              <span class="slider-ico" aria-hidden="true">🔊</span>
              Volumen
            </span>
            <div class="slider-control">
              <input v-model.number="settings.volume" type="range" min="0" max="100" />
              <em>{{ settings.volume }}%</em>
            </div>
          </label>
          <label class="slider-row">
            <span class="slider-label">
              <span class="slider-ico" aria-hidden="true">🎵</span>
              Efectos de sonido
            </span>
            <div class="slider-control">
              <input v-model.number="settings.sfx" type="range" min="0" max="100" />
              <em>{{ settings.sfx }}%</em>
            </div>
          </label>
        </section>

        <section class="settings-section">
          <h3>CUENTA</h3>
          <div class="name-change-box">
            <span class="name-change-label">CAMBIO DE NOMBRE</span>
            <input
              v-model="draftName"
              type="text"
              class="name-input"
              placeholder="Nuevo Nombre"
              maxlength="24"
              autocomplete="username"
              aria-label="Nuevo nombre de usuario"
            />
          </div>
        </section>

        <button type="button" class="btn-save" @click="saveSettings">
          GUARDAR CAMBIOS
        </button>
      </div>
    </div>

    <!-- Toast cambios guardados (estilo Figma) -->
    <div v-if="showToast" class="toast toast-saved" role="status">
      CAMBIOS GUARDADOS
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/css/lobby.css'
import { useProgressStore } from '../stores/progress'

const router = useRouter()
const progress = useProgressStore()

const showProfile = ref(false)
const showSettings = ref(false)
const showToast = ref(false)

const settings = reactive({
  volume: 80,
  sfx: 80,
})

/** Nombre en edición dentro de Configuración */
const draftName = ref(progress.displayName)

const openProfile = () => {
  showSettings.value = false
  showProfile.value = true
}

const closeProfile = () => {
  showProfile.value = false
}

const openSettings = () => {
  showProfile.value = false
  draftName.value = progress.displayName
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = async () => {
  const next = draftName.value.trim()
  if (next) {
    await progress.setDisplayName(next)
  }
  // Pequeña demora como en el flujo de Figma, luego toast
  window.setTimeout(() => {
    showToast.value = true
    window.setTimeout(() => {
      showToast.value = false
    }, 2400)
  }, 350)
}

const switchAccount = () => {
  closeProfile()
  router.push('/login')
}

const logout = () => {
  closeProfile()
  router.push('/')
}

const onOnline = () => {
  // Placeholder: modo online aún no implementado
  window.alert('Modo ONLINE próximamente.')
}
</script>
