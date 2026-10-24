<template>
  <div class="home-page">
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
  router.push('/register')
}

const irLogin = () => {
  router.push({ path: '/tipo-user', query: { mode: 'login' } })
}
</script>
