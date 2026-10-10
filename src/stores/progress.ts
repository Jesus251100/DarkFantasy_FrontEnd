import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { CompletarNivelRemoto } from '../application/CompletarNivelRemoto'
import { RegistrarPartidaRemota } from '../application/RegistrarPartidaRemota'
import { aplicarDatosEnCampania, SincronizarCampania } from '../application/SincronizarCampania'
import { Campania, type ResultadoClear } from '../domain/campania/Campania'
import {
  MAX_LEVEL,
  STORAGE_KEY,
  campaniaVacia,
  type DatosCampania,
} from '../domain/campania/IRepositorioCampania'
import { COIN_REWARD, DIAMOND_REWARD } from '../domain/campania/Recompensa'
import { ApiCampaniaCliente } from '../infrastructure/ApiCampaniaCliente'
import { LocalStorageCampaniaRepo } from '../infrastructure/LocalStorageCampaniaRepo'
import { useAuthStore } from './auth'

export type { ResultadoClear as LevelClearResult }
export { MAX_LEVEL, STORAGE_KEY, COIN_REWARD, DIAMOND_REWARD }

/**
 * Adaptador Vue de Campania.
 * HTTP vive en ApiCampaniaCliente; las reglas, en el dominio.
 */
export const useProgressStore = defineStore('progress', () => {
  const cache = new LocalStorageCampaniaRepo()
  const campania = new Campania(cache)
  const cliente = new ApiCampaniaCliente()
  const sincronizar = new SincronizarCampania(cliente)
  const completarRemoto = new CompletarNivelRemoto(cliente)
  const registrarRemota = new RegistrarPartidaRemota(cliente)

  const highestUnlocked = ref(campania.highestUnlocked)
  const completed = ref<number[]>([...campania.completed])
  const coins = ref(campania.jugador.monedas)
  const diamonds = ref(campania.jugador.diamantes)
  const wins = ref(campania.wins)
  const displayName = ref(campania.jugador.nombre)
  const boosters = ref({ ...campania.jugador.boosters })
  const hidratado = ref(false)
  let hidratando: Promise<void> | null = null

  function sync() {
    highestUnlocked.value = campania.highestUnlocked
    completed.value = [...campania.completed]
    coins.value = campania.jugador.monedas
    diamonds.value = campania.jugador.diamantes
    wins.value = campania.wins
    displayName.value = campania.jugador.nombre
    boosters.value = { ...campania.jugador.boosters }
  }

  const completedCount = computed(() => completed.value.length)
  const progressPercent = computed(() => Math.round((completed.value.length / MAX_LEVEL) * 100))
  const campaignLevel = computed(() => Math.max(1, completed.value.length))
  const xp = computed(() => completed.value.length * 100)

  function isUnlocked(level: number): boolean {
    if (useAuthStore().usuario?.rol === 'administrador') {
      return level >= 1 && level <= MAX_LEVEL
    }
    return campania.estaDesbloqueado(level)
  }

  function isCompleted(level: number): boolean {
    return campania.estaCompletado(level)
  }

  function aplicarDatos(datos: DatosCampania) {
    aplicarDatosEnCampania(campania, datos)
    sync()
  }

  async function hidratarDesdeApi() {
    const datos = await sincronizar.ejecutar()
    aplicarDatos(datos)
    hidratado.value = true
  }

  async function asegurarHidratado() {
    if (hidratado.value) return
    if (hidratando) return hidratando
    hidratando = hidratarDesdeApi()
      .catch(() => {
        /* sin API se usa el cache local */
      })
      .finally(() => {
        hidratando = null
      })
    return hidratando
  }

  function resetear() {
    aplicarDatos(campaniaVacia())
    hidratado.value = false
  }

  async function completeLevel(level: number): Promise<ResultadoClear> {
    const data = await completarRemoto.ejecutar(level, campania)
    aplicarDatos(data.campania)
    return data.resultado
  }

  async function registrarPartida(nivel: number, gano: boolean) {
    await registrarRemota.ejecutar(nivel, gano)
  }

  async function comprarEnServidor(id: number, cantidad: number) {
    aplicarDatos(await cliente.comprarBooster(id, cantidad))
  }

  async function intercambiarEnServidor(modo: 'diamonds-to-coins' | 'coins-to-diamonds') {
    aplicarDatos(await cliente.intercambiar(modo))
  }

  function boosterCount(id: number): number {
    return campania.jugador.cantidadBooster(id)
  }

  async function setDisplayName(name: string) {
    campania.jugador.setNombre(name)
    campania.persistir()
    sync()
    try {
      aplicarDatos(await cliente.cambiarNombre(campania.jugador.nombre))
      useAuthStore().setNombre(campania.jugador.nombre)
    } catch {
      /* si el API no está, queda el nombre local */
    }
  }

  function dominio(): Campania {
    return campania
  }

  function refrescar() {
    sync()
  }

  return {
    highestUnlocked,
    completed,
    coins,
    diamonds,
    wins,
    displayName,
    boosters,
    completedCount,
    progressPercent,
    campaignLevel,
    xp,
    hidratado,
    isUnlocked,
    isCompleted,
    completeLevel,
    registrarPartida,
    boosterCount,
    setDisplayName,
    dominio,
    refrescar,
    hidratarDesdeApi,
    asegurarHidratado,
    resetear,
    aplicarDatos,
    comprarEnServidor,
    intercambiarEnServidor,
  }
})
