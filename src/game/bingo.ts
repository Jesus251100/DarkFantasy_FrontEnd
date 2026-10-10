/**
 * Fachada de compatibilidad.
 * La lógica vive en src/domain (clases POO). Este archivo reexporta
 * la API que ya usan vistas y composables.
 */
import { Carton, generarValoresAleatorios } from '../domain/bingo/Carton'
import {
  arrowIndices,
  columnIndices,
  crownIndices,
  diagonalIndices,
  diamondIndices,
  fullCardIndices,
  hShapeIndices,
  lShapeIndices,
  oShapeIndices,
  plusIndices,
  rowIndices,
  shuffleInPlace,
  tShapeIndices,
  xShapeIndices,
  zigzagIndices,
} from '../domain/bingo/geometria'
import { patronesDesdeModos } from '../domain/bingo/patrones/catalogoPatrones'
import type { BingoCell, CardValue, WinMode, WinResult } from '../domain/bingo/tipos'

export type { WinMode, CardValue, BingoCell, WinResult }

export interface BingoGameConfig {
  size: number
  numbers?: CardValue[]
  cards?: CardValue[][]
  randomCardCount?: number
  maxNumber?: number
  winModes: WinMode[]
  ballPool?: number[]
  drawIntervalMs?: number
  methodLabel?: string
}

export {
  rowIndices,
  columnIndices,
  diagonalIndices,
  lShapeIndices,
  oShapeIndices,
  plusIndices,
  tShapeIndices,
  arrowIndices,
  hShapeIndices,
  zigzagIndices,
  xShapeIndices,
  diamondIndices,
  fullCardIndices,
  crownIndices,
  shuffleInPlace,
}

export function resolveMaxNumber(config: BingoGameConfig): number {
  if (config.maxNumber && config.maxNumber > 0) return config.maxNumber
  if (config.ballPool && config.ballPool.length > 0) {
    return Math.max(...config.ballPool)
  }
  return config.size * config.size
}

export function generateRandomCard(size: number, maxNumber: number): CardValue[] {
  return generarValoresAleatorios(size, maxNumber)
}

export function generateRandomCards(
  size: number,
  maxNumber: number,
  count: number,
): CardValue[][] {
  const n = Math.max(1, Math.round(count))
  return Array.from({ length: n }, () => generateRandomCard(size, maxNumber))
}

export function resolveCardLayouts(config: BingoGameConfig): CardValue[][] {
  if (config.randomCardCount && config.randomCardCount > 0) {
    return generateRandomCards(config.size, resolveMaxNumber(config), config.randomCardCount)
  }
  if (config.cards && config.cards.length > 0) return config.cards
  if (config.numbers && config.numbers.length > 0) return [config.numbers]
  throw new Error('BingoGameConfig requiere `numbers`, `cards` o `randomCardCount`.')
}

export function createCard(values: CardValue[]): BingoCell[] {
  return Carton.desdeValores(values).toSnapshot()
}

export function createCards(layouts: CardValue[][]): BingoCell[][] {
  return layouts.map((values) => createCard(values))
}

export function getPatternsForModes(
  size: number,
  modes: WinMode[],
): { mode: WinMode; indices: number[] }[] {
  const patterns: { mode: WinMode; indices: number[] }[] = []
  for (const patron of patronesDesdeModos(modes)) {
    for (const indices of patron.indices(size)) {
      patterns.push({ mode: patron.id, indices })
    }
  }
  return patterns
}

export function checkWin(
  card: BingoCell[],
  size: number,
  winModes: WinMode[],
  calledNumbers: ReadonlySet<number>,
): WinResult {
  const carton = Carton.desdeSnapshot(card, size)
  return carton.evaluarVictoria(patronesDesdeModos(winModes), calledNumbers)
}

export function numericCardValues(layouts: CardValue[][]): number[] {
  const nums: number[] = []
  for (const layout of layouts) {
    for (const v of layout) {
      if (v !== 'free') nums.push(v)
    }
  }
  return nums
}

