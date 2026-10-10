<template>
  <div class="lobby">
    <div class="contenido">
      <img src="@/assets/img/logo.png" alt="Dark Fantasy" class="logo" />

      <button class="btn" @click="irRegistro">REGISTRO</button>

      <button class="btn" @click="irLogin">INICIAR SESIÓN</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import '../assets/css/home.css'
import { useRouter } from 'vue-router'

const router = useRouter()

const irRegistro = () => {
  // Después del inicio: elegir tipo de perfil
  router.push({ path: '/tipo-user', query: { mode: 'register' } })
}

const irLogin = () => {
  router.push({ path: '/tipo-user', query: { mode: 'login' } })
}
</script>
