<template>
  <div class="news-wrapper">
<AppSidebar />
    <div class="news-container">
      <div class="header-section">
        <h1>NOTICIAS</h1>
        <p>Enterato de las últimas actualizaciones, mejoras y novedades del reino</p>
      </div>

      <div class="content">
        <div class="news-list">
          <div v-for="news in newsList" :key="news.id" class="news-card">
            <div class="news-icon">
              <img :src="news.icon" :alt="news.title" />
            </div>
            <div class="news-content">
              <div class="news-version">{{ news.version }} - {{ news.title }}</div>
              <p>{{ news.description }}</p>
            </div>
          </div>
        </div>

        <div class="summary-panel">
          <h3>Resumen de actualización</h3>
          <div class="summary-item">
            <span>Bugs arreglados</span>
            <span class="number">12</span>
          </div>
          <div class="summary-item">
            <span>Mejoras implementadas</span>
            <span class="number">7</span>
          </div>
          <div class="summary-item">
            <span>Nuevo contenido</span>
            <span class="number">10</span>
          </div>
          <div class="summary-item">
            <span>Noticias publicadas</span>
            <span class="number">4</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppSidebar from '@/components/AppSidebar.vue'
// Iconos del Figma (ya en assets)
import swords from '@/assets/img/image 177.png'
import potion from '@/assets/img/image 184.png'
import skull from '@/assets/img/image 185.png'
import shield from '@/assets/img/image 187.png'

const newsList = [
  {
    id: 1,
    version: 'v1.20',
    title: 'La sombra avanza',
    description:
      'Hemos corregido múltiples errores reportados por la comunidad y mejorado la estabilidad del juego para una experiencia más fluida',
    icon: swords,
  },
  {
    id: 2,
    version: 'v1.19',
    title: 'Nuevos niveles y desafíos',
    description:
      'Se han añadido 5 niveles nuevos con mayor dificultad y mejores recompensas ¿Estás listo para el reto?',
    icon: potion,
  },
  {
    id: 3,
    version: 'v1.18',
    title: 'Sistemas de logros mejorados',
    description:
      'Hemos optimizado el sistema de logros para que sea más intuitivo y ahora puedes ver el progreso de toda la comunidad',
    icon: skull,
  },
  {
    id: 4,
    version: 'v1.17',
    title: 'Corrección de bugs',
    description:
      'Hemos corregido múltiples errores del emparejamiento y el chat y la visualización de recompensas ¡Gracias por sus reportes!',
    icon: shield,
  },
]
</script>

<style scoped>
.news-wrapper {
  display: flex;
  min-height: 100vh;
  position: relative;
  background: url('@/assets/img/fondo.png') center center / cover no-repeat;
}

.news-container {
  flex: 1;
  padding: 40px;
  color: #e8f8ff;
  background: rgba(0, 0, 0, 0.35);
}

.header-section {
  margin-bottom: 40px;
}

.header-section h1 {
  font-size: 48px;
  font-weight: bold;
  color: #00c3ff;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
}

.header-section p {
  font-size: 16px;
  color: #b0d4ff;
  margin: 0;
}

.content {
  display: flex;
  gap: 30px;
}

.news-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.news-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: rgba(5, 25, 70, 0.4);
  border: 2px solid #00a8d8;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.news-card:hover {
  background: rgba(5, 25, 70, 0.6);
  border-color: #00c3ff;
  transform: translateX(8px);
}

.news-icon {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #00a8d8;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-icon img {
  width: 90%;
  height: 90%;
  object-fit: contain;
}

.news-content {
  flex: 1;
}

.news-version {
  color: #00c3ff;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.news-content p {
  margin: 0;
  font-size: 14px;
  color: #d0e8ff;
  line-height: 1.5;
}

.summary-panel {
  width: 220px;
  background: rgba(5, 25, 70, 0.5);
  border: 2px solid #00a8d8;
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: 80px;
}

.summary-panel h3 {
  color: #00c3ff;
  font-size: 16px;
  margin: 0 0 20px 0;
  text-align: center;
  font-weight: bold;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 195, 255, 0.2);
  font-size: 13px;
}

.summary-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.summary-item span:first-child {
  color: #b0d4ff;
}

.number {
  color: #00c3ff;
  font-weight: bold;
  font-size: 18px;
}
</style>
