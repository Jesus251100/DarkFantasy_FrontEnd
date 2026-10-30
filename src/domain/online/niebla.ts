import type { BingoCell } from '../bingo/tipos'

/**
 * Casillas de este cartón cuyo número ya cantó la balotera.
 * No importa si esa casilla forma parte del método de victoria.
 */
export function casillasCantadas(celdas: BingoCell[], cantadas: number[]): number[] {
  const dichas = new Set(cantadas)
  const indices: number[] = []
  celdas.forEach((celda, indice) => {
    if (!celda.free && dichas.has(celda.number)) indices.push(indice)
  })
  return indices
}

/** Elige `cantidad` índices distintos. `azar` devuelve un número entre 0 y 1. */
export function elegirCasillasNiebla(
  disponibles: number[],
  cantidad: number,
  azar: () => number = Math.random,
): number[] {
  const copia = [...disponibles]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    const actual = copia[i]
    copia[i] = copia[j] as number
    copia[j] = actual as number
  }
  return copia.slice(0, cantidad)
}

export function esNumeroCorrecto(escrito: string, numero: number): boolean {
  const texto = escrito.trim()
  if (!/^\d+$/.test(texto)) return false
  return Number(texto) === numero
}

/** La niebla completa entra cuando la figura va por la mitad, sin contar el centro gratis. */
export const UMBRAL_PROGRESO_NIEBLA = 0.5

function celdasUtiles(celdas: BingoCell[], figura: number[]): number[] {
  return figura.filter((indice) => {
    const celda = celdas[indice]
    return Boolean(celda && !celda.free)
  })
}

/**
 * Avance de la mejor figura del método (fila, columna, diagonal…).
 * Solo cuentan las casillas que el jugador marcó. El centro gratis no suma.
 * El resultado va de 0 a 1.
 */
export function progresoDeFigura(celdas: BingoCell[], figuras: number[][]): number {
  let mejor = 0
  for (const figura of figuras) {
    const utiles = celdasUtiles(celdas, figura)
    if (utiles.length === 0) continue
    const hechas = utiles.filter((indice) => celdas[indice]?.marked).length
    mejor = Math.max(mejor, hechas / utiles.length)
  }
  return mejor
}

/**
 * Una casilla marcada de la figura que más avance lleva.
 * No devuelve el centro gratis. `evitar` se salta si hay otra opción.
 */
export function casillaDeProgreso(
  celdas: BingoCell[],
  figuras: number[][],
  evitar: number[] = [],
): number | null {
  let mejor: number[] | null = null
  let mejorRatio = -1
  for (const figura of figuras) {
    if (figura.length === 0) continue
    const utiles = celdasUtiles(celdas, figura)
    const marcadas = utiles.filter((indice) => celdas[indice]?.marked)
    if (marcadas.length === 0 || utiles.length === 0) continue
    const ratio = marcadas.length / utiles.length
    if (ratio > mejorRatio) {
      mejorRatio = ratio
      mejor = marcadas
    }
  }
  if (!mejor) return null
  const fuera = new Set(evitar)
  const visibles = mejor.filter((indice) => !fuera.has(indice))
  const candidatas = visibles.length > 0 ? visibles : mejor
  return candidatas[candidatas.length - 1] ?? null
}

/** Niebla que va subiendo antes del evento completo. */
export interface SubidaNiebla {
  opacidad: number
  seguidos: number
  aparecio: boolean
  esperaDos: boolean
  bolasCerradas: number
}

export function subidaInicial(): SubidaNiebla {
  return { opacidad: 0, seguidos: 0, aparecio: false, esperaDos: false, bolasCerradas: 0 }
}

function subir(estado: SubidaNiebla): SubidaNiebla {
  return {
    ...estado,
    seguidos: 0,
    esperaDos: false,
    opacidad: Math.min(100, estado.opacidad + 20),
  }
}

/**
 * Una balota que el jugador no marcó.
 * Antes de la niebla hacen falta 5 seguidas para que aparezca al 20%.
 * Ya visible, cada una la espesa 20%.
 * Justo después de una marca, la primera balota fuera del cartón no cambia el espesor.
 * La segunda devuelve el 20% y desde ahí cada balota sin marcar suma otro 20%.
 * Si en esa pausa sale un número del cartón y no se marca, se espesa en esa balota.
 */
function aplicarFallo(estado: SubidaNiebla, enCarton: boolean): SubidaNiebla {
  if (!estado.aparecio) {
    const seguidos = estado.seguidos + 1
    if (seguidos < 5) return { ...estado, seguidos }
    return { ...estado, seguidos: 0, aparecio: true, opacidad: 20, esperaDos: false }
  }
  if (estado.esperaDos && !enCarton) {
    const seguidos = estado.seguidos + 1
    if (seguidos < 2) return { ...estado, seguidos }
    return subir(estado)
  }
  return subir(estado)
}

/**
 * Cierra una balota ya pasada.
 * Si estaba en el cartón y el jugador la marcó, no espesa la niebla.
 */
export function cerrarBola(estado: SubidaNiebla, enCarton: boolean, marcada: boolean): SubidaNiebla {
  const siguiente = { ...estado, bolasCerradas: estado.bolasCerradas + 1 }
  if (enCarton && marcada) {
    if (!estado.aparecio) return { ...siguiente, seguidos: 0 }
    return siguiente
  }
  return aplicarFallo(siguiente, enCarton)
}

/** El jugador marcó un número de su cartón. La niebla baja 20% y espera dos balotas. */
export function marcarBajoNiebla(estado: SubidaNiebla): SubidaNiebla {
  if (!estado.aparecio) return { ...estado, seguidos: 0 }
  return {
    ...estado,
    seguidos: 0,
    esperaDos: true,
    opacidad: Math.max(0, estado.opacidad - 20),
  }
}

/** Asienta todas las balotas menos la última: esa todavía se puede marcar. */
export function sincronizarSubida(estado: SubidaNiebla, celdas: BingoCell[], cantadas: number[]): SubidaNiebla {
  let actual = estado
  const hasta = Math.max(0, cantadas.length - 1)
  for (let i = actual.bolasCerradas; i < hasta; i++) {
    const numero = cantadas[i]
    const celda = celdas.find((item) => !item.free && item.number === numero)
    actual = cerrarBola(actual, Boolean(celda), Boolean(celda?.marked))
  }
  return actual
}
