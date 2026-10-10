import { columnIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronColumna extends PatronBase {
  readonly id: WinMode = 'column'
  nombre() {
    return 'Columna'
  }
  indices(tamano: number) {
    return columnIndices(tamano)
  }
}
