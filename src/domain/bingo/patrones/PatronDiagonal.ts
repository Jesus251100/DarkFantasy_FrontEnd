import { diagonalIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronDiagonal extends PatronBase {
  readonly id: WinMode = 'diagonal'
  nombre() {
    return 'Diagonal'
  }
  indices(tamano: number) {
    return diagonalIndices(tamano)
  }
}