export function defaultBallPool(cardNumbers: number[]): number[] {
  const max = Math.max(...cardNumbers, 1)
  return Array.from({ length: max }, (_, i) => i + 1)
}

export function buildShuffledPool(config: BingoGameConfig): number[] {
  if (config.ballPool && config.ballPool.length > 0) {
    return shuffleInPlace([...config.ballPool])
  }
  const max = resolveMaxNumber(config)
  return shuffleInPlace(Array.from({ length: max }, (_, i) => i + 1))
}

export const BALL_POOL_35 = Array.from({ length: 35 }, (_, i) => i + 1)
export const BALL_POOL_50 = Array.from({ length: 50 }, (_, i) => i + 1)
export const BALL_POOL_75 = Array.from({ length: 75 }, (_, i) => i + 1)
export const BALL_POOL_90 = Array.from({ length: 90 }, (_, i) => i + 1)

/** @deprecated Cartones fijos de referencia; el juego usa cartones aleatorios. */
export const LEVEL5_5X5: CardValue[] = [
  3, 18, 36, 59, 68, 7, 21, 33, 46, 69, 10, 19, 'free', 52, 73, 13, 23, 34, 47, 61, 5, 28, 38, 48, 62,
]
export const LEVEL6_5X5: CardValue[] = [
  1, 16, 32, 54, 71, 9, 24, 41, 50, 66, 14, 27, 'free', 55, 70, 4, 20, 39, 49, 64, 11, 29, 43, 58, 75,
]
export const LEVEL7_5X5: CardValue[] = [
  2, 17, 35, 51, 72, 8, 22, 40, 53, 67, 12, 26, 'free', 56, 74, 6, 25, 37, 45, 63, 15, 30, 42, 57, 65,
]
export const LEVEL8_5X5_A: CardValue[] = [
  4, 19, 31, 48, 70, 9, 23, 38, 52, 67, 11, 28, 'free', 58, 73, 2, 16, 36, 50, 64, 14, 27, 44, 61, 75,
]
export const LEVEL8_5X5_B: CardValue[] = [
  1, 20, 34, 55, 69, 7, 25, 40, 47, 66, 13, 21, 'free', 59, 72, 5, 18, 33, 46, 63, 10, 29, 41, 54, 71,
]
export const LEVEL9_5X5_A: CardValue[] = [
  6, 15, 37, 49, 68, 3, 22, 32, 56, 74, 12, 24, 'free', 51, 65, 8, 27, 43, 57, 70, 16, 30, 39, 60, 75,
]
export const LEVEL9_5X5_B: CardValue[] = [
  2, 18, 35, 53, 71, 9, 26, 42, 48, 66, 14, 19, 'free', 55, 69, 4, 23, 31, 50, 64, 11, 28, 45, 58, 73,
]
export const LEVEL10_5X5_A: CardValue[] = [
  5, 17, 33, 52, 70, 8, 24, 39, 46, 67, 13, 21, 'free', 54, 72, 1, 29, 36, 59, 63, 10, 25, 44, 48, 75,
]
export const LEVEL10_5X5_B: CardValue[] = [
  3, 16, 38, 50, 69, 7, 22, 34, 57, 74, 12, 27, 'free', 49, 65, 6, 20, 41, 56, 71, 15, 30, 40, 61, 73,
]
export const LEVEL10_5X5_C: CardValue[] = [
  4, 19, 32, 53, 68, 9, 23, 37, 47, 66, 14, 26, 'free', 58, 72, 2, 18, 43, 51, 64, 11, 28, 35, 60, 75,
]
export const LEVEL10_6X6: CardValue[] = [
  1, 17, 34, 47, 61, 76, 2, 20, 35, 51, 62, 77, 3, 22, 36, 53, 63, 80, 5, 23, 41, 55, 64, 86, 11, 26, 42,
  57, 68, 89, 15, 30, 44, 59, 74, 90,
]

export const STANDARD_5X5 = LEVEL5_5X5
export const STANDARD_5X5_B = LEVEL6_5X5
export const STANDARD_5X5_C = LEVEL7_5X5
