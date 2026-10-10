import { api } from '../api/cliente'
import type { ResultadoClear } from '../domain/campania/Campania'
import type { IClienteCampania } from '../domain/campania/IClienteCampania'
import type { DatosCampania } from '../domain/campania/IRepositorioCampania'

/** Adaptador HTTP del puerto IClienteCampania. */
export class ApiCampaniaCliente implements IClienteCampania {
  async obtener(): Promise<DatosCampania> {
    const data = await api<{ campania: DatosCampania }>('/api/campania')
    return data.campania
  }

  async completarNivel(nivel: number) {
    return api<{ resultado: ResultadoClear; campania: DatosCampania }>('/api/campania/completar-nivel', {
      method: 'POST',
      body: JSON.stringify({ nivel }),
    })
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
