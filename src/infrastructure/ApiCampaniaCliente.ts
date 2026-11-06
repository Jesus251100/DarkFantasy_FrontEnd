import { api } from '../api/cliente'
import type {
  ConfirmacionVictoriaRemota,
  IClienteCampania,
  RondaCampaniaRemota,
} from '../domain/campania/IClienteCampania'
import type { WinMode } from '../domain/bingo/tipos'
import type { DatosCampania } from '../domain/campania/IRepositorioCampania'
import type { LogroVista } from '../domain/logros/Logros'

/** Adaptador HTTP del puerto IClienteCampania. */
export class ApiCampaniaCliente implements IClienteCampania {
  async obtener(): Promise<DatosCampania> {
    const data = await api<{ campania: DatosCampania }>('/api/campania')
    return data.campania
  }

  async listarLogros(): Promise<LogroVista[]> {
    const data = await api<{ logros: LogroVista[] }>('/api/campania/logros')
    return data.logros
  }

  async iniciarRonda(nivel: number, fase: number, modo?: WinMode, runId?: string) {
    const data = await api<{ ronda: RondaCampaniaRemota }>('/api/campania/rondas', {
      method: 'POST',
      body: JSON.stringify({ nivel, fase, modo, runId }),
    })
    return data.ronda
  }

  async siguienteBola(rondaId: string): Promise<number> {
    const data = await api<{ numero: number }>(`/api/campania/rondas/${encodeURIComponent(rondaId)}/bola`, {
      method: 'POST',
    })
    return data.numero
  }

  async cerrarRonda(rondaId: string): Promise<void> {
    await api(`/api/campania/rondas/${encodeURIComponent(rondaId)}/cerrar`, { method: 'POST' })
  }

  async reclamarVictoria(rondaId: string, cartonIndex: number): Promise<ConfirmacionVictoriaRemota> {
    return api<ConfirmacionVictoriaRemota>(
      `/api/campania/rondas/${encodeURIComponent(rondaId)}/reclamar`,
      { method: 'POST', body: JSON.stringify({ cartonIndex }) },
    )
  }

  async registrarPartida(nivel: number, gano: boolean): Promise<void> {
    await api('/api/campania/partida', {
      method: 'POST',
      body: JSON.stringify({ nivel, gano }),
    })
  }

  async comprarBooster(id: number, cantidad: number): Promise<DatosCampania> {
    const data = await api<{ campania: DatosCampania }>('/api/campania/comprar-booster', {
      method: 'POST',
      body: JSON.stringify({ id, cantidad }),
    })
    return data.campania
  }

  async intercambiar(modo: 'diamonds-to-coins' | 'coins-to-diamonds'): Promise<DatosCampania> {
    const data = await api<{ campania: DatosCampania }>('/api/campania/intercambiar', {
      method: 'POST',
      body: JSON.stringify({ modo }),
    })
    return data.campania
  }

  async cambiarNombre(nombre: string): Promise<DatosCampania> {
    const data = await api<{ campania: DatosCampania }>('/api/campania/nombre', {
      method: 'PATCH',
      body: JSON.stringify({ nombre }),
    })
    return data.campania
  }
}
