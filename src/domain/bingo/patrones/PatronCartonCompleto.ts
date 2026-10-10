import { fullCardIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronCartonCompleto extends PatronBase {
  readonly id: WinMode = 'full'
  nombre() {
    return 'Cartón completo'
  }
  indices(tamano: number) {
    return fullCardIndices(tamano)
  }
}
