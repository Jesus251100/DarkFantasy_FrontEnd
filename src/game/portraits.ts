import type { BotId } from './bots'
import logoUrl from '@/assets/img/logo.png'
import perezaUrl from '@/assets/img/arzobispo-pereza.png'
import espadaUrl from '@/assets/img/santo-espada.png'
import envidiaUrl from '@/assets/img/bruja-envidia.png'
import dragonUrl from '@/assets/img/dragon.png'

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
