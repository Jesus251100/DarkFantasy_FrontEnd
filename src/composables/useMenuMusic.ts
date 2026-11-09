import type { Pinia } from 'pinia'
import { watch } from 'vue'
import { MusicDirector } from '@/infrastructure/MusicDirector'
import { useAudioStore } from '@/stores/audio'

export interface ControlMusicaNavegacion {
  preparar(ruta: string): Promise<void>
  pausarParaTransicion(): void
}

export function installMenuMusic(pinia: Pinia): ControlMusicaNavegacion {
  const store = useAudioStore(pinia)
  const director = new MusicDirector(() => store.volume)
  director.instalar()
  watch(() => store.volume, () => director.aplicarVolumen())
  watch(() => store.musicPaused, (pausada) => director.pausarPorAnimacion(pausada), { immediate: true })

  return {
    preparar: (ruta) => director.cambiarInterfaz(ruta),
    pausarParaTransicion: () => director.pausarParaTransicion(),
  }
}
