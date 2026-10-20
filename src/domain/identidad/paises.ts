/**
 * Catálogo de países con sus códigos ISO 3166-1 alpha-2 y sus banderas reales.
 * Los nombres se resuelven con Intl.DisplayNames del navegador (español),
 * con fallback al código en mayúsculas si el navegador es antiguo.
 * Las imágenes de bandera viven en public/flags/<codigo>.png
 */
export type CodigoPais = string

export interface PaisRegion {
  nombre: string
  codigos: CodigoPais[]
}

export const REGIONES: PaisRegion[] = [
  {
    nombre: 'América Latina y el Caribe',
    codigos: [
      'mx', 'gt', 'bz', 'sv', 'hn', 'ni', 'cr', 'pa', 'cu', 'do', 'ht', 'jm',
      'bs', 'bb', 'tt', 'co', 've', 'gy', 'sr', 'ec', 'pe', 'bo', 'br', 'py',
      'uy', 'ar', 'cl',
    ],
  },
  {
    nombre: 'América del Norte',
    codigos: ['us', 'ca'],
  },
  {
    nombre: 'Europa',
    codigos: [
      'gb', 'es', 'pt', 'fr', 'de', 'it', 'at', 'ch', 'be', 'nl', 'lu', 'ie',
      'no', 'se', 'fi', 'dk', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'gr', 'tr',
      'ua', 'ru', 'by', 'rs', 'hr', 'si', 'ba', 'mk', 'al', 'md', 'lt', 'lv',
      'ee', 'is', 'ge', 'am', 'az',
    ],
  },
  {
    nombre: 'Asia y Oriente Medio',
    codigos: [
      'kz', 'uz', 'kg', 'tj', 'tm', 'mn', 'cn', 'tw', 'jp', 'kr', 'kp', 'ph',
      'vn', 'th', 'id', 'my', 'sg', 'in', 'pk', 'bd', 'lk', 'np', 'af', 'ir',
      'iq', 'sa', 'ae', 'qa', 'kw', 'bh', 'om', 'jo', 'lb', 'sy', 'il', 'ps',
    ],
  },
  {
    nombre: 'África',
    codigos: [
      'eg', 'ly', 'tn', 'dz', 'ma', 'ng', 'gh', 'ci', 'sn', 'ml', 'bf', 'ne',
      'td', 'cm', 'cg', 'cd', 'ao', 'zm', 'zw', 'mz', 'za', 'na', 'bw', 'ke',
      'ug', 'tz', 'rw', 'et', 'er', 'dj', 'so', 'sd',
    ],
  },
  {
    nombre: 'Oceanía',
    codigos: ['au', 'nz', 'fj', 'pg'],
  },
]

/** Todos los códigos de país disponibles, aplastados en un solo array. */
export const TODOS_LOS_CODIGOS: CodigoPais[] = REGIONES.flatMap((r) => r.codigos)

/** Devuelve la URL de la imagen de bandera de un país, o '' si no existe. */
export function banderaUrl(codigo: CodigoPais | null | undefined): string {
  if (!codigo) return ''
  return `/flags/${codigo.toLowerCase()}.png`
}

/** Devuelve el nombre del país en español, o el código en mayúsculas si no se puede resolver. */
export function nombrePais(codigo: CodigoPais | null | undefined): string {
  if (!codigo) return ''
  try {
    const nombre = new Intl.DisplayNames(['es'], { type: 'region' }).of(
      codigo.toUpperCase(),
    )
    return nombre ?? codigo.toUpperCase()
  } catch {
    return codigo.toUpperCase()
  }
}
