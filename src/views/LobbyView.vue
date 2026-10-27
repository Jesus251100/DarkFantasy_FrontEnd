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
        <button type="button" class="btn-full" @click="router.push('/cazar-dragones')">CAZAR DRAGONES</button>
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
            <p class="profile-line">
              Nombre: {{ progress.displayName }}
              <span v-if="banderaSrc" class="flag-icon" :aria-label="`Bandera de ${paisNombre}`">
                <img :src="banderaSrc" :alt="`Bandera de ${paisNombre}`" />
              </span>
              <span v-if="paisNombre" class="pais-nombre">{{ paisNombre }}</span>
              <span
                v-if="genderSymbol"
                class="gender-icon"
                :class="usuario?.genero === 'F' ? 'is-female' : 'is-male'"
                aria-hidden="true"
              >
                {{ genderSymbol }}
              </span>
            </p>
            <p v-if="usuario?.correo" class="profile-line">Correo: {{ usuario.correo }}</p>
            <p v-if="fechaPerfil" class="profile-line">Nacimiento: {{ fechaPerfil }}</p>
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
          <button type="button" class="btn-atras" aria-label="Volver" @click="closeSettings">←</button>
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
          <h3>PERFIL</h3>
          <label class="perfil-campo">
            <span>NOMBRE</span>
            <input v-model="draftName" type="text" maxlength="40" autocomplete="username" />
          </label>
          <label class="perfil-campo">
            <span>CORREO</span>
            <input v-model="draftCorreo" type="text" autocomplete="email" />
          </label>
          <label class="perfil-campo">
            <span>PAÍS</span>
            <select v-model="draftPais">
              <option value="">Sin país</option>
              <optgroup v-for="region in REGIONES" :key="region.nombre" :label="region.nombre">
                <option v-for="codigo in region.codigos" :key="codigo" :value="codigo">
                  {{ nombrePais(codigo) }}
                </option>
              </optgroup>
            </select>
          </label>
          <label class="perfil-campo">
            <span>HOMBRE O MUJER</span>
            <select v-model="draftGenero">
              <option value="">Sin elegir</option>
              <option value="M">Hombre</option>
              <option value="F">Mujer</option>
            </select>
          </label>
          <label class="perfil-campo">
            <span>FECHA DE NACIMIENTO</span>
            <input v-model="draftFecha" type="date" />
          </label>
        </section>

        <section class="settings-section">
          <h3>CONTRASEÑA</h3>
          <p class="perfil-ayuda">Déjala vacía si no quieres cambiarla. Para cambiar el correo o la contraseña escribe la actual.</p>
          <label class="perfil-campo">
            <span>CONTRASEÑA ACTUAL</span>
            <input v-model="draftClaveActual" type="password" autocomplete="current-password" />
          </label>
          <label class="perfil-campo">
            <span>CONTRASEÑA NUEVA</span>
            <input v-model="draftClave" type="password" autocomplete="new-password" />
          </label>
          <label class="perfil-campo">
            <span>CONFIRMAR CONTRASEÑA</span>
            <input v-model="draftClave2" type="password" autocomplete="new-password" />
          </label>
        </section>

        <p v-if="errorPerfil" class="perfil-error">{{ errorPerfil }}</p>
        <button type="button" class="btn-save" :disabled="guardando" @click="saveSettings">
          {{ guardando ? 'GUARDANDO…' : 'GUARDAR CAMBIOS' }}
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/css/lobby.css'
import { useProgressStore } from '../stores/progress'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../api/cliente'
import { banderaUrl, codigoPais, nombrePais, REGIONES } from '../domain/identidad/paises'

const router = useRouter()
const progress = useProgressStore()
const auth = useAuthStore()

const usuario = computed(() => auth.usuario)

const banderaSrc = computed(() => banderaUrl(usuario.value?.nacionalidad))
const paisNombre = computed(() => nombrePais(usuario.value?.nacionalidad))

onMounted(() => {
  void auth.refrescar()
})

const genderSymbol = computed(() => {
  const g = usuario.value?.genero
  return g === 'M' ? '♂' : g === 'F' ? '♀' : ''
})

const fechaPerfil = computed(() => {
  const iso = fechaCorta(usuario.value?.fechaNacimiento)
  if (!iso) return ''
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
})

function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return ''
  const directa = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (directa) return `${directa[1]}-${directa[2]}-${directa[3]}`
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  const anio = fecha.getUTCFullYear()
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getUTCDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

const showProfile = ref(false)
const showSettings = ref(false)
const showToast = ref(false)
const guardando = ref(false)
const errorPerfil = ref('')

const settings = reactive({
  volume: 80,
  sfx: 80,
})

const draftName = ref(progress.displayName)
const draftCorreo = ref('')
const draftPais = ref('')
const draftGenero = ref('')
const draftFecha = ref('')
const draftClaveActual = ref('')
const draftClave = ref('')
const draftClave2 = ref('')

const openProfile = () => {
  showSettings.value = false
  showProfile.value = true
}

const closeProfile = () => {
  showProfile.value = false
}

const openSettings = () => {
  showProfile.value = false
  const cuenta = usuario.value
  draftName.value = cuenta?.nombre || progress.displayName
  draftCorreo.value = cuenta?.correo ?? ''
  draftPais.value = codigoPais(cuenta?.nacionalidad)
  draftGenero.value = cuenta?.genero === 'M' || cuenta?.genero === 'F' ? cuenta.genero : ''
  draftFecha.value = fechaCorta(cuenta?.fechaNacimiento)
  draftClaveActual.value = ''
  draftClave.value = ''
  draftClave2.value = ''
  errorPerfil.value = ''
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = async () => {
  errorPerfil.value = ''
  const nombre = draftName.value.trim()
  const correo = draftCorreo.value.trim()
  if (!nombre) {
    errorPerfil.value = 'Escribe un nombre.'
    return
  }
  if (!correo.includes('@')) {
    errorPerfil.value = 'El correo no es válido.'
    return
  }
  const correoCambia = correo.toLowerCase() !== (usuario.value?.correo ?? '').toLowerCase()
  if ((draftClave.value || draftClave2.value || correoCambia) && !draftClaveActual.value) {
    errorPerfil.value = 'Escribe tu contraseña actual para cambiar el correo o la contraseña.'
    return
  }
  if (draftClave.value || draftClave2.value) {
    if (draftClave.value.length < 4) {
      errorPerfil.value = 'La contraseña nueva debe tener al menos 4 caracteres.'
      return
    }
    if (draftClave.value !== draftClave2.value) {
      errorPerfil.value = 'Las contraseñas nuevas no coinciden.'
      return
    }
  }
  guardando.value = true
  try {
    await auth.actualizarPerfil({
      nombre,
      correo,
      nacionalidad: draftPais.value || null,
      genero: draftGenero.value || null,
      fechaNacimiento: draftFecha.value || null,
      claveActual: draftClaveActual.value || undefined,
      claveNueva: draftClave.value || undefined,
    })
    await progress.setDisplayName(nombre)
    draftClaveActual.value = ''
    draftClave.value = ''
    draftClave2.value = ''
    window.setTimeout(() => {
      showToast.value = true
      window.setTimeout(() => {
        showToast.value = false
      }, 2400)
    }, 350)
  } catch (error) {
    errorPerfil.value = error instanceof ApiError ? error.message : 'No se pudo guardar el perfil.'
  } finally {
    guardando.value = false
  }
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
  router.push('/online')
}
</script>
