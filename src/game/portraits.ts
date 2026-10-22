import type { BotId } from './bots'
import logoUrl from '@/assets/img/logo.png'
import perezaUrl from '@/assets/img/arzobispo-pereza.png'
import espadaUrl from '@/assets/img/santo-espada.png'
import envidiaUrl from '@/assets/img/bruja-envidia.png'
import dragonUrl from '@/assets/img/dragon.png'
import jhonblackUrl from '@/assets/img/avatars/user-jhonblacked.png'
import noobUrl from '@/assets/img/avatars/user-noobmaster69.png'
import messiUrl from '@/assets/img/avatars/user-messironaldo107.png'
import davoUrl from '@/assets/img/avatars/user-davoxeneixe.png'
import homladerUrl from '@/assets/img/avatars/user-homladereff.png'
import polloUrl from '@/assets/img/avatars/user-donpollo67.png'
import esotilUrl from '@/assets/img/avatars/user-esotilnxd.png'
import arenisUrl from '@/assets/img/avatars/user-jhon-arenis.png'
import mamaUrl from '@/assets/img/avatars/user-mimami456.png'

/** Retrato del jugador en la ficha de victoria. */
export const PLAYER_PORTRAIT = logoUrl

export const BOT_PORTRAITS: Record<BotId, string> = {
  pereza: perezaUrl,
  espada: espadaUrl,
  envidia: envidiaUrl,
  dragon: dragonUrl,
}

export function botPortrait(id: BotId | string): string {
  return BOT_PORTRAITS[id as BotId] ?? dragonUrl
}

const RETRATOS_POR_NOMBRE: { clave: string; url: string }[] = [
  { clave: 'jhonblack', url: jhonblackUrl },
  { clave: 'noob', url: noobUrl },
  { clave: 'messi', url: messiUrl },
  { clave: 'davo', url: davoUrl },
  { clave: 'homlader', url: homladerUrl },
  { clave: 'pollo', url: polloUrl },
  { clave: 'esotil', url: esotilUrl },
  { clave: 'arenis', url: arenisUrl },
  { clave: 'mama', url: mamaUrl },
  { clave: 'mimami', url: mamaUrl },
  { clave: 'perez', url: perezaUrl },
  { clave: 'pereza', url: perezaUrl },
  { clave: 'envidia', url: envidiaUrl },
  { clave: 'drag', url: dragonUrl },
  { clave: 'espada', url: espadaUrl },
  { clave: 'santo', url: espadaUrl },
]

/** Foto del modo online según el nombre que se ve en el Figma o el del rival. */
export function retratoPorNombre(nombre: string): string | null {
  const normal = nombre.toLowerCase()
  return RETRATOS_POR_NOMBRE.find((retrato) => normal.includes(retrato.clave))?.url ?? null
}
