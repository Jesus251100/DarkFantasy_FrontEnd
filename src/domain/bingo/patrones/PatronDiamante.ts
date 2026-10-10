import { diamondIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronDiamante extends PatronBase {
  readonly id: WinMode = 'diamond'
  nombre() {
    return 'Diamante'
  }
  indices(tamano: number) {
    return diamondIndices(tamano)
  }
}
