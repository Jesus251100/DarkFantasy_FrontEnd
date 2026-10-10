<template>
  <div class="logros">
    <Sidebar />

    <main class="contenido">
      <h1>LOGROS</h1>
      <p>Revisa el progreso general de los jugadores</p>

      <AchievementTable />
    </main>
  </div>
</template>

<script lang="ts" setup>
import Sidebar from '../components/AppSidebar.vue'
import AchievementTable from '../components/AchievementTable.vue'
</script>

<style scoped>
.logros {
  display: flex;
  min-height: 100vh;
  position: relative;
  background-image: url('../assets/img/fondo.png');
  background-size: cover;
  background-position: center;
}

.contenido {
  flex: 1;
  min-width: 0;
  padding: 40px;
  color: white;
}

h1 {
  margin: 0 0 8px;
  font-size: clamp(2rem, 4vw, 3.2rem);
}

p {
  margin: 0 0 30px;
  font-size: 1.15rem;
  color: rgba(230, 240, 255, 0.85);
}
</style>
