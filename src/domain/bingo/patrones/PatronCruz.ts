import { plusIndices } from '../geometria'
import type { WinMode } from '../tipos'
import { PatronBase } from './PatronBase'

export class PatronCruz extends PatronBase {
  readonly id: WinMode = 'plus'
  nombre() {
    return 'Cruz (+)'
  }
  indices(tamano: number) {
    return plusIndices(tamano)
  }
}
