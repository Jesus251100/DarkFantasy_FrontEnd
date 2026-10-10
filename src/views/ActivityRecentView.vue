<template>
  <div class="activity-wrapper">
    <AppSidebar />

    <main class="activity-main">
      <div class="activity-panel">
        <h1 class="activity-title">ACTIVIDAD RECIENTE</h1>

        <div class="activity-list">
          <p v-if="!activities.length" class="activity-text">
            Aún no hay partidas, compras ni registros en PostgreSQL.
          </p>
          <article v-for="item in activities" :key="item.id" class="activity-row">
            <span class="activity-ico" :class="item.type" aria-hidden="true">
              {{ item.icon }}
            </span>
            <p class="activity-text">{{ item.text }}</p>
            <time class="activity-time">{{ item.time }}</time>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { ConsultarAdmin } from '@/application/ConsultarAdmin'
import { ApiAdminCliente } from '@/infrastructure/ApiAdminCliente'

type Activity = {
  id: string
  type: 'level' | 'trophy' | 'user' | 'report' | 'report-ok'
  icon: string
  text: string
  time: string
}

const activities = ref<Activity[]>([])

function hace(iso: string) {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h} h`
  return `Hace ${Math.floor(h / 24)} d`
}

onMounted(async () => {
  try {
    const act = await new ConsultarAdmin(new ApiAdminCliente()).actividad()
    const rows: Array<Activity & { ms: number }> = [
      ...act.partidas.map((p) => ({
        id: p.id,
        type: (p.gano ? 'trophy' : 'report') as Activity['type'],
        icon: p.gano ? '🏆' : '⚔',
        text: p.gano
          ? `${p.nombre} ganó el nivel ${p.nivel}`
          : `${p.nombre} perdió el nivel ${p.nivel}`,
        time: hace(p.creadoEn),
        ms: new Date(p.creadoEn).getTime(),
      })),
      ...act.registros.map((r) => ({
        id: `reg-${r.correo}-${r.creadoEn}`,
        type: 'user' as const,
        icon: '👤+',
        text: `Nuevo usuario registrado: ${r.nombre}`,
        time: hace(r.creadoEn),
        ms: new Date(r.creadoEn).getTime(),
      })),
      ...(act.transacciones ?? []).map((t) => ({
        id: t.id,
        type: 'report-ok' as const,
        icon: '🪙',
        text: `${t.nombre}: ${t.detalle}`,
        time: hace(t.creadoEn),
        ms: new Date(t.creadoEn).getTime(),
      })),
    ]
    rows.sort((a, b) => b.ms - a.ms)
    activities.value = rows.map((row) => ({
      id: row.id,
      type: row.type,
      icon: row.icon,
      text: row.text,
      time: row.time,
    }))
  } catch {
    activities.value = []
  }
})
</script>

<style scoped>
.activity-wrapper {
  display: flex;
  min-height: 100vh;
  background: url('@/assets/img/fondo.png') center center / cover no-repeat;
}

.activity-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
}

.activity-panel {
  width: min(720px, 100%);
  max-height: min(70vh, 640px);
  display: flex;
  flex-direction: column;
  padding: 28px 28px 20px;
  border-radius: 22px;
  background: rgba(6, 22, 48, 0.82);
  border: 2px solid rgba(0, 180, 255, 0.35);
  box-shadow:
    0 0 28px rgba(0, 160, 255, 0.2),
    0 16px 40px rgba(0, 0, 0, 0.4),
    inset 0 0 24px rgba(0, 80, 160, 0.08);
  backdrop-filter: blur(8px);
}

.activity-title {
  margin: 0 0 20px;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #2ec8e8;
  text-shadow: 0 0 12px rgba(46, 200, 232, 0.35);
}

.activity-list {
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-list::-webkit-scrollbar {
  width: 8px;
}

.activity-list::-webkit-scrollbar-thumb {
  background: rgba(0, 180, 255, 0.35);
  border-radius: 999px;
}

.activity-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.activity-row:last-child {
  border-bottom: none;
}

.activity-ico {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
}

.activity-ico.level {
  background: #7c3aed;
  box-shadow: 0 0 10px rgba(124, 58, 237, 0.45);
}

.activity-ico.trophy {
  background: #16a34a;
  box-shadow: 0 0 10px rgba(22, 163, 74, 0.4);
}

.activity-ico.user {
  background: #0891b2;
  box-shadow: 0 0 10px rgba(8, 145, 178, 0.4);
}

.activity-ico.report {
  background: #ea580c;
  box-shadow: 0 0 10px rgba(234, 88, 12, 0.4);
}

.activity-ico.report-ok {
  background: #ca8a04;
  box-shadow: 0 0 10px rgba(202, 138, 4, 0.4);
}

.activity-text {
  margin: 0;
  color: #e8f4ff;
  font-size: 0.92rem;
  line-height: 1.35;
}

.activity-time {
  color: rgba(180, 210, 230, 0.7);
  font-size: 0.82rem;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .activity-main {
    padding: 20px 14px;
  }

  .activity-row {
    grid-template-columns: 34px 1fr;
    gap: 8px;
  }

  .activity-time {
    grid-column: 2;
  }
}
</style>
