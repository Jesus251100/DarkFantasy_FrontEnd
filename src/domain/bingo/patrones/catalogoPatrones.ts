import type { WinMode } from '../tipos'
import type { IPatronVictoria } from './IPatronVictoria'
import { PatronCartonCompleto } from './PatronCartonCompleto'
import { PatronColumna } from './PatronColumna'
import { PatronCorona } from './PatronCorona'
import { PatronCruz } from './PatronCruz'
import { PatronDiagonal } from './PatronDiagonal'
import { PatronDiamante } from './PatronDiamante'
import { PatronFila } from './PatronFila'
import { PatronFlecha } from './PatronFlecha'
import { PatronH } from './PatronH'
import { PatronL } from './PatronL'
import { PatronO } from './PatronO'
import { PatronT } from './PatronT'
import { PatronX } from './PatronX'
import { PatronZigzag } from './PatronZigzag'

/** Fábrica: modo → clase. Cerrado a modificación, abierto a un case nuevo. */
const FABRICA: Record<WinMode, () => IPatronVictoria> = {
  row: () => new PatronFila(),
  column: () => new PatronColumna(),
  diagonal: () => new PatronDiagonal(),
  L: () => new PatronL(),
  O: () => new PatronO(),
  plus: () => new PatronCruz(),
  X: () => new PatronX(),
  T: () => new PatronT(),
  arrow: () => new PatronFlecha(),
  H: () => new PatronH(),
  diamond: () => new PatronDiamante(),
  zigzag: () => new PatronZigzag(),
  full: () => new PatronCartonCompleto(),
  crown: () => new PatronCorona(),
}

export function patronDesdeModo(mode: WinMode): IPatronVictoria {
  const crear = FABRICA[mode]
  if (!crear) throw new Error(`Patrón desconocido: ${mode}`)
  return crear()
}

export function patronesDesdeModos(modes: WinMode[]): IPatronVictoria[] {
  return modes.map((m) => patronDesdeModo(m))
}
