import { hShapeIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronH extends PatronBase {
  readonly id: WinMode = 'H'
  nombre() {
    return 'Forma H'
  }
  indices(tamano: number) {
    return hShapeIndices(tamano)
  }
}
