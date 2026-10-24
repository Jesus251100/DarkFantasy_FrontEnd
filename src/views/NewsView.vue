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
  min-height: 100dvh;
  position: relative;
  background: url('@/assets/img/fondo.png') center center / cover no-repeat;
}

.news-container {
  flex: 1;
  min-width: 0;
  padding: 24px;
  color: #e8f8ff;
  background: rgba(0, 0, 0, 0.35);
  /* Centra el contenido verticalmente; con min-height el contenedor crece
     si no cabe, así que nunca se recorta */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header-section {
  margin-bottom: 24px;
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
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.news-list {
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.news-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: rgba(5, 25, 70, 0.4);
  border: 1px solid #00a8d8;
  border-radius: 14px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.news-card:hover {
  background: rgba(5, 25, 70, 0.6);
  border-color: #00c3ff;
  transform: translateX(4px);
}

.news-icon {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #00a8d8;
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
  min-width: 0;
}

.news-version {
  color: #00c3ff;
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 5px;
}

.news-content p {
  margin: 0;
  font-size: 13.5px;
  color: #d0e8ff;
  line-height: 1.45;
}

.summary-panel {
  width: min(220px, 100%);
  flex: 0 1 220px;
  background: rgba(5, 25, 70, 0.5);
  border: 1px solid #00a8d8;
  border-radius: 14px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.summary-panel h3 {
  color: #00c3ff;
  font-size: 16px;
  margin: 0 0 14px 0;
  text-align: center;
  font-weight: bold;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
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
  font-size: 17px;
}

/* ==========================================================================
   PANTALLAS INTERMEDIAS Y MÓVIL: se compacta y el panel de resumen pasa
   debajo de la lista.
   ========================================================================== */
@media (max-width: 1100px) {
  .news-container {
    padding: 16px;
  }

  .header-section {
    margin-bottom: 16px;
  }

  .header-section h1 {
    font-size: 34px;
    margin-bottom: 8px;
  }

  .header-section p {
    font-size: 14px;
  }

  .news-list {
    gap: 12px;
  }

  .news-card {
    padding: 13px;
    gap: 13px;
  }

  .news-icon {
    width: 64px;
    height: 64px;
  }

  .news-version {
    font-size: 14px;
  }

  .news-content p {
    font-size: 13px;
  }

  .summary-panel {
    padding: 16px;
  }

  .summary-panel h3 {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .summary-item {
    margin-bottom: 8px;
    padding-bottom: 7px;
    font-size: 12px;
  }

  .number {
    font-size: 15px;
  }
}

@media (max-width: 900px) {
  .news-wrapper {
    flex-direction: column;
  }

  .news-container {
    padding: 10px 8px;
  }

  .header-section {
    margin-bottom: 8px;
  }

  .header-section h1 {
    font-size: 22px;
    margin-bottom: 4px;
    letter-spacing: 1px;
  }

  .header-section p {
    font-size: 0.8rem;
  }

  .content {
    gap: 8px;
  }

  .news-list {
    flex: 1 1 100%;
    gap: 8px;
  }

  .news-card {
    padding: 9px;
    gap: 9px;
  }

  .news-icon {
    width: 40px;
    height: 40px;
  }

  .news-version {
    font-size: 11.5px;
    margin-bottom: 2px;
  }

  .news-content p {
    font-size: 11px;
    line-height: 1.35;
    /* Recorta a 3 líneas para que las 4 noticias quepan en pantalla */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .summary-panel {
    width: 100%;
    flex: 1 1 100%;
    padding: 10px;
    position: static;
  }

  .summary-panel h3 {
    font-size: 12px;
    margin-bottom: 6px;
  }

  .summary-item {
    margin-bottom: 4px;
    padding-bottom: 4px;
    font-size: 10.5px;
  }

  .number {
    font-size: 13px;
  }
}
</style>
