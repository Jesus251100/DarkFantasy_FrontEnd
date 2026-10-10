import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'

import HomeView from '../views/HomeView.vue'
import TipoUserView from '../views/TipoUserView.vue'
import LoginView from '../views/LoginView.vue'
import LoginAdminView from '../views/LoginAdminView.vue'
import RegisterView from '../views/RegisterView.vue'
import LobbyView from '../views/LobbyView.vue'
import InventoryView from '../views/InventoryView.vue'
import StoreView from '../views/StoreView.vue'
import LevelView from '../views/LevelView.vue'
import AchivemenstView from '../views/AchivemenstView.vue'
import ActivityRecentView from '../views/ActivityRecentView.vue'
import NewsView from '../views/NewsView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import ReportsView from '../views/ReportsView.vue'
import Level1View from '../views/Level1View.vue'
import Level2View from '../views/Level2View.vue'
import Level3View from '../views/Level3View.vue'
import Level4View from '../views/Level4View.vue'
import Level5View from '../views/Level5View.vue'
import Level6View from '../views/Level6View.vue'
import Level7View from '../views/Level7View.vue'
import Level8View from '../views/Level8View.vue'
import Level9View from '../views/Level9View.vue'
import Level10View from '../views/Level10View.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tipo-user',
      name: 'tipo-user',
      component: TipoUserView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/login-admin',
      name: 'login-admin',
      component: LoginAdminView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/lobby',
      name: 'lobby',
      component: LobbyView,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView,
    },
    {
      path: '/store',
      name: 'store',
      component: StoreView,
    },
    {
      path: '/levels',
      name: 'levels',
      component: LevelView,
    },
    {
      path: '/achivements',
      name: 'achivements',
      component: AchivemenstView,
    },
    {
      path: '/actividad-reciente',
      name: 'actividad-reciente',
      component: ActivityRecentView,
    },
    {
      path: '/news',
      name: 'news',
      component: NewsView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
    },
    {
      path: '/level1',
      name: 'level1',
      component: Level1View,
    },
    {
      path: '/level2',
      name: 'level2',
      component: Level2View,
    },
    {
      path: '/level3',
      name: 'level3',
      component: Level3View,
    },
    {
      path: '/level4',
      name: 'level4',
      component: Level4View,
    },
    {
      path: '/level5',
      name: 'level5',
      component: Level5View,
    },
    {
      path: '/level6',
      name: 'level6',
      component: Level6View,
    },
    {
      path: '/level7',
      name: 'level7',
      component: Level7View,
    },
    {
      path: '/level8',
      name: 'level8',
      component: Level8View,
    },
    {
      path: '/level9',
      name: 'level9',
      component: Level9View,
    },
    {
      path: '/level10',
      name: 'level10',
      component: Level10View,
    },
  ],
})

const rutasPrivadas = new Set([
  '/lobby',
  '/inventory',
  '/store',
  '/levels',
  '/achivements',
  '/actividad-reciente',
  '/news',
  '/dashboard',
  '/users',
  '/reports',
])

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const progress = useProgressStore()
  const privada = rutasPrivadas.has(to.path) || /^\/level\d+$/.test(to.path)
  if (privada && !auth.autenticado) {
    return { path: '/tipo-user', query: { mode: 'login' } }
  }
  if (auth.autenticado) {
    await progress.asegurarHidratado()
  }
  if (to.path.startsWith('/dashboard') || to.path === '/users' || to.path === '/reports') {
    if (auth.usuario?.rol !== 'administrador') {
      return { path: '/lobby' }
    }
  }
  const match = /^\/level(\d+)$/.exec(to.path)
  if (!match) return true
  const level = Number(match[1])
  if (!Number.isInteger(level) || level < 1 || level > 10) return true
  if (auth.usuario?.rol === 'administrador') return true
  if (!progress.isUnlocked(level)) {
    return { path: '/levels', query: { locked: String(level) } }
  }
  return true
})

export default router
