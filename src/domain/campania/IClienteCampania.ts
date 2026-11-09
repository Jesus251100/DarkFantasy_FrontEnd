import type { ResultadoClear } from './Campania'
import type { CardValue, WinMode } from '../bingo/tipos'
import type { DatosCampania } from './IRepositorioCampania'
import type { LogroVista } from '../logros/Logros'

export interface RondaCampaniaRemota {
  id: string
  runId: string | null
  nivel: number
  fase: number
  tamano: number
  maxNumero: number
  intervaloMs: number
  modos: WinMode[]
  cartones: CardValue[][]
}

export interface ConfirmacionVictoriaRemota {
  ok: true
  nivel: number
  fase: number
  totalFases: number
  nivelCompleto: boolean
  resultado?: ResultadoClear
  campania?: DatosCampania
}

/** Puerto remoto de la campaña (D de SOLID). El store no habla HTTP. */
export interface IClienteCampania {
  obtener(): Promise<DatosCampania>
  listarLogros(): Promise<LogroVista[]>
  registrarPartida(nivel: number, gano: boolean): Promise<void>
  iniciarRonda(nivel: number, fase: number, modo?: WinMode, runId?: string): Promise<RondaCampaniaRemota>
  siguienteBola(rondaId: string): Promise<number>
  devolverBola(rondaId: string, numero: number): Promise<void>
  cerrarRonda(rondaId: string): Promise<void>
  reclamarVictoria(rondaId: string, cartonIndex: number): Promise<ConfirmacionVictoriaRemota>
  comprarBooster(id: number, cantidad: number): Promise<DatosCampania>
  intercambiar(modo: 'diamonds-to-coins' | 'coins-to-diamonds'): Promise<DatosCampania>
  cambiarNombre(nombre: string): Promise<DatosCampania>
}
