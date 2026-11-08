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

/** La niebla completa entra cuando la figura alcanza 60%, sin contar el centro gratis. */
export const UMBRAL_PROGRESO_NIEBLA = 0.6

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

