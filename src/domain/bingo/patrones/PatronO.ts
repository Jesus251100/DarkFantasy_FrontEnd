import { oShapeIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronO extends PatronBase {
  readonly id: WinMode = 'O'
  nombre() {
    return 'Marco O'
  }
  indices(tamano: number) {
    return oShapeIndices(tamano)
  }
}
