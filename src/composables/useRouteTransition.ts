import { computed, nextTick, ref } from 'vue'
import type { Router } from 'vue-router'
import { DificultadNivel } from '../domain/bots/DificultadNivel'
import type { ControlMusicaNavegacion } from './useMenuMusic'

const DURACION_MINIMA_MS = 3000
const DURACION_SALIDA_CARGA_MS = 250
const visible = ref(false)
const progreso = ref(0)
const rutaActual = ref('')
let timer: number | undefined

const destinosLobby = new Set([
  '/lobby',
  '/online',
  '/cazar-dragones',
  '/levels',
  '/inventory',
  '/store',
  '/achivements',
])

const temasNivel: Record<number, { nombre: string; senda: string; ambiente: string }> = {
  1: { nombre: 'El umbral del bosque', senda: 'Aprendiz', ambiente: 'Las primeras luces despiertan entre árboles antiguos.' },
  2: { nombre: 'La senda de ceniza', senda: 'Aprendiz', ambiente: 'Una ruta de piedra enseña a leer las señales del destino.' },
  3: { nombre: 'Las ruinas veladas', senda: 'Iniciado', ambiente: 'Ecos de una ciudad olvidada acompañan cada número.' },
  4: { nombre: 'El salón de los espejos', senda: 'Iniciado', ambiente: 'Dos cartones aguardan bajo arcos cubiertos de runas.' },
  5: { nombre: 'La cripta carmesí', senda: 'Aventurero', ambiente: 'Antiguos sellos se encienden al abrirse el portal.' },
  6: { nombre: 'La fortaleza lunar', senda: 'Aventurero', ambiente: 'La luna ilumina una prueba de reflejos y paciencia.' },
  7: { nombre: 'El abismo de obsidiana', senda: 'Veterano', ambiente: 'Los rivales reaccionan con rapidez en la oscuridad.' },
  8: { nombre: 'La torre del eclipse', senda: 'Veterano', ambiente: 'Dos cartones y patrones cambiantes ponen a prueba tu temple.' },
  9: { nombre: 'El reino de las sombras', senda: 'Veterano', ambiente: 'La última senda antes del desafío definitivo.' },
  10: { nombre: 'El trono de las cenizas', senda: 'Pesadilla', ambiente: 'Tres fases finales y Malgrath, Rey de las Cenizas, te esperan.' },
}

export interface DatosCarga {
  titulo: string
  subtitulo: string
  detalle: string
  dificultad: string
  nivel: number | null
}

function destinoConCarga(path: string): boolean {
  return destinosLobby.has(path) || /^\/level(?:[1-9]|10)$/.test(path)
}

function datosPara(path: string): DatosCarga {
  const match = /^\/level(\d+)$/.exec(path)
  if (match) {
    const nivel = Number(match[1])
    const tema = temasNivel[nivel]
    const dificultad = DificultadNivel.paraNivel(nivel)
    return {
      titulo: tema?.nombre ?? `Nivel ${nivel}`,
      subtitulo: `Nivel ${nivel} · ${tema?.senda ?? 'Aventura'}`,
      detalle: tema?.ambiente ?? 'El siguiente desafío se prepara tras el umbral.',
      dificultad: `Dificultad ${nivel <= 3 ? 'inicial' : nivel <= 6 ? 'media' : nivel < 10 ? 'alta' : 'extrema'} · reacción rival ${Math.round(dificultad.baseReactionMs / 100) / 10}s`,
      nivel,
    }
  }
  const pantallas: Record<string, DatosCarga> = {
    '/lobby': { titulo: 'El refugio', subtitulo: 'Regreso al lobby', detalle: 'Las monedas, los cristales y tus aventuras vuelven a estar a la vista.', dificultad: 'Refugio', nivel: null },
    '/online': { titulo: 'La arena de los destinos', subtitulo: 'Bingo online', detalle: 'Se prepara la sala y se reúnen los jugadores.', dificultad: 'Encuentro', nivel: null },
    '/cazar-dragones': { titulo: 'La cacería', subtitulo: 'Cazar dragones', detalle: 'La senda de caza se abre entre sombras y fuego.', dificultad: 'Desafío', nivel: null },
    '/levels': { titulo: 'El mapa de las sendas', subtitulo: 'Selección de nivel', detalle: 'Se revelan las rutas que ya puedes recorrer.', dificultad: 'Aventura', nivel: null },
    '/inventory': { titulo: 'La cámara de reliquias', subtitulo: 'Inventario', detalle: 'Tus objetos y poderes regresan a la cámara.', dificultad: 'Refugio', nivel: null },
    '/store': { titulo: 'El mercado encantado', subtitulo: 'Tienda', detalle: 'Los mercaderes preparan sus ofertas.', dificultad: 'Refugio', nivel: null },
    '/achivements': { titulo: 'El archivo de hazañas', subtitulo: 'Logros', detalle: 'Tus victorias y recuerdos toman forma.', dificultad: 'Refugio', nivel: null },
  }
  return pantallas[path] ?? pantallas['/lobby']!
}

const datosCarga = computed(() => datosPara(rutaActual.value))

export function useRouteTransition() {
  return { cargandoRuta: visible, progresoRuta: progreso, datosCarga }
}

export function installRouteTransition(
  router: Router,
  musica: ControlMusicaNavegacion,
): void {
  let generacion = 0
  let inicio = 0

  router.beforeEach((to, from) => {
    generacion += 1
    if (timer !== undefined) window.clearInterval(timer)
    inicio = performance.now()
    rutaActual.value = to.path
    // La primera navegación del router sucede tanto al abrir como al recargar
    // la página. En ese caso no hay transición entre interfaces que mostrar.
    visible.value = from.matched.length > 0 && destinoConCarga(to.path)
    progreso.value = 0
    if (visible.value) {
      musica.pausarParaTransicion()
      timer = window.setInterval(() => {
        const transcurrido = performance.now() - inicio
        // Llega gradualmente al 90%; el último tramo espera a que la ruta y el audio estén listos.
        progreso.value = Math.min(90, Math.round((transcurrido / DURACION_MINIMA_MS) * 90))
      }, 45)
    }
    return true
  })

  router.afterEach(async (to, _from, failure) => {
    const actual = generacion
    const horaInicio = inicio
    const mostrarCargador = visible.value
    if (mostrarCargador) {
      const restante = Math.max(0, DURACION_MINIMA_MS - (performance.now() - horaInicio))
      if (restante > 0) await new Promise<void>((resolve) => window.setTimeout(resolve, restante))
      await nextTick()
      if (actual !== generacion) return
      if (timer !== undefined) window.clearInterval(timer)
      progreso.value = 100
      await new Promise<void>((resolve) => window.setTimeout(resolve, 180))
      visible.value = false
      progreso.value = 0
      // Espera a que termine el fundido de salida del overlay antes de iniciar audio.
      await new Promise<void>((resolve) => window.setTimeout(resolve, DURACION_SALIDA_CARGA_MS))
    }
    if (actual !== generacion) return
    await nextTick()
    await musica.preparar(failure ? _from.path : to.path).catch(() => undefined)
  })

  router.onError(() => {
    generacion += 1
    if (timer !== undefined) window.clearInterval(timer)
    visible.value = false
    progreso.value = 0
    const rutaActual = router.currentRoute.value.path
    window.setTimeout(() => void musica.preparar(rutaActual).catch(() => undefined), DURACION_SALIDA_CARGA_MS)
  })
}
