import { computed, onUnmounted, ref } from 'vue'
import type { BingoCell } from '../domain/bingo/tipos'
import { casillasCantadas, elegirCasillasNiebla, esNumeroCorrecto } from '../domain/online/niebla'

export type FaseNiebla = 'idle' | 'completa' | 'saliendo' | 'casillas' | 'ganada' | 'seguida' | 'perdida'

const INTENTOS_MAX = 3
const MS_NIEBLA_COMPLETA = 5000
const MS_DESVANECER = 1600
const MS_ROJO = 2000

/**
 * Evento local de niebla. No avisa al servidor: los otros jugadores no lo ven.
 * `startFogEvent()` cubre el cartón 5 s y luego esconde 3 números ya cantados.
 * Si se acaban los intentos, no se pierde: `penalizar()` quita una casilla de la figura.
 */
export function useNieblaOnline(opciones: {
  celdas: () => BingoCell[]
  cantadas: () => number[]
  avisar: (texto: string) => void
  penalizar: () => void
}) {
  const fase = ref<FaseNiebla>('idle')
  const indices = ref<number[]>([])
  const rojas = ref<number[]>([])
  const intentos = ref(0)
  const aciertos = ref(0)
  const textos = ref<Record<number, string>>({})

  let timerCubrir: ReturnType<typeof setTimeout> | null = null
  let timerSalir: ReturnType<typeof setTimeout> | null = null
  const timersRojos = new Map<number, ReturnType<typeof setTimeout>>()

  const completa = computed(() => fase.value === 'completa' || fase.value === 'saliendo')
  const saliendo = computed(() => fase.value === 'saliendo')
  const enCasillas = computed(() => fase.value === 'casillas')
  const perdida = computed(() => fase.value === 'perdida')

  function limpiarTiempos() {
    if (timerCubrir) clearTimeout(timerCubrir)
    if (timerSalir) clearTimeout(timerSalir)
    timerCubrir = null
    timerSalir = null
    for (const timer of timersRojos.values()) clearTimeout(timer)
    timersRojos.clear()
  }

  function reiniciar() {
    limpiarTiempos()
    fase.value = 'idle'
    indices.value = []
    rojas.value = []
    intentos.value = 0
    aciertos.value = 0
    textos.value = {}
  }

  function cerrarNiebla(ganoTodas: boolean) {
    if (!ganoTodas && aciertos.value === 0) opciones.penalizar()
    indices.value = []
    rojas.value = []
    textos.value = {}
    if (ganoTodas) {
      fase.value = 'ganada'
      opciones.avisar('Recordaste los números. La niebla se fue.')
      return
    }
    fase.value = 'seguida'
    if (aciertos.value > 0) {
      opciones.avisar('Acertaste. No se quitó ninguna casilla. Las que seguían tapadas no se marcaron.')
    }
  }

  function ocuparCasillas() {
    const disponibles = casillasCantadas(opciones.celdas(), opciones.cantadas())
    if (disponibles.length < 3) {
      fase.value = 'idle'
      opciones.avisar('La niebla necesita al menos 3 números ya cantados en tu cartón.')
      return
    }
    indices.value = elegirCasillasNiebla(disponibles, 3)
    textos.value = {}
    fase.value = 'saliendo'
    timerSalir = setTimeout(() => {
      if (fase.value !== 'saliendo') return
      fase.value = 'casillas'
    }, MS_DESVANECER)
  }

  function startFogEvent(): boolean {
    if (fase.value === 'completa' || fase.value === 'saliendo' || fase.value === 'casillas') return false
    if (fase.value === 'seguida' || fase.value === 'perdida') return false
    const disponibles = casillasCantadas(opciones.celdas(), opciones.cantadas())
    if (disponibles.length < 3) {
      opciones.avisar('La niebla necesita al menos 3 números ya cantados en tu cartón.')
      return false
    }
    limpiarTiempos()
    indices.value = []
    rojas.value = []
    intentos.value = 0
    aciertos.value = 0
    textos.value = {}
    fase.value = 'completa'
    timerCubrir = setTimeout(() => {
      if (fase.value !== 'completa') return
      ocuparCasillas()
    }, MS_NIEBLA_COMPLETA)
    return true
  }

  function escribir(indice: number, valor: string) {
    if (fase.value !== 'casillas') return
    textos.value = { ...textos.value, [indice]: valor.replace(/\D/g, '').slice(0, 2) }
  }

  function marcarRoja(indice: number) {
    if (!rojas.value.includes(indice)) rojas.value = [...rojas.value, indice]
    const previo = timersRojos.get(indice)
    if (previo) clearTimeout(previo)
    timersRojos.set(
      indice,
      setTimeout(() => {
        rojas.value = rojas.value.filter((item) => item !== indice)
        timersRojos.delete(indice)
      }, MS_ROJO),
    )
  }

  function enviar(indice: number) {
    if (fase.value !== 'casillas' || !indices.value.includes(indice)) return
    const celda = opciones.celdas()[indice]
    const escrito = textos.value[indice] ?? ''
    if (!escrito.trim() || !celda) return
    if (esNumeroCorrecto(escrito, celda.number)) {
      aciertos.value += 1
      indices.value = indices.value.filter((item) => item !== indice)
      if (indices.value.length === 0) cerrarNiebla(true)
      return
    }
    intentos.value += 1
    textos.value = { ...textos.value, [indice]: '' }
    marcarRoja(indice)
    if (intentos.value >= INTENTOS_MAX) cerrarNiebla(false)
  }

  function numeroOculto(indice: number): boolean {
    if (fase.value === 'completa') return true
    return (fase.value === 'saliendo' || fase.value === 'casillas') && indices.value.includes(indice)
  }

  function bloqueaCarton(): boolean {
    return fase.value === 'completa' || fase.value === 'saliendo' || fase.value === 'perdida'
  }

  onUnmounted(limpiarTiempos)

  return {
    fase,
    indices,
    rojas,
    intentos,
    textos,
    completa,
    saliendo,
    enCasillas,
    perdida,
    startFogEvent,
    escribir,
    enviar,
    reiniciar,
    numeroOculto,
    bloqueaCarton,
  }
}
