import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installPreventLevelReload } from './composables/usePreventLevelReload'
import { installMenuMusic } from './composables/useMenuMusic'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Música del menú en todos los apartados menos en los niveles
installMenuMusic(router, pinia)

// En niveles: bloquear F5/Ctrl+R y mostrar overlay custom (sin diǭlogo del navegador)
installPreventLevelReload(router)

app.mount('#app')
