/** Dificultad lineal: nivel 1 fácil → nivel 10 máximo. */
export class DificultadNivel {
  private constructor(
    readonly nivel: number,
    readonly baseReactionMs: number,
    readonly reactionJitterMs: number,
    readonly missChance: number,
    readonly smartTargeting: boolean,
  ) {}

  static paraNivel(level: number): DificultadNivel {
    const t = Math.min(1, Math.max(0, (level - 1) / 9))
    return new DificultadNivel(
      level,
      Math.round(5800 - t * 2800),
      Math.round(1800 - t * 800),
      0.62 * (1 - t * 0.5),
      t >= 0.55,
    )
  }

  static desde(datos: {
    baseReactionMs: number
    reactionJitterMs: number
    missChance: number
    smartTargeting: boolean
  }): DificultadNivel {
    return new DificultadNivel(
      0,
      datos.baseReactionMs,
      datos.reactionJitterMs,
      datos.missChance,
      datos.smartTargeting,
    )
  }

  delayMs(multVelocidad: number): number {
    const base = this.baseReactionMs * multVelocidad
    const jitter = Math.random() * this.reactionJitterMs * multVelocidad
    return Math.round(base + jitter)
  }

  debeMarcar(multFallo: number, ayudaPatron: boolean): boolean {
    let miss = this.missChance * multFallo
    if (this.smartTargeting && !ayudaPatron) miss = Math.min(0.85, miss + 0.25)
    if (this.smartTargeting && ayudaPatron) miss *= 0.35
    return Math.random() >= miss
  }
}
