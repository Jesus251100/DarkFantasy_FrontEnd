<template>
  <div class="dashboard-wrapper">
<AppSidebar />

    <main class="dashboard-main">
      <section class="dashboard-top">
        <div class="search-filters">
          <div class="search-box">
            <input type="text" placeholder="Buscar usuario..." />
            <button>🔎</button>
          </div>
          <button class="filter-btn">🌐 Filtrar por país</button>
          <button class="filter-btn">⚙️ Filtrar por estado</button>
        </div>

        <div class="stats-grid">
          <article class="stat-card">
            <div class="stat-icon">👥</div>
            <div>
              <span>USUARIOS TOTALES</span>
              <h2>{{ stats.totalUsuarios }}</h2>
              <p>Desde PostgreSQL</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-icon">📊</div>
            <div>
              <span>PARTIDAS JUGADAS</span>
              <h2>{{ stats.totalPartidas }}</h2>
              <p>Victorias: {{ stats.victorias }}</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-icon">🏆</div>
            <div>
              <span>TASA DE VICTORIA</span>
              <h2>{{ stats.winRate }}%</h2>
              <p>Promedio general</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-icon">🛡️</div>
            <div>
              <span>NIVELES COMPLETADOS</span>
              <h2>{{ stats.nivelesPct }}%</h2>
              <p>Promedio de campaña</p>
            </div>
          </article>
        </div>
      </section>

      <section class="dashboard-bottom">
        <div class="activity-panel">
          <div class="panel-header">
            <h3>ACTIVIDAD RECIENTE</h3>
            <button>Ver todos</button>
          </div>
          <ul>
            <li v-if="actividad.length === 0">
              <span class="activity-dot blue">⬤</span>
              Aún no hay actividad en la base de datos
            </li>
            <li v-for="item in actividad" :key="item.id">
              <span class="activity-dot" :class="item.color">⬤</span>
              {{ item.texto }}
              <span class="activity-time">{{ item.cuando }}</span>
            </li>
          </ul>
        </div>

        <div class="country-panel">
          <div class="panel-header">
            <h3>USUARIOS POR PAÍS</h3>
            <button>Ver todos</button>
          </div>
          <div class="country-list">
            <div class="country-row">
              <span>Perú</span>
              <strong>256</strong>
              <div class="progress-bar"><div style="width: 19%"></div></div>
            </div>
            <div class="country-row">
              <span>Bolivia</span>
              <strong>198</strong>
              <div class="progress-bar"><div style="width: 14%"></div></div>
            </div>
            <div class="country-row">
              <span>India</span>
              <strong>186</strong>
              <div class="progress-bar"><div style="width: 14%"></div></div>
            </div>
            <div class="country-row">
              <span>Brasil</span>
              <strong>165</strong>
              <div class="progress-bar"><div style="width: 12%"></div></div>
            </div>
            <div class="country-row">
              <span>Argentina</span>
              <strong>120</strong>
              <div class="progress-bar"><div style="width: 9%"></div></div>
            </div>
            <div class="country-row">
              <span>Ucrania</span>
              <strong>95</strong>
              <div class="progress-bar"><div style="width: 7%"></div></div>
            </div>
            <div class="country-row">
              <span>Uruguay</span>
              <strong>85</strong>
              <div class="progress-bar"><div style="width: 6%"></div></div>
            </div>
            <div class="country-row">
              <span>Colombia</span>
              <strong>70</strong>
              <div class="progress-bar"><div style="width: 5%"></div></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { ConsultarAdmin } from '@/application/ConsultarAdmin'
import { ApiAdminCliente } from '@/infrastructure/ApiAdminCliente'

const stats = ref({
  totalUsuarios: 0,
  totalPartidas: 0,
  victorias: 0,
  winRate: 0,
  nivelesPct: 0,
})

const actividad = ref<{ id: string; texto: string; cuando: string; color: string }[]>([])

