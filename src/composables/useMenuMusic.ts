import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { watch } from 'vue'
import menuTheme from '@/assets/audio/menu-theme.mp3'
import { useAudioStore } from '@/stores/audio'

const RUTA_NIVEL = /^\/level\d+$/

export function installMenuMusic(router: Router, pinia: Pinia) {
  const store = useAudioStore(pinia)

  const audio = new Audio(menuTheme)
  audio.loop = true
  audio.preload = 'auto'

  let enNivel = false
  let interactuo = false

  const aplicarVolumen = () => {
    audio.volume = Math.min(1, Math.max(0, store.volume / 100))
  }
  aplicarVolumen()
  watch(() => store.volume, aplicarVolumen)

  const sincronizar = () => {
    if (enNivel) {
      audio.pause()
      return
    }
    if (!interactuo) return
    if (audio.paused) {
      void audio.play().catch(() => {
        /* autoplay bloqueado hasta la primera interacción */
      })
    }
  }

  const marcarInteraccion = () => {
    interactuo = true
    window.removeEventListener('pointerdown', marcarInteraccion)
    window.removeEventListener('keydown', marcarInteraccion)
    sincronizar()
  }
  window.addEventListener('pointerdown', marcarInteraccion)
  window.addEventListener('keydown', marcarInteraccion)

  router.afterEach((to) => {
    enNivel = RUTA_NIVEL.test(to.path)
    sincronizar()
  })
}
