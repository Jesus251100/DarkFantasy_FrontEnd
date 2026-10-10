import { arrowIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronFlecha extends PatronBase {
  readonly id: WinMode = 'arrow'
  nombre() {
    return 'Flecha'
  }
  indices(tamano: number) {
    return arrowIndices(tamano)
  }
}
