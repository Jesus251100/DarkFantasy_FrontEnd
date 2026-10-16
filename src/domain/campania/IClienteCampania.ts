import type { ResultadoClear } from './Campania'
import type { DatosCampania } from './IRepositorioCampania'
import type { LogroVista } from '../logros/Logros'

/** Puerto remoto de la campaña (D de SOLID). El store no habla HTTP. */
export interface IClienteCampania {
  obtener(): Promise<DatosCampania>
  completarNivel(nivel: number): Promise<{ resultado: ResultadoClear; campania: DatosCampania }>
  listarLogros(): Promise<LogroVista[]>
  registrarPartida(nivel: number, gano: boolean): Promise<void>
  comprarBooster(id: number, cantidad: number): Promise<DatosCampania>
  intercambiar(modo: 'diamonds-to-coins' | 'coins-to-diamonds'): Promise<DatosCampania>
  cambiarNombre(nombre: string): Promise<DatosCampania>
}
