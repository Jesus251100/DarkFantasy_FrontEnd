<template>
  <div class="users-wrapper">
    <AppSidebar />

    <main class="users-main">
      <!-- Buscador y filtros -->
      <section class="search-section">
        <div class="search-input">
          <input v-model="query" type="text" placeholder="Buscar usuario....." />
          <button type="button" aria-label="Buscar">🔍</button>
        </div>
        <button type="button" class="filter-button">🌐 Filtrar por país</button>
        <button type="button" class="filter-button dark">⚫ Filtrar por estado</button>
      </section>

      <h1 class="page-title">Administra los jugadores registrados en el reino</h1>

      <section class="content-grid">
        <!-- Tabla de jugadores -->
        <div class="players-card">
          <div class="players-table-head">
            <span>Usuario</span>
            <span>Nivel</span>
            <span>Monedas</span>
            <span>Gemas</span>
            <span>País</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>

          <button
            v-for="user in filteredUsers"
            :key="user.id"
            type="button"
            class="players-table-row"
            :class="{ active: selectedId === user.id }"
            @click="selectedId = user.id"
          >
            <div class="user-cell">
              <img :src="user.avatar" :alt="user.name" class="user-avatar" />
              <div class="user-meta">
                <strong>{{ user.name }}</strong>
                <span>{{ user.username }}</span>
              </div>
            </div>

            <div class="level-cell">
              <span class="level-badge">{{ user.level }}</span>
            </div>

            <div class="coins-cell">
              <span class="coin-ico">🪙</span>
              {{ user.coins }}
            </div>

            <div class="gems-cell">
              <span class="gem-ico">💎</span>
              {{ user.gems }}
            </div>

            <div class="country-cell">
              <span class="flag">{{ user.countryFlag }}</span>
            </div>

            <div class="status-cell">
              <span
                class="status-dot"
                :class="user.status === 'Conectado' ? 'online' : 'offline'"
              ></span>
              {{ user.status }}
            </div>

            <div class="action-cell">
              <span class="action-menu">⋯</span>
            </div>
          </button>
        </div>

        <!-- Panel lateral del jugador seleccionado -->
        <aside v-if="selected" class="profile-panel">
          <img :src="selected.avatar" :alt="selected.name" class="profile-avatar" />
          <p class="profile-name">Nombre: {{ selected.name }}</p>
          <p class="profile-xp">Experiencia: {{ selected.xp }} Xp</p>
          <div class="xp-bar" aria-hidden="true">
            <div class="xp-fill" :style="{ width: selected.xpPercent + '%' }"></div>
          </div>

          <ul class="profile-stats">
            <li>
              <span>🏆 Partidas Jugadas</span>
              <strong>{{ selected.matches }}</strong>
            </li>
            <li>
              <span>🥇 Victorias</span>
              <strong>{{ selected.wins }}</strong>
            </li>
            <li>
              <span>📊 Win Rate</span>
              <strong>{{ selected.winRate }}%</strong>
            </li>
          </ul>

          <div class="profile-meta">
            <p>Se unió el: {{ selected.joined }}</p>
            <p>Conexión: {{ selected.lastOnline }}</p>
            <p>Nivel: {{ selected.level }}</p>
          </div>

          <div class="currency-boxes">
            <div class="currency-box gold">
              <span>🪙</span>
              <div>
                <strong>{{ selected.coins }}</strong>
                <small>MONEDAS</small>
              </div>
            </div>
            <div class="currency-box blue">
              <span>💎</span>
              <div>
                <strong>{{ selected.gems }}</strong>
                <small>DIAMANTES</small>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { ConsultarAdmin } from '@/application/ConsultarAdmin'
import { ApiAdminCliente } from '@/infrastructure/ApiAdminCliente'
import avMessi from '@/assets/img/avatars/user-messironaldo107.png'
import avMimami from '@/assets/img/avatars/user-mimami456.png'
import avDonpollo from '@/assets/img/avatars/user-donpollo67.png'
import avNoob from '@/assets/img/avatars/user-noobmaster69.png'
import avDavo from '@/assets/img/avatars/user-davoxeneixe.png'
import avJhonb from '@/assets/img/avatars/user-jhonblacked.png'
import avHomla from '@/assets/img/avatars/user-homladereff.png'
import avEso from '@/assets/img/avatars/user-esotilnxd.png'
import avArenis from '@/assets/img/avatars/user-jhon-arenis.png'

const AVATARES = [avMessi, avMimami, avDonpollo, avNoob, avDavo, avJhonb, avHomla, avEso, avArenis]

type User = {
  id: string
  name: string
  username: string
  level: number
  coins: number
  gems: number
  countryFlag: string
  status: 'Conectado' | 'Desconectado'
  avatar: string
  xp: number
  xpPercent: number
  matches: string
  wins: string
  winRate: number
  joined: string
  lastOnline: string
}

const query = ref('')
const selectedId = ref('')
const users = ref<User[]>([])

onMounted(async () => {
  try {
    const lista = await new ConsultarAdmin(new ApiAdminCliente()).usuarios()
    users.value = lista.map((u, i) => {
      const completed = u.completed?.length ?? 0
      const matches = u.partidas ?? 0
      const wins = u.wins ?? 0
      return {
        id: u.id,
        name: u.nombre,
        username: u.correo,
        level: Math.max(1, completed),
        coins: u.coins,
        gems: u.diamonds,
        countryFlag: u.rol === 'administrador' ? '🛡️' : '🎮',
        status: 'Conectado',
        avatar: AVATARES[i % AVATARES.length] ?? avMessi,
        xp: completed * 100,
        xpPercent: Math.round((completed / 10) * 100),
        matches: String(matches),
        wins: String(wins),
        winRate: matches > 0 ? Math.round((wins / matches) * 100) : 0,
        joined: new Date(u.creadoEn).toLocaleDateString('es-CO'),
        lastOnline: u.rol,
      }
    })
    if (users.value[0]) selectedId.value = users.value[0].id
  } catch {
    users.value = []
  }
})

