import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installPreventLevelReload } from './composables/usePreventLevelReload'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// En niveles: bloquear F5/Ctrl+R y mostrar overlay custom (sin diálogo del navegador)
installPreventLevelReload(router)

app.mount('#app')
