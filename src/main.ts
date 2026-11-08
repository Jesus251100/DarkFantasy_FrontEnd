import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installPreventLevelReload } from './composables/usePreventLevelReload'
import { installMenuMusic } from './composables/useMenuMusic'
import { installRouteTransition } from './composables/useRouteTransition'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Música por interfaz y cortina breve de transición entre rutas
const musica = installMenuMusic(pinia)
installRouteTransition(router, musica)

// En niveles: bloquear F5/Ctrl+R y mostrar overlay custom (sin diálogo del navegador)
installPreventLevelReload(router)

app.mount('#app')
