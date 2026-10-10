<template>
  <div class="reports-wrapper">
    <AppSidebar />

    <main class="reports-main">
      <div class="reports-header">
        <div>
          <h1>Reportes de jugadores</h1>
          <p>Revisa y gestiona los reportes enviados por la comunidad</p>
        </div>
      </div>

      <section class="table-card">
        <div class="table-toolbar">
          <button
            type="button"
            class="btn-activity"
            @click="router.push('/actividad-reciente')"
          >
            Actividad reciente
          </button>
        </div>

        <div class="table-head">
          <span>Reporte</span>
          <span>Reportado</span>
          <span>Reportado por</span>
          <span>Estado</span>
          <span>Acción</span>
        </div>

        <div v-for="row in reports" :key="row.id" class="table-row">
          <div class="report-cell">
            <span class="icon" :class="row.iconClass">{{ row.icon }}</span>
            <div>
              <strong>{{ row.title }}</strong>
              <small>{{ row.detail }}</small>
            </div>
          </div>

          <div class="avatar-cell">
            <img :src="row.reported.avatar" :alt="row.reported.name" class="user-avatar" />
            <span class="user-name">{{ row.reported.name }}</span>
          </div>

          <div class="avatar-cell">
            <img :src="row.reporter.avatar" :alt="row.reporter.name" class="user-avatar" />
            <span class="user-name">{{ row.reporter.name }}</span>
          </div>

          <div class="status-cell">{{ row.date }}</div>

          <div class="action-cell" :class="row.resolved ? 'resolved' : 'unresolved'">
            <span class="status-dot" :class="row.resolved ? 'ok' : 'bad'"></span>
            {{ row.resolved ? 'Resuelto' : 'No resuelto' }}
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'

// Avatares ya existentes en el proyecto
import santo from '@/assets/img/santo-espada.png'
import bruja from '@/assets/img/bruja-envidia.png'
import arzobispo from '@/assets/img/arzobispo-pereza.png'
import dragon from '@/assets/img/dragon.png'
import freeze from '@/assets/img/freeze.png'
import shield from '@/assets/img/shield 1.png'
import luck from '@/assets/img/goodluck 2.png'
import sabotage from '@/assets/img/sabotage 2.png'
import level1 from '@/assets/img/level1 1.png'
import level2 from '@/assets/img/level2 1.png'
import level3 from '@/assets/img/level3 1.png'
import level4 from '@/assets/img/level4 1.png'

const router = useRouter()

type Person = { name: string; avatar: string }

type Report = {
  id: number
  icon: string
  iconClass: string
  title: string
  detail: string
  reported: Person
  reporter: Person
  date: string
  resolved: boolean
}

const reports: Report[] = [
  {
    id: 1,
    icon: '💬',
    iconClass: 'blue',
    title: 'Comportamiento inapropiado',
    detail: 'Insultos y lenguaje ofensivo en el chat',
    reported: { name: 'MessiRonaldo107', avatar: santo },
    reporter: { name: 'Mi Mami456', avatar: bruja },
    date: '20/05/26',
    resolved: true,
  },
  {
    id: 2,
    icon: '🔒',
    iconClass: 'cyan',
    title: 'Uso de hacks/trampas',
    detail: 'Uso suerte infinita en partidas',
    reported: { name: 'DonPollo67', avatar: freeze },
    reporter: { name: 'Homladereff', avatar: level2 },
    date: '19/05/26',
    resolved: true,
  },
  {
    id: 3,
    icon: '⏳',
    iconClass: 'purple',
    title: 'AFK/Inactividad',
    detail: 'Quedó desconectado en partidas bingo',
    reported: { name: 'NooBMaster69', avatar: arzobispo },
    reporter: { name: 'Jhon Arenis', avatar: dragon },
    date: '23/05/26',
    resolved: false,
  },
  {
    id: 4,
    icon: '💬',
    iconClass: 'blue',
    title: 'Comportamiento inapropiado',
    detail: 'Insultos y lenguaje ofensivo en el chat',
    reported: { name: 'DavoXeneiXe', avatar: level3 },
    reporter: { name: 'Vequeta777', avatar: luck },
    date: '02/05/26',
    resolved: true,
  },
  {
    id: 5,
    icon: '🗣️',
    iconClass: 'green',
    title: 'Nombre ofensivo',
    detail: 'Nombre ofensivo y discriminativo',
    reported: { name: 'Jhonblacked', avatar: level1 },
    reporter: { name: 'Gokusupreme', avatar: shield },
    date: '02/05/26',
    resolved: true,
  },
  {
    id: 6,
    icon: '⏳',
    iconClass: 'purple',
    title: 'AFK/Inactividad',
    detail: 'Quedó desconectado en partidas bingo',
    reported: { name: 'Esotilnxd', avatar: level4 },
    reporter: { name: 'EleTeSech', avatar: sabotage },
    date: '03/05/26',
    resolved: true,
  },
]
</script>

