import { rowIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronFila extends PatronBase {
  readonly id: WinMode = 'row'
  nombre() {
    return 'Fila'
  }
  indices(tamano: number) {
    return rowIndices(tamano)
  }
}
