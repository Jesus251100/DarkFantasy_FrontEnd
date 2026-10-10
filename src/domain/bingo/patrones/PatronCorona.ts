import { crownIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronCorona extends PatronBase {
  readonly id: WinMode = 'crown'
  nombre() {
    return 'Corona'
  }
  indices(tamano: number) {
    return crownIndices(tamano)
  }
}