<style scoped>
.reports-wrapper {
  display: flex;
  min-height: 100vh;
  position: relative;
  background: url('@/assets/img/fondo.png') center center / cover no-repeat;
}

.reports-main {
  flex: 1;
  min-width: 0;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 26px;
  background: rgba(0, 0, 0, 0.28);
}

.reports-header h1 {
  margin: 0;
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  color: #f4fbff;
}

.reports-header p {
  margin: 10px 0 0;
  color: #c3e6ff;
  max-width: 720px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.btn-activity {
  border: 2px solid rgba(0, 200, 255, 0.55);
  border-radius: 999px;
  padding: 10px 20px;
  background: linear-gradient(180deg, #1a4a9a 0%, #0f2f6a 100%);
  color: #e8f7ff;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.4px;
  cursor: pointer;
  box-shadow:
    0 0 14px rgba(0, 160, 255, 0.35),
    inset 0 0 10px rgba(40, 100, 180, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-activity:hover {
  border-color: rgba(80, 220, 255, 0.85);
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
  transform: translateY(-1px);
}

.table-card {
  border: 1px solid rgba(0, 195, 255, 0.22);
  border-radius: 24px;
  padding: 24px 28px 18px;
  background: rgba(5, 25, 70, 0.78);
  box-shadow: 0 0 30px rgba(0, 195, 255, 0.12);
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 2.4fr 1.3fr 1.3fr 0.9fr 1fr;
  gap: 14px;
  align-items: center;
  padding: 14px 6px;
}

.table-head {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #b8e5ff;
  font-weight: 700;
  letter-spacing: 0.6px;
  font-size: 0.92rem;
}

.table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e7f5ff;
}

.table-row:last-child {
  border-bottom: none;
}

.report-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.icon.blue {
  background: rgba(44, 108, 255, 0.35);
}

.icon.cyan {
  background: rgba(0, 197, 255, 0.32);
}

.icon.purple {
  background: rgba(179, 117, 255, 0.32);
}

.icon.green {
  background: rgba(90, 255, 160, 0.22);
}

.report-cell strong {
  display: block;
  color: #ffffff;
  font-size: 14px;
}

.report-cell small {
  color: #a6d8ff;
  font-size: 12px;
}

/* Avatares circulares como en Figma */
.avatar-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #d9f1ff;
  font-size: 13px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(0, 195, 255, 0.4);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: 0 0 8px rgba(0, 160, 255, 0.25);
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-cell {
  color: #b8d9ff;
  text-align: center;
  font-size: 13px;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
}

.action-cell.resolved {
  color: #7fff7f;
}

.action-cell.unresolved {
  color: #ff6f6f;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.ok {
  background: #40ff7f;
  box-shadow: 0 0 8px rgba(64, 255, 127, 0.55);
}

.status-dot.bad {
  background: #ff4d4d;
  box-shadow: 0 0 8px rgba(255, 77, 77, 0.55);
}

@media (max-width: 1000px) {
  .table-head,
  .table-row {
    grid-template-columns: 2fr 1.2fr 1.2fr;
  }

  .table-head span:nth-child(4),
  .table-head span:nth-child(5),
  .status-cell,
  .action-cell {
    display: none;
  }
}

@media (max-width: 820px) {
  .reports-wrapper {
    flex-direction: column;
  }

  .reports-main {
    padding: 20px;
  }
}
</style>
