import { xShapeIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronX extends PatronBase {
  readonly id: WinMode = 'X'
  nombre() {
    return 'Letra X'
  }
  indices(tamano: number) {
    return xShapeIndices(tamano)
  }
}
