import type { Router } from 'vue-router'

const LEVEL_PATH = /^\/level(10|[1-9])\/?$/i

/** Evento para mostrar el overlay custom (sin diálogo nativo del navegador). */
export const RELOAD_BLOCKED_EVENT = 'df:reload-blocked'

function isLevelPath(path: string): boolean {
  const clean = (path || '').split('?')[0]?.split('#')[0] ?? ''
  return LEVEL_PATH.test(clean)
}

function notifyReloadBlocked() {
  window.dispatchEvent(new CustomEvent(RELOAD_BLOCKED_EVENT))
}

/**
 * En rutas de nivel bloquea F5 / Ctrl+R / Cmd+R y dispara un overlay custom.
 * NO usa beforeunload (evita el diálogo “¿Volver a cargar sitio?”).
 */
export function installPreventLevelReload(router: Router): void {
  let active = false

  function onKeyDown(e: KeyboardEvent) {
    if (!active) return

    const key = e.key
    const isF5 = key === 'F5'
    const isCtrlR = (e.ctrlKey || e.metaKey) && (key === 'r' || key === 'R')

    if (isF5 || isCtrlR) {
      e.preventDefault()
      e.stopPropagation()
      notifyReloadBlocked()
    }
  }

  function enable() {
    if (active) return
    active = true
    window.addEventListener('keydown', onKeyDown, true)
  }

  function disable() {
    if (!active) return
    active = false
    window.removeEventListener('keydown', onKeyDown, true)
  }

  function sync(path: string) {
    if (isLevelPath(path)) enable()
    else disable()
  }

  sync(router.currentRoute.value.path)

  router.afterEach((to) => {
    sync(to.path)
  })
}
