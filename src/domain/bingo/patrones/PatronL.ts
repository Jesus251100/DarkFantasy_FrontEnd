import { lShapeIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronL extends PatronBase {
  readonly id: WinMode = 'L'
  nombre() {
    return 'Forma L'
  }
  indices(tamano: number) {
    return lShapeIndices(tamano)
  }
}