const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
  )
})

const selected = computed(() => users.value.find((u) => u.id === selectedId.value) ?? users.value[0])
</script>

<style scoped>
.users-wrapper {
  display: flex;
  min-height: 100vh;
  background: url('../assets/img/fondo.png') center center / cover no-repeat;
}

.users-main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  display: flex;
  min-width: 260px;
  max-width: 420px;
  background: rgba(15, 55, 90, 0.75);
  border: 1px solid rgba(0, 195, 255, 0.28);
  border-radius: 999px;
  overflow: hidden;
}

.search-input input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 18px;
  color: #e8f8ff;
  font-size: 14px;
  outline: none;
}

.search-input input::placeholder {
  color: rgba(200, 230, 255, 0.55);
}

.search-input button {
  border: none;
  width: 48px;
  background: transparent;
  color: #9fd4ff;
  cursor: pointer;
  font-size: 1rem;
}

.filter-button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  background: rgba(20, 70, 110, 0.8);
  color: #e8f8ff;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;
}

.filter-button.dark {
  background: rgba(10, 30, 50, 0.9);
  border: 1px solid rgba(0, 195, 255, 0.2);
}

.page-title {
  margin: 4px 0 8px;
  color: #eef6ff;
  font-size: clamp(1.1rem, 2vw, 1.45rem);
  font-weight: 600;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  align-items: start;
  flex: 1;
}

.players-card {
  background: rgba(5, 25, 70, 0.72);
  border: 2px solid rgba(0, 195, 255, 0.35);
  border-radius: 18px;
  padding: 14px 16px 10px;
  box-shadow: 0 0 28px rgba(0, 160, 255, 0.12);
  overflow: auto;
}

.players-table-head,
.players-table-row {
  display: grid;
  grid-template-columns: 2.4fr 0.7fr 1fr 0.9fr 0.7fr 1.2fr 0.7fr;
  gap: 8px;
  align-items: center;
  padding: 10px 6px;
  width: 100%;
  box-sizing: border-box;
}

.players-table-head {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #9fd4ff;
  font-size: 12px;
  font-weight: 800;
  text-transform: none;
  letter-spacing: 0.3px;
}

.players-table-row {
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: transparent;
  color: #eaf4ff;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.players-table-row:hover,
.players-table-row.active {
  background: rgba(0, 120, 200, 0.14);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center center;
  flex-shrink: 0;
  border: 2px solid rgba(0, 195, 255, 0.45);
  background: rgba(0, 0, 0, 0.45);
  display: block;
}

.user-meta {
  min-width: 0;
}

.user-meta strong {
  display: block;
  font-size: 13px;
  color: #f7fdff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta span {
  display: block;
  color: #8ec4ef;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-cell {
  display: flex;
  justify-content: center;
}

.level-badge {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(0, 195, 255, 0.25);
  font-weight: 800;
  font-size: 12px;
  color: #e8f7ff;
}

.coins-cell,
.gems-cell {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.flag {
  font-size: 1.25rem;
  line-height: 1;
}

.country-cell {
  text-align: center;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  white-space: nowrap;
}

.status-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.online {
  background: #40ff7f;
  box-shadow: 0 0 8px rgba(64, 255, 127, 0.5);
}

.status-dot.offline {
  background: #ff4d4d;
  box-shadow: 0 0 8px rgba(255, 77, 77, 0.5);
}

.action-cell {
  display: flex;
  justify-content: center;
}

.action-menu {
  width: 32px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 40, 80, 0.85);
  border: 1px solid rgba(0, 195, 255, 0.2);
  color: #cfe8ff;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

/* Panel derecho */
.profile-panel {
  background: rgba(5, 20, 50, 0.85);
  border: 1px solid rgba(0, 195, 255, 0.25);
  border-radius: 16px;
  padding: 22px 18px;
  box-shadow: 0 0 24px rgba(0, 140, 255, 0.1);
}

.profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center center;
  display: block;
  margin: 0 auto 14px;
  border: 3px solid rgba(0, 195, 255, 0.45);
  background: rgba(0, 0, 0, 0.45);
  box-shadow: 0 0 16px rgba(0, 160, 255, 0.3);
}

.profile-name {
  margin: 0 0 6px;
  text-align: center;
  color: #f4fbff;
  font-size: 14px;
  font-weight: 700;
}

.profile-xp {
  margin: 0 0 8px;
  text-align: center;
  color: #e8c86a;
  font-size: 12px;
  font-weight: 600;
}

.xp-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  margin-bottom: 16px;
}

.xp-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #c9a227, #f0d060);
}

.profile-stats {
  list-style: none;
  margin: 0 0 14px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  gap: 10px;
}

.profile-stats li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #d8ecff;
  font-size: 12px;
}

.profile-stats strong {
  color: #fff;
}

.profile-meta {
  margin-bottom: 14px;
  display: grid;
  gap: 6px;
  color: #a8d0f0;
  font-size: 12px;
}

.profile-meta p {
  margin: 0;
}

.currency-boxes {
  display: flex;
  gap: 10px;
}

.currency-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: #1e3a8a;
  box-shadow: 0 3px 0 #12255a;
}

.currency-box strong {
  display: block;
  color: #fff;
  font-size: 13px;
}

.currency-box small {
  color: rgba(220, 230, 255, 0.8);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4px;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .profile-panel {
    max-width: 360px;
  }
}
</style>
