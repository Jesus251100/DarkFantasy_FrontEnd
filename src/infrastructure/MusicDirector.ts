import menuTheme from '@/assets/audio/requiem of silence.mp3'
import campaignTheme from '@/assets/audio/chain of memories.mp3'
import socialTheme from '@/assets/audio/wish of the stars.mp3'

type PistaId = 'menu' | 'campania' | 'social'

const RUTAS_CAMPANIA = /^\/levels$|^\/level(?:[1-9]|10)$/
const RUTAS_SOCIAL = /^\/(?:inventory|achivements|store)$/

/** Centraliza el ciclo de vida, el volumen y la selección de música por interfaz. */
export class MusicDirector {
  private readonly pistas: Record<PistaId, HTMLAudioElement>
  private activa: HTMLAudioElement | null = null
  private desbloqueada = false
  private pausaDeTransicion = false

  constructor(private readonly obtenerVolumen: () => number) {
    this.pistas = {
      menu: this.crearPista(menuTheme),
      campania: this.crearPista(campaignTheme),
      social: this.crearPista(socialTheme),
    }
    this.aplicarVolumen()
  }

  instalar(): void {
    window.addEventListener('pointerdown', this.alInteractuar)
    window.addEventListener('keydown', this.alInteractuar)
  }

  aplicarVolumen(): void {
    const volumen = Math.min(1, Math.max(0, this.obtenerVolumen() / 100))
    for (const pista of Object.values(this.pistas)) pista.volume = volumen
  }

  async cambiarInterfaz(ruta: string): Promise<void> {
    const id = this.pistaParaRuta(ruta)
    const objetivo = this.pistas[id]

    for (const pista of Object.values(this.pistas)) {
      pista.pause()
      pista.currentTime = 0
      pista.preload = pista === objetivo ? 'auto' : 'none'
    }

    this.activa = objetivo
    this.pausaDeTransicion = false
    this.aplicarVolumen()
    objetivo.load()
    if (this.desbloqueada) this.reproducir(objetivo)

    await this.esperarCargaBreve(objetivo)
  }

  pausarParaTransicion(): void {
    this.pausaDeTransicion = true
    for (const pista of Object.values(this.pistas)) pista.pause()
  }

  private crearPista(src: string): HTMLAudioElement {
    const pista = new Audio(src)
    pista.loop = true
    pista.preload = 'none'
    return pista
  }

  private pistaParaRuta(ruta: string): PistaId {
    if (RUTAS_CAMPANIA.test(ruta)) return 'campania'
    if (RUTAS_SOCIAL.test(ruta)) return 'social'
    return 'menu'
  }

  private reproducir(pista: HTMLAudioElement): void {
    void pista.play().catch(() => {
      // El siguiente gesto del jugador vuelve a intentar iniciar la pista.
    })
  }

  private readonly alInteractuar = (): void => {
    this.desbloqueada = true
    if (this.pausaDeTransicion) return
    if (this.activa?.paused) this.reproducir(this.activa)
  }

  private esperarCargaBreve(pista: HTMLAudioElement): Promise<void> {
    if (pista.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve()

    return new Promise((resolve) => {
      let finalizada = false
      const finalizar = () => {
        if (finalizada) return
        finalizada = true
        window.clearTimeout(limite)
        pista.removeEventListener('canplay', finalizar)
        pista.removeEventListener('error', finalizar)
        resolve()
      }
      const limite = window.setTimeout(finalizar, 900)
      pista.addEventListener('canplay', finalizar, { once: true })
      pista.addEventListener('error', finalizar, { once: true })
    })
  }
}
