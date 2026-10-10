import {
  STORAGE_KEY,
  campaniaVacia,
  type DatosCampania,
  type IRepositorioCampania,
} from '../domain/campania/IRepositorioCampania'
import { sanitizar as sanitizeCampania } from '../domain/campania/Campania'

export class LocalStorageCampaniaRepo implements IRepositorioCampania {
  cargar(): DatosCampania {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return campaniaVacia()
      const parsed = JSON.parse(raw) as Partial<DatosCampania>
      if (parsed?.v !== 1) return campaniaVacia()
      return sanitizeCampania(parsed)
    } catch {
      return campaniaVacia()
    }
  }

  guardar(datos: DatosCampania): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datos))
    } catch {
      // quota / private mode
    }
  }
}