function hace(iso: string) {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h} h`
  return `Hace ${Math.floor(h / 24)} d`
}

const admin = new ConsultarAdmin(new ApiAdminCliente())

onMounted(async () => {
  try {
    const reportes = await admin.reportes()
    stats.value.totalUsuarios = reportes.totalUsuarios
    stats.value.totalPartidas = reportes.totalPartidas
    stats.value.victorias = reportes.victorias
    stats.value.winRate =
      reportes.totalPartidas > 0
        ? Math.round((reportes.victorias / reportes.totalPartidas) * 100)
        : 0

    const usuarios = await admin.usuarios()
    const n = usuarios.length || 1
    const avg = usuarios.reduce((acc, u) => acc + (u.completed?.length ?? 0), 0) / n
    stats.value.nivelesPct = Math.round((avg / 10) * 100)

    const act = await admin.actividad()
    const rows = [
      ...act.partidas.map((p) => ({
        id: p.id,
        texto: p.gano
          ? `${p.nombre} ganó el nivel ${p.nivel}`
          : `${p.nombre} perdió el nivel ${p.nivel}`,
        cuando: hace(p.creadoEn),
        color: p.gano ? 'green' : 'orange',
        ms: new Date(p.creadoEn).getTime(),
      })),
      ...act.registros.map((r) => ({
        id: `u-${r.nombre}-${r.creadoEn}`,
        texto: `Nuevo usuario registrado: ${r.nombre}`,
        cuando: hace(r.creadoEn),
        color: 'blue',
        ms: new Date(r.creadoEn).getTime(),
      })),
      ...(act.transacciones ?? []).map((t) => ({
        id: t.id,
        texto: `${t.nombre}: ${t.detalle}`,
        cuando: hace(t.creadoEn),
        color: 'purple',
        ms: new Date(t.creadoEn).getTime(),
      })),
    ]
    rows.sort((a, b) => b.ms - a.ms)
    actividad.value = rows.slice(0, 8).map((row) => ({
      id: row.id,
      texto: row.texto,
      cuando: row.cuando,
      color: row.color,
    }))
  } catch {
    /* dashboard vacío si el API falla */
  }
})
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  background: url('@/assets/img/fondo.png') center center / cover no-repeat;
}

.dashboard-main {
  flex: 1;
  min-width: 0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  background: rgba(0, 0, 0, 0.45);
}

.dashboard-top {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 0;
  display: flex;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  overflow: hidden;
}

.search-box input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #e8f8ff;
  font-size: 15px;
}

.search-box input::placeholder {
  color: rgba(232, 248, 255, 0.6);
}

.search-box button {
  border: none;
  background: #0f52ff;
  color: white;
  padding: 0 20px;
  cursor: pointer;
}

.filter-btn {
  background: rgba(16, 117, 255, 0.15);
  color: #e8f8ff;
  border: 1px solid rgba(16, 117, 255, 0.3);
  border-radius: 24px;
  padding: 12px 20px;
  cursor: pointer;
  white-space: nowrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 22px;
  background: rgba(5, 25, 70, 0.55);
  border: 1px solid rgba(0, 195, 255, 0.2);
  border-radius: 20px;
  min-width: 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(0, 195, 255, 0.18);
  font-size: 24px;
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: #9ac4ff;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.stat-card h2 {
  margin: 0;
  font-size: 34px;
  color: #f4fbff;
}

.stat-card p {
  margin: 4px 0 0;
  color: #a0c8ff;
  font-size: 14px;
}

.dashboard-bottom {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 20px;
  align-items: start;
}

.activity-panel,
.country-panel {
  background: rgba(5, 25, 70, 0.55);
  border: 1px solid rgba(0, 195, 255, 0.22);
  border-radius: 24px;
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
  color: #e8f8ff;
  font-size: 20px;
}

.panel-header button {
  border: none;
  background: #0f52ff;
  color: white;
  border-radius: 14px;
  padding: 10px 18px;
  cursor: pointer;
}

.activity-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
}

.activity-panel li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  color: #e8f8ff;
  font-size: 14px;
  min-width: 0;
}

.activity-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  margin-right: 10px;
}

.activity-dot.purple {
  color: #b96cff;
}

.activity-dot.green {
  color: #7be9a6;
}

.activity-dot.blue {
  color: #5fc7ff;
}

.activity-dot.orange {
  color: #ffb86b;
}

.activity-time {
  color: rgba(232, 248, 255, 0.6);
  white-space: nowrap;
}

.country-list {
  display: grid;
  gap: 12px;
}

.country-row {
  display: grid;
  grid-template-columns: auto 56px 1fr;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  color: #e8f8ff;
  font-size: 14px;
}

.country-row strong {
  text-align: right;
}

.progress-bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress-bar div {
  height: 100%;
  background: linear-gradient(90deg, #0f82ff, #00e0ff);
  border-radius: 999px;
}

@media (max-width: 1180px) {
  .dashboard-main {
    padding: 22px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-bottom {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   PANTALLAS INTERMEDIAS (estrechas O bajas): se compacta para que todo
   siga entrando
   ========================================================================== */
@media (max-width: 1100px), (max-height: 900px) {
  .dashboard-main {
    padding: 18px;
    gap: 20px;
  }

  .dashboard-top {
    gap: 14px;
  }

  .search-box input {
    padding: 10px 14px;
  }

  .filter-btn {
    padding: 9px 16px;
  }

  .stats-grid {
    gap: 12px;
  }

  .stat-card {
    gap: 14px;
    padding: 14px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 14px;
  }

  .stat-card span {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .stat-card h2 {
    font-size: 26px;
  }

  .stat-card p {
    margin: 2px 0 0;
    font-size: 12px;
  }

  .dashboard-bottom {
    gap: 16px;
  }

  .activity-panel,
  .country-panel {
    padding: 16px;
    border-radius: 20px;
  }

  .panel-header {
    margin-bottom: 12px;
  }

  .panel-header h3 {
    font-size: 17px;
  }

  .panel-header button {
    padding: 7px 14px;
    border-radius: 12px;
  }

  .activity-panel ul {
    gap: 10px;
  }

  .activity-panel li {
    padding: 10px;
    gap: 10px;
    font-size: 13px;
  }

  .activity-dot {
    width: 14px;
    height: 14px;
    margin-right: 6px;
  }

  .country-list {
    gap: 10px;
  }

  .country-row {
    grid-template-columns: auto 44px 1fr;
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;
  }

  .progress-bar {
    height: 6px;
  }
}

/* ==========================================================================
   PANTALLAS PEQUEÑAS (muy estrechas O muy bajas): compactación extra
   ========================================================================== */
@media (max-width: 900px), (max-height: 840px) {
  .dashboard-main {
    padding: 10px 8px;
    gap: 8px;
  }

  .dashboard-top {
    gap: 8px;
  }

  /* El buscador ocupa su propia fila y los filtros van en la siguiente:
     en una sola fila el grupo se partía en 3 líneas */
  .search-filters {
    gap: 6px;
  }

  .search-box {
    flex: 1 1 100%;
  }

  .search-box input {
    padding: 7px 12px;
  }

  .filter-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .stats-grid {
    gap: 6px;
  }

  .stat-card {
    padding: 8px;
    gap: 8px;
  }

  .stat-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
    border-radius: 9px;
  }

  .stat-card span {
    font-size: 9px;
    margin-bottom: 1px;
  }

  .stat-card h2 {
    font-size: 18px;
  }

  .stat-card p {
    display: none;
  }

  .activity-panel,
  .country-panel {
    padding: 8px;
  }

  .panel-header {
    margin-bottom: 5px;
  }

  .panel-header h3 {
    font-size: 14px;
  }

  .panel-header button {
    padding: 4px 9px;
    font-size: 0.7rem;
  }

  .activity-panel ul {
    gap: 4px;
    /* Las listas son de tamaño variable: se acotan para que la página
       siempre quepa en pantalla */
    max-height: 132px;
    overflow-y: auto;
  }

  .activity-panel li {
    padding: 5px 7px;
    font-size: 11px;
    gap: 5px;
  }

  .country-list {
    gap: 4px;
    max-height: 104px;
    overflow-y: auto;
  }

  .country-row {
    padding: 3px 0;
    font-size: 11px;
  }

  .progress-bar {
    height: 4px;
  }
}

/* El menú pasa a barra horizontal solo por anchura (AppSidebar.vue) */
@media (max-width: 900px) {
  .dashboard-wrapper {
    flex-direction: column;
  }
}

/* Por debajo de 480px las tarjetas de estadísticas pasan a 1 columna */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
