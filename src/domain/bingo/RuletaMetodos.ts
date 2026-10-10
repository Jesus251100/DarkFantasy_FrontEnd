import type { WinMode } from './tipos'

/** Gira un pool de métodos y cae en uno. La vista solo anima el resultado. */
export class RuletaMetodos {
  constructor(private readonly pool: readonly WinMode[]) {
    if (pool.length === 0) throw new Error('La ruleta necesita al menos un método')
  }

  get metodos(): WinMode[] {
    return [...this.pool]
  }

  girar(): WinMode {
    return this.girarIndice().modo
  }

  girarIndice(): { modo: WinMode; indice: number } {
    const indice = Math.floor(Math.random() * this.pool.length)
    const modo = this.pool[indice] ?? this.pool[0]!
    return { modo, indice }
  }
}
