<script setup lang="ts">
import { useRouter } from 'vue-router'
import brandLogo from '@/assets/img/logo.png'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navigate = (path: string) => {
  router.push(path)
}

const goBack = () => {
  router.push('/lobby')
}

const cerrarSesion = () => {
  auth.cerrar()
  router.push('/')
}
</script>

<template>
  <aside class="sidebar">
    <button type="button" class="back-btn" aria-label="Volver al lobby" @click="goBack">
      <span class="back-ico" aria-hidden="true">‹</span>
    </button>

    <!-- Logo tipográfico del Figma (solo texto) -->
    <img :src="brandLogo" alt="Dark Fantasy" class="brand-logo" />

    <nav class="sidebar-nav" aria-label="Menú administración">
      <button type="button" @click="navigate('/lobby')">Lobby</button>
      <button type="button" @click="navigate('/levels')">Niveles</button>
      <button type="button" @click="navigate('/dashboard')">Dashboard</button>
      <button type="button" @click="navigate('/users')">Usuarios</button>
      <button type="button" @click="navigate('/reports')">Reportes</button>
      <button type="button" @click="navigate('/achivements')">Logros</button>
      <button type="button" @click="navigate('/news')">Noticias</button>
    </nav>

    <button type="button" class="logout" @click="cerrarSesion">Cerrar sesión</button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 180px;
  min-height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 14px 28px;
  box-sizing: border-box;
  flex-shrink: 0;
  position: relative;
  z-index: 20;
  /* Si la pantalla es muy baja, el menú se desplaza en vez de recortarse */
  overflow-x: hidden;
  overflow-y: auto;
  isolation: isolate;
}

/* Nada del contenido de la página debe dibujarse encima del menú */
.sidebar * {
  max-width: 100%;
}

.back-btn {
  width: 48px;
  height: 48px;
  margin: 0 0 8px;
  padding: 0;
  border-radius: 12px;
  border: 2px solid rgba(0, 200, 255, 0.55);
  background: linear-gradient(160deg, #0a1a35 0%, #061028 100%);
  color: #00d4ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  box-shadow:
    0 0 14px rgba(0, 180, 255, 0.4),
    inset 0 0 12px rgba(0, 120, 200, 0.25);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  border-color: rgba(80, 230, 255, 0.9);
  color: #7aefff;
}

.back-ico {
  display: block;
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1;
  color: #00d4ff;
  text-shadow: 0 0 8px rgba(0, 220, 255, 0.7);
  transform: translate(-1px, -1px);
}

.brand-logo {
  width: 140px;
  height: auto;
  max-height: 72px;
  object-fit: contain;
  margin: 0 0 10px;
  display: block;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.sidebar-nav button,
.logout {
  width: 132px;
  min-height: 44px;
  border: none;
  border-radius: 12px;
  background: #0f52ff;
  color: white;
  cursor: pointer;
  transition: 0.3s;
  font-weight: 700;
  font-size: 0.78rem;
  line-height: 1.15;
  padding: 8px 6px;
}

.sidebar-nav button:hover,
.logout:hover {
  background: #16b9ff;
  transform: scale(1.05);
}

.logout {
  margin-top: auto;
}

/* ==========================================================================
   PANTALLAS ESTRECHAS: el menú vertical (634px) pasa a barra horizontal
   (52px). Sin esto, al apilarse el sidebar ocupaba la pantalla completa
   y dejaba el contenido de la página debajo del pliegue.
   ========================================================================== */
@media (max-width: 900px) {
  .sidebar {
    width: 100%;
    min-height: auto;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    margin: 0;
    border-radius: 10px;
  }

  .back-ico {
    font-size: 1.3rem;
  }

  .brand-logo {
    width: auto;
    height: 26px;
    max-height: 26px;
    margin: 0;
    flex-shrink: 0;
  }

  .sidebar-nav {
    flex-direction: row;
    align-items: center;
    gap: 6px;
    width: auto;
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .sidebar-nav::-webkit-scrollbar {
    display: none;
  }

  .sidebar-nav button,
  .logout {
    width: auto;
    min-width: 78px;
    min-height: 30px;
    padding: 4px 8px;
    font-size: 0.66rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .logout {
    margin-top: 0;
    margin-left: auto;
  }
}

/* ==========================================================================
   PANTALLAS BAJAS (portátiles): el menú vertical se comprime para que
   quepa sin necesidad de desplazarse.
   ========================================================================== */
@media (max-height: 700px) and (min-width: 901px) {
  .sidebar {
    gap: 10px;
    padding: 12px 14px 16px;
  }

  .brand-logo {
    max-height: 46px;
    margin-bottom: 2px;
  }

  .back-btn {
    width: 40px;
    height: 40px;
    margin-bottom: 4px;
  }

  .sidebar-nav {
    gap: 10px;
  }

  .sidebar-nav button,
  .logout {
    min-height: 36px;
    padding: 6px 6px;
    font-size: 0.72rem;
  }
}
</style>
