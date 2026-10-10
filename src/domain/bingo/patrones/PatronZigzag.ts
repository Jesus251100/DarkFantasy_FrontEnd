import { zigzagIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronZigzag extends PatronBase {
  readonly id: WinMode = 'zigzag'
  nombre() {
    return 'Zigzag'
  }
  indices(tamano: number) {
    return zigzagIndices(tamano)
  }
}
