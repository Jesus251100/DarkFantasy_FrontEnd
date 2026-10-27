import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const CLAVE = 'df-ajustes-audio'

interface AjustesAudio {
  volume: number
  sfx: number
}

const limitar = (valor: unknown, respaldo: number): number => {
  const n = Number(valor)
  if (!Number.isFinite(n)) return respaldo
  return Math.min(100, Math.max(0, Math.round(n)))
}

const cargar = (): AjustesAudio => {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AjustesAudio>
      return {
        volume: limitar(parsed.volume, 80),
        sfx: limitar(parsed.sfx, 80),
      }
    }
  } catch {
    /* ignorar JSON corrupto */
  }
  return { volume: 80, sfx: 80 }
}

export const useAudioStore = defineStore('audio', () => {
  const inicial = cargar()
  const volume = ref(inicial.volume)
  const sfx = ref(inicial.sfx)

  watch([volume, sfx], ([vol, sfxVal]) => {
    try {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({ volume: limitar(vol, 80), sfx: limitar(sfxVal, 80) }),
      )
    } catch {
      /* almacenamiento no disponible */
    }
  })

  return { volume, sfx }
})
