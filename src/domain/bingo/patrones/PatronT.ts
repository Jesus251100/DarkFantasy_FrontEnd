import { tShapeIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronT extends PatronBase {
  readonly id: WinMode = 'T'
  nombre() {
    return 'Forma T'
  }
  indices(tamano: number) {
    return tShapeIndices(tamano)
  }
}
