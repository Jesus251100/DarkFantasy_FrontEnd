import type { Pinia } from 'pinia'
import { watch } from 'vue'
import { MusicDirector } from '@/infrastructure/MusicDirector'
import { useAudioStore } from '@/stores/audio'

export function installMenuMusic(pinia: Pinia): (ruta: string) => Promise<void> {
  const store = useAudioStore(pinia)
  const director = new MusicDirector(() => store.volume)
  director.instalar()
  watch(() => store.volume, () => director.aplicarVolumen())

  return (ruta) => director.cambiarInterfaz(ruta)
}
