import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useProgressStore, type LevelClearResult } from '../stores/progress'

/**
 * Registra victoria/derrota en PostgreSQL (campaña + historial de partidas).
 */
export function useLevelClear(
  level: number,
  canClear: MaybeRefOrGetter<boolean> = true,
) {
  const progress = useProgressStore()
  const lastClear = ref<LevelClearResult | null>(null)

  async function registrarVictoria() {
    if (toValue(canClear)) {
      lastClear.value = await progress.completeLevel(level)
    } else {
      lastClear.value = null
      await progress.registrarPartida(level, true)
    }
    return lastClear.value
  }

  async function registrarDerrota() {
    await progress.registrarPartida(level, false)
  }

  return { lastClear, progress, registrarVictoria, registrarDerrota }
}
