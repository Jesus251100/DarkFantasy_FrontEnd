import type { SnapPartida } from '../domain/partida/Partida'

const PREFIX = 'df-level-session:'

export class SessionStoragePartidaRepo {
  key(levelKey: string): string {
    return `${PREFIX}${levelKey}`
  }

  cargar(levelKey: string): SnapPartida | null {
    try {
      const raw = sessionStorage.getItem(this.key(levelKey))
      if (!raw) return null
      const data = JSON.parse(raw) as SnapPartida
      if (!data || data.v !== 1 || !Array.isArray(data.cards) || !Array.isArray(data.layouts)) {
        return null
      }
      return data
    } catch {
      return null
    }
  }

  guardar(levelKey: string, snap: SnapPartida): void {
    try {
      sessionStorage.setItem(this.key(levelKey), JSON.stringify(snap))
    } catch {
      // quota / private mode
    }
  }

  borrar(levelKey: string): void {
    try {
      sessionStorage.removeItem(this.key(levelKey))
    } catch {
      // ignore
    }
  }
}
