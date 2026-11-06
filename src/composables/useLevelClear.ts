import { ref } from 'vue'
import { useProgressStore, type LevelClearResult } from '../stores/progress'
import type { ConfirmacionVictoriaRemota } from '../domain/campania/IClienteCampania'

/** Registra solo victorias confirmadas por el backend. */
export function useLevelClear(level: number) {
  const progress = useProgressStore()
  const lastClear = ref<LevelClearResult | null>(null)

  async function registrarVictoria(rondaId: string, cartonIndex: number): Promise<ConfirmacionVictoriaRemota> {
    const confirmacion = await progress.reclamarVictoria(rondaId, cartonIndex)
    lastClear.value = confirmacion.resultado ?? null
    return confirmacion
  }

  async function registrarDerrota(rondaId?: string) {
    if (rondaId) await progress.cerrarRonda(rondaId).catch(() => undefined)
    await progress.registrarPartida(level, false)
  }

  return { lastClear, progress, registrarVictoria, registrarDerrota }
}
