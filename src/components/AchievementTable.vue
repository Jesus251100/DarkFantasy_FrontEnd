<template>
  <div class="tabla">
    <div class="header">
      <span>Logro</span>

      <span>Progreso</span>

      <span>Recompensa</span>

      <span>Estado</span>
    </div>

    <AchievementRow v-for="item in achievements" :key="item.id" :achievement="item" />
  </div>
</template>

<script lang="ts" setup>
import AchievementRow from './AchievementRow.vue'

const achievements = [
  {
    id: 1,

    nombre: 'Completa el nivel 1',

    imagen: 'level1 1.png',

    progreso: '1323/1370 jugadores',

    oro: 500,

    diamantes: 10,

    estado: 'Completado',
  },

  {
    id: 2,

    nombre: 'Completa el nivel 2',

    imagen: 'level2 1.png',

    progreso: '1300/1370 jugadores',

    oro: 500,

    diamantes: 10,

    estado: 'Completado',
  },

  {
    id: 3,

    nombre: 'Completa el nivel 3',

    imagen: 'level3 1.png',

    progreso: '1210/1370 jugadores',

    oro: 700,

    diamantes: 15,

    estado: 'Completado',
  },

  {
    id: 4,

    nombre: 'Completa el nivel 4',

    imagen: 'level4 1.png',

    progreso: '1070/1370 jugadores',

    oro: 700,

    diamantes: 15,

    estado: 'Completado',
  },
]
</script>

<style scoped>
.tabla {
  width: 900px;

  background: rgba(5, 25, 70, 0.55);

  backdrop-filter: blur(8px);

  border: 3px solid #00c3ff;

  border-radius: 20px;

  overflow: hidden;
}

.header {
  display: grid;

  grid-template-columns: 2fr 2fr 1.5fr 1.5fr;

  background: #00b8ff;

  padding: 15px;

  font-weight: bold;
}
</style>
