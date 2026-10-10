/**
 * Fachada de compatibilidad sobre las clases Bot (dominio).
 */
import { Carton } from '../domain/bingo/Carton'
import { patronesDesdeModos } from '../domain/bingo/patrones/catalogoPatrones'
import { checkWin, generateRandomCard, type BingoCell, type CardValue, type WinMode } from './bingo'
import { DificultadNivel } from '../domain/bots/DificultadNivel'
import type { BotId, BotRuntime, LadoBot } from '../domain/bots/Bot'
import { FabricaBots } from '../domain/bots/FabricaBots'

export type { BotId, BotRuntime }
export type { LadoBot }

export interface BotDefinition {
  id: BotId
  name: string
  speedMult: number
  missMult: number
  side: 'left' | 'right'
}

export const BOT_ROSTER: BotDefinition[] = FabricaBots.roster(3, 35).map((b) => ({
  id: b.id,
  name: b.nombre,
  speedMult: b.multVelocidad,
  missMult: b.multFallo,
  side: b.lado,
}))

export interface LevelDifficulty {
  baseReactionMs: number
  reactionJitterMs: number
  missChance: number
  smartTargeting: boolean
}

export function difficultyForLevel(level: number): LevelDifficulty {
  const d = DificultadNivel.paraNivel(level)
  return {
    baseReactionMs: d.baseReactionMs,
    reactionJitterMs: d.reactionJitterMs,
    missChance: d.missChance,
    smartTargeting: d.smartTargeting,
  }
}

export function generateBotCard(size: number, maxNumber: number): CardValue[] {
  return generateRandomCard(size, maxNumber)
}

export function createBotRuntimes(size: number, maxNumber: number): BotRuntime[] {
  return FabricaBots.roster(size, maxNumber).map((b) => b.toRuntime())
}

export function computePatternProgress(
  card: BingoCell[],
  size: number,
  winModes: WinMode[],
): number {
  return Carton.desdeSnapshot(card, size).progresoMejorPatron(patronesDesdeModos(winModes))
}

export function cellHelpsPattern(
  card: BingoCell[],
  cellIndex: number,
  size: number,
  winModes: WinMode[],
): boolean {
  return Carton.desdeSnapshot(card, size).celdaAyudaPatron(cellIndex, patronesDesdeModos(winModes))
}

export function findCellIndexByNumber(card: BingoCell[], number: number): number {
  return Carton.desdeSnapshot(card).indiceDeNumero(number)
}

export function markBotCell(card: BingoCell[], index: number): BingoCell[] {
  const carton = Carton.desdeSnapshot(card)
  carton.celdaEn(index)?.marcar()
  return carton.toSnapshot()
}

export function botCanBingo(
  card: BingoCell[],
  size: number,
  winModes: WinMode[],
  called: ReadonlySet<number>,
): boolean {
  return checkWin(card, size, winModes, called).won
}

export function reactionDelayMs(
  difficulty: LevelDifficulty,
  bot: Pick<BotRuntime, 'speedMult'>,
): number {
  return DificultadNivel.desde(difficulty).delayMs(bot.speedMult)
}

export function shouldBotMark(
  difficulty: LevelDifficulty,
  bot: Pick<BotRuntime, 'missMult'>,
  helpsPattern: boolean,
): boolean {
  return DificultadNivel.desde(difficulty).debeMarcar(bot.missMult, helpsPattern)
}

export function randomStatusAfterMark(progress: number): string {
  if (progress >= 0.99) return '¡Casi BINGO!'
  if (progress >= 0.66) return 'Muy cerca…'
  if (progress >= 0.33) return 'Marcando…'
  const lines = ['Anotado', 'Interesante…', 'Sigo el oráculo', 'Hmm…']
  return lines[Math.floor(Math.random() * lines.length)] ?? 'Marcando…'
}
