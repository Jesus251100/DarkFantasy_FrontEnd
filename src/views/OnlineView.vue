<template>
  <div class="online">
    <button type="button" class="btn-atras" aria-label="Volver" @click="atras">←</button>
    <section v-if="mostrarCarga" class="carga" :class="{ preparando: entrada }">
      <div class="panel-carga">
        <div class="emblema-carga" aria-hidden="true">
          <span class="sello-aro aro-exterior"></span>
          <span class="sello-aro aro-interior"></span>
          <img src="@/assets/img/dragon.png" alt="" class="dragon-carga" />
          <span class="runa runa-uno">✦</span>
          <span class="runa runa-dos">✧</span>
          <span class="runa runa-tres">✦</span>
        </div>
        <div class="mensaje-carga" role="status" aria-live="polite">
          <p class="cargando">
            {{ entrada ? 'PREPARANDO LA PARTIDA' : conectado ? 'BUSCANDO RIVAL' : 'RECONECTANDO' }}
          </p>
          <p class="carga-detalle">
            {{
              entrada
                ? 'Las runas sellan la mesa de juego…'
                : conectado
                  ? 'El oráculo busca un rival en las sombras…'
                  : 'Restableciendo la conexión con el servidor…'
            }}
          </p>
        </div>
        <div class="rastreo-carga" aria-hidden="true"><span></span></div>
        <button v-if="fase === 'cola'" type="button" class="btn-salir-carga" @click="cancelarBusqueda">
          CANCELAR BÚSQUEDA
        </button>
      </div>
    </section>

    <section v-else-if="enPartida" class="partida">
      <div class="fila-jugadores">
        <button
          v-for="j in jugadores"
          :key="j.id"
          type="button"
          class="ficha"
          :data-jugador="j.id"
          :class="{
            yo: j.id === usuarioId,
            objetivo: puedeApuntar(j.id),
            hielo: efectoDe(j.id) === 'hielo',
            sabotaje: efectoDe(j.id) === 'sabotaje',
            suerte: efectoDe(j.id) === 'suerte',
            escudo: efectoDe(j.id) === 'escudo',
            ganador: j.ganador,
          }"
          @click="elegirObjetivo(j.id)"
        >
          <span class="foto">
            <img v-if="retrato(j.nombre, j.avatarUrl)" :src="retrato(j.nombre, j.avatarUrl) || ''" :alt="j.nombre" />
            <span v-else>{{ inicial(j.nombre) }}</span>
          </span>
          <span class="fnombre">{{ j.nombre }}</span>
          <span class="fmeta">{{ j.id === usuarioId ? 'tú' : j.esBot ? 'rival' : 'jugador' }}</span>
        </button>
      </div>

      <div class="mesa">
        <div class="oraculo">
          <div class="bola" :class="{ vacia: ultimaBola === null }">{{ ultimaBola ?? '—' }}</div>
          <p class="lbl">Última bola</p>
          <div class="recientes">
            <span v-for="(n, i) in oracleSlots" :key="i" class="mini">{{ n ?? '' }}</span>
          </div>
        </div>

        <div class="carton-wrap" :class="{ congelado: estoyCongelado, sabotaje: estoySaboteado, suerte: tengoSuerte }">
          <p class="letras" :style="{ gridTemplateColumns: `repeat(${sala?.size ?? 5}, 1fr)` }">
            <span v-for="(letra, i) in letrasBingo" :key="i">{{ letra }}</span>
          </p>
          <CartonNiebla
            :celdas="tuCarton"
            :columnas="sala?.size ?? 5"
            :cantadas="cantadas"
            :ganadores="indicesGanadores"
            :completa="nieblaCompleta"
            :saliendo="nieblaSaliendo"
            :en-casillas="nieblaEnCasillas"
            :indices="nieblaIndices"
            :rojas="nieblaRojas"
            :intentos="nieblaIntentos"
            :textos="nieblaTextos"
            :numero-oculto="numeroOculto"
            @marcar="marcarCelda"
            @escribir="escribirNiebla"
            @enviar="enviarNiebla"
          />
        </div>

        <aside class="lista">
          <h2>LISTA DE JUGADORES</h2>
          <ul>
            <li v-for="j in jugadores" :key="j.id">
              <span class="mini-foto">
                <img v-if="retrato(j.nombre, j.avatarUrl)" :src="retrato(j.nombre, j.avatarUrl) || ''" alt="" />
                <span v-else>{{ inicial(j.nombre) }}</span>
              </span>
              <span class="lnombre">{{ j.nombre }}</span>
              <span class="estado">{{ j.conectado ? 'en juego' : 'fuera' }}</span>
            </li>
          </ul>
          <ChatSala compacto :mensajes="chat" @enviar="enviarTexto" />
        </aside>
      </div>

      <div class="barra">
        <div class="barra-lado">
          <div v-if="metodoVictoria" class="metodo-esquina">
            <MethodPatternPreview
              :size="sala?.size ?? 5"
              :win-modes="[metodoVictoria]"
              :cell-px="10"
              :gap-px="2"
            />
            <p class="metodo">{{ metodoNombre }}</p>
          </div>
          <div class="boosters">
            <button
              v-for="b in boosters"
              :key="b.id"
              type="button"
              class="booster"
              :data-booster="b.id"
              :class="{ activo: boosterActivo === b.id, vacio: cantidad(b.id) <= 0 }"
              :disabled="fase !== 'jugando'"
              @click="pulsarBooster(b.id)"
            >
              <img :src="b.icono" :alt="b.nombre" />
              <span>{{ cantidad(b.id) }}</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          class="bingo"
          :class="{ listo: cantoListo }"
          :disabled="fase !== 'jugando'"
          :aria-label="cantoListo ? '¡Bingo! Método completado, canta ahora' : 'Cantar bingo'"
          @click="cantar"
        >
          {{ cantoListo ? '¡CANTA BINGO!' : '¡BINGO!' }}
        </button>
        <div class="barra-lado" aria-hidden="true"></div>
      </div>

      <p v-if="apuntando" class="pista">Elige al enemigo. El poder sale en bola hacia él.</p>
      <p v-if="aviso" class="aviso">{{ aviso }}</p>

      <span
        v-for="bola in proyectiles"
        :key="bola.id"
        class="proyectil"
        :class="'tipo-' + bola.boosterId"
        :style="{ left: bola.x + 'px', top: bola.y + 'px' }"
      ></span>
    </section>

    <section v-else-if="espera" class="hub room">
      <header class="top">
        <span>🪙 {{ progress.coins }}</span>
        <span>◆ {{ progress.diamonds }}</span>
      </header>
      <div class="centro room-centro">
        <p class="titulo">ROOM</p>
        <p class="codigo">{{ espera.codigo }}</p>
        <p class="hint">Tu amigo debe abrir este enlace en su portátil. Si lo escribe en su propio localhost, la sala no existe allá.</p>
        <p class="enlace">{{ enlaceSala || 'Buscando la dirección de esta red…' }}</p>
        <button type="button" class="accion" :disabled="!enlaceSala" @click="copiarEnlace">
          {{ copiado ? 'ENLACE COPIADO' : 'COPIAR ENLACE' }}
        </button>
        <aside class="panel lista-room">
          <h2>LISTA DE JUGADORES</h2>
          <ul>
            <li v-for="j in espera.jugadores" :key="j.id">
              <span class="mini-foto">
                <img v-if="retrato(j.nombre, j.avatarUrl)" :src="retrato(j.nombre, j.avatarUrl) || ''" alt="" />
                <span v-else>{{ inicial(j.nombre) }}</span>
              </span>
              <span>{{ j.nombre }}</span>
              <span v-if="j.id === espera.anfitrionId" class="estado">anfitrión</span>
            </li>
          </ul>
        </aside>
        <button v-if="soyAnfitrion" type="button" class="accion" @click="empezar">JUGAR</button>
        <p v-else class="hint">Esperando a que el anfitrión empiece.</p>
        <ChatSala :mensajes="chat" @enviar="enviarTexto" />
        <button type="button" class="accion suave" @click="volverSala">SALIR</button>
      </div>
    </section>

    <section v-else class="hub">
      <header class="top">
        <span>🪙 {{ progress.coins }}</span>
        <span class="conexion" :class="{ on: conectado }">{{ conectado ? 'en línea' : 'sin conexión' }}</span>
        <span>◆ {{ progress.diamonds }}</span>
      </header>

      <div class="cuerpo">
        <ChatSala lleno :mensajes="chat" @enviar="enviarTexto" />

        <div class="centro">
          <div class="encabezado-online">
            <p class="sobrelinea">EL REINO TE ESPERA</p>
            <p class="titulo">MODO ONLINE</p>
            <p class="subtitulo-online">Forma equipo, desafía rivales y conquista la mesa.</p>
          </div>
          <img src="@/assets/img/logo.png" alt="Dark Fantasy" class="logo" />
          <div class="acciones-online">
            <button type="button" class="accion accion-principal" @click="jugar">JUGAR PARTIDA</button>
            <button type="button" class="accion accion-secundaria" @click="abriendoUnion = true">UNIRSE A UNA SALA</button>
            <button type="button" class="accion accion-secundaria" @click="crear">CREAR SALA</button>
            <button type="button" class="accion accion-caza" @click="cazarDragones">CAZAR DRAGONES</button>
            <button type="button" class="accion suave accion-salir" @click="salir">SALIR</button>
          </div>
          <p v-if="errorConexion" class="error">{{ errorConexion }}</p>
        </div>

        <aside class="panel ranking">
          <h2>RANKING DE JUGADORES</h2>
          <p class="col">PUNTOS</p>
          <ol>
            <li v-for="(fila, i) in rankingVisible" :key="fila.nombre + i">
              <span class="puesto">{{ i + 1 }}</span>
              <span class="mini-foto">
                <img v-if="retrato(fila.nombre, fila.avatarUrl)" :src="retrato(fila.nombre, fila.avatarUrl) || ''" alt="" />
                <span v-else>{{ inicial(fila.nombre) }}</span>
              </span>
              <span class="rnombre">{{ fila.nombre }}</span>
              <span class="puntos">{{ fila.puntos.toLocaleString('es-CO') }}</span>
            </li>
          </ol>
        </aside>
      </div>
    </section>

    <div v-if="abriendoUnion" class="modal-backdrop" @click.self="abriendoUnion = false">
      <form class="modal union" @submit.prevent="unirse">
        <h2>UNIRSE</h2>
        <p>Escribe el código de la sala.</p>
        <input v-model="codigo" maxlength="4" placeholder="CÓDIGO" />
        <p v-if="errorSala" class="error">{{ textoErrorSala }}</p>
        <div class="acciones-modal">
          <button type="submit" class="accion">ENTRAR</button>
          <button type="button" class="accion suave" @click="abriendoUnion = false">CANCELAR</button>
        </div>
      </form>
    </div>

    <div v-if="fase === 'terminado'" class="modal-backdrop">
      <div class="modal" :class="{ gane: esGanador }">
        <h2>{{ esGanador ? '¡BINGO! GANASTE' : 'Fin de la partida' }}</h2>
        <p v-if="ganador">Ganador: <strong>{{ ganador.nombre }}</strong></p>
        <p v-else>Nadie completó el patrón.</p>
        <p v-if="esGanador" class="premio">+25 monedas</p>
        <div class="acciones-modal">
          <button type="button" class="accion" @click="jugarOtraVez">JUGAR</button>
          <button type="button" class="accion suave" @click="salir">SALIR</button>
        </div>
      </div>
    </div>

    <p v-if="alerta" class="alerta">{{ alerta }}</p>

    <RuletaMetodosOverlay
      :show="showRuleta && !mostrarCarga"
      :metodos="metodosVictoria"
      :size="sala?.size ?? 5"
      :resultado="metodoVictoria"
      :fondo="fondoRuleta"
      kicker="Modo online"
      @elegido="onMetodoElegido"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import { usePartidaOnline } from '../composables/usePartidaOnline'
import { nombreMetodo } from '../domain/bingo/nombresMetodo'
import { patronDesdeModo } from '../domain/bingo/patrones/catalogoPatrones'
import {
  casillaDeProgreso,
  progresoDeFigura,
  UMBRAL_PROGRESO_NIEBLA,
} from '../domain/online/niebla'
import { retratoPorNombre } from '../game/portraits'
import ChatSala from '../components/ChatSala.vue'
import CartonNiebla from '../components/CartonNiebla.vue'
import MethodPatternPreview from '../components/MethodPatternPreview.vue'
import RuletaMetodosOverlay from '../components/RuletaMetodosOverlay.vue'
import { useNieblaOnline } from '../composables/useNieblaOnline'
import type { VueloBoosterOnline } from '../domain/online/tipos'
import freezeIcon from '@/assets/img/freeze.png'
import shieldIcon from '@/assets/img/shield 1.png'
import luckIcon from '@/assets/img/goodluck 2.png'
import sabotageIcon from '@/assets/img/sabotage 2.png'
import fondoNivel1 from '@/assets/img/level1 1.png'
import fondoNivel2 from '@/assets/img/level2 1.png'
import fondoNivel3 from '@/assets/img/level3 1.png'
import fondoNivel4 from '@/assets/img/level4 1.png'
import fondoNivel5 from '@/assets/img/level5.gif'
import fondoNivel6 from '@/assets/img/level6.gif'
import fondoNivel7 from '@/assets/img/level7.gif'
import fondoNivel8 from '@/assets/img/level8.gif'
import fondoNivel9 from '@/assets/img/level9.gif'

interface Proyectil {
  id: number
  boosterId: number
  x: number
  y: number
}

interface Efecto {
  tipo: 'hielo' | 'sabotaje' | 'suerte' | 'escudo'
  hasta: number
}

const BOOSTERS = [
  { id: 3, nombre: 'Good Luck', icono: luckIcon, propio: true },
  { id: 4, nombre: 'Shield', icono: shieldIcon, propio: true },
  { id: 1, nombre: 'Freeze', icono: freezeIcon, propio: false },
  { id: 2, nombre: 'Sabotage', icono: sabotageIcon, propio: false },
] as const

const FONDOS_NIVELES = [
  fondoNivel1,
  fondoNivel2,
  fondoNivel3,
  fondoNivel4,
  fondoNivel5,
  fondoNivel6,
  fondoNivel7,
  fondoNivel8,
  fondoNivel9,
]

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const progress = useProgressStore()
const usuarioId = auth.usuario?.id ?? ''
const online = usePartidaOnline(usuarioId)

const {
  conectado,
  fase,
  sala,
  cantadas,
  ultimaBola,
  errorConexion,
  aviso,
  alerta,
  showRuleta,
  oracleSlots,
  tuCarton,
  metodosVictoria,
  metodoVictoria,
  esGanador,
  indicesGanadores,
  ganador,
  espera,
  ranking,
  chat,
  errorSala,
} = online

const nieblaProgramada = ref(false)
const {
  fase: faseNiebla,
  indices: nieblaIndices,
  rojas: nieblaRojas,
  intentos: nieblaIntentos,
  textos: nieblaTextos,
  completa: nieblaCompleta,
  saliendo: nieblaSaliendo,
  enCasillas: nieblaEnCasillas,
  startFogEvent,
  escribir: escribirNiebla,
  enviar: enviarNiebla,
  reiniciar: reiniciarNiebla,
  numeroOculto,
  bloqueaCarton,
} = useNieblaOnline({
  celdas: () => tuCarton.value,
  cantadas: () => cantadas.value,
  avisar: (texto) => online.mostrarAviso(texto),
  penalizar: () => quitarCasillaDeLaFigura(),
})

const letrasBingo = computed(() => {
  const total = sala.value?.size ?? 5
  const base = 'BINGO'
  return Array.from({ length: total }, (_, i) => base[i] ?? '')
})

function quitarCasillaDeLaFigura() {
  const modo = metodoVictoria.value
  if (!modo) return
  const indice = casillaDeProgreso(
    tuCarton.value,
    patronDesdeModo(modo).indices(sala.value?.size ?? 5),
    nieblaIndices.value,
  )
  if (indice === null) {
    online.mostrarAviso('Te equivocaste. Tu figura no tenía una casilla marcada para quitar.')
    return
  }
  online.quitarMarca(indice)
  online.mostrarAviso('Te equivocaste. La niebla te quitó una casilla de la figura.')
}

const boosters = BOOSTERS
const codigo = ref('')
const abriendoUnion = ref(false)
const ipRed = ref('')
const copiado = ref(false)
const entrada = ref(false)
const boosterActivo = ref<number | null>(null)
const gastados = ref<Record<number, number>>({})
const proyectiles = ref<Proyectil[]>([])
const efectos = ref<Record<string, Efecto>>({})
let proyectilSeq = 0
let relojEfectos: ReturnType<typeof setInterval> | null = null
let cierreCarga: ReturnType<typeof setTimeout> | null = null

const jugadores = computed(() => sala.value?.jugadores ?? [])
const rankingVisible = computed(() => {
  if (ranking.value.length > 0) return ranking.value
  const nombre = progress.displayName || auth.usuario?.nombre || 'Tú'
  return [{ nombre, puntos: 0, victorias: 0 }]
})
const enPartida = computed(() => fase.value === 'jugando' || fase.value === 'terminado')
const mostrarCarga = computed(() => fase.value === 'cola' || entrada.value)
const metodoNombre = computed(() =>
  metodoVictoria.value ? nombreMetodo(metodoVictoria.value) : 'Elige el método',
)
const cantoListo = computed(() => {
  const modo = metodoVictoria.value
  if (fase.value !== 'jugando' || !modo) return false
  const indices = patronDesdeModo(modo).indices(sala.value?.size ?? 5)
  return indices.length > 0 && indices.every((indice) => tuCarton.value[indice]?.marked)
})
const progresoMetodo = computed(() => {
  const modo = metodoVictoria.value
  if (!modo) return 0
  return progresoDeFigura(tuCarton.value, patronDesdeModo(modo).indices(sala.value?.size ?? 5))
})
const fondoRuleta = computed(() => {
  const nivel = sala.value?.fondoNivel ?? 1
  return FONDOS_NIVELES[nivel - 1] ?? FONDOS_NIVELES[0]
})
function cazarDragones() {
  router.push('/cazar-dragones')
}

const soyAnfitrion = computed(() => espera.value?.anfitrionId === usuarioId)
const enlaceSala = computed(() => {
  const salaCodigo = espera.value?.codigo
  if (!salaCodigo || !ipRed.value) return ''
  const puerto = location.port ? `:${location.port}` : ''
  return `${location.protocol}//${ipRed.value}${puerto}/online?sala=${salaCodigo}`
})
const textoErrorSala = computed(() => {
  if (errorSala.value === 'Esa sala no existe.') {
    return 'Esa sala no existe en este computador. Abre el enlace que te pasó tu amigo. El código no sirve si cada uno entra por su propio localhost.'
  }
  return errorSala.value
})
const apuntando = computed(() => {
  const id = boosterActivo.value
  if (id === null) return false
  return !BOOSTERS.find((b) => b.id === id)?.propio
})

const ahora = ref(Date.now())

function efectoDe(id: string): Efecto['tipo'] | null {
  const efecto = efectos.value[id]
  if (!efecto || efecto.hasta <= ahora.value) return null
  return efecto.tipo
}

const estoyCongelado = computed(() => efectoDe(usuarioId) === 'hielo')
const estoySaboteado = computed(() => efectoDe(usuarioId) === 'sabotaje')
const tengoSuerte = computed(() => efectoDe(usuarioId) === 'suerte')
const tengoEscudo = computed(() => efectoDe(usuarioId) === 'escudo')

function pararCarga() {
  if (cierreCarga) clearTimeout(cierreCarga)
  cierreCarga = null
}

watch(fase, (valor, anterior) => {
  if (valor === 'cola' && anterior !== 'cola') {
    entrada.value = false
    pararCarga()
  }
  if (valor === 'jugando' && anterior !== 'jugando') {
    reiniciarNiebla()
    nieblaProgramada.value = false
    entrada.value = true
    pararCarga()
    cierreCarga = window.setTimeout(() => {
      entrada.value = false
      cierreCarga = null
    }, 900)
  }
  if (valor === 'idle') {
    reiniciarNiebla()
    nieblaProgramada.value = false
    entrada.value = false
    pararCarga()
  }
})

function intentarEventoNiebla() {
  if (nieblaProgramada.value || faseNiebla.value !== 'idle') return
  if (fase.value !== 'jugando' || showRuleta.value || entrada.value) return
  if (progresoMetodo.value < UMBRAL_PROGRESO_NIEBLA) return
  if (!startFogEvent()) return
  nieblaProgramada.value = true
}

watch([progresoMetodo, fase, showRuleta, entrada], () => {
  intentarEventoNiebla()
})

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || '?'
}

function retrato(nombre: string, avatarUrl?: string | null): string | null {
  return avatarUrl || retratoPorNombre(nombre)
}

function cantidad(id: number): number {
  return Math.max(0, progress.boosterCount(id) - (gastados.value[id] ?? 0))
}

function puedeApuntar(id: string): boolean {
  return apuntando.value && id !== usuarioId
}

function marcarCelda(i: number) {
  if (bloqueaCarton() || nieblaIndices.value.includes(i)) return
  if (estoyCongelado.value) {
    online.mostrarAviso('Estás congelado.')
    return
  }
  if (estoySaboteado.value) {
    online.mostrarAviso('Tu cartón está saboteado.')
    return
  }
  const antes = tuCarton.value[i]
  if (!antes || antes.free) return
  const estabaMarcada = antes.marked
  online.marcarCelda(i)
  if (!estabaMarcada && tuCarton.value[i]?.marked) intentarEventoNiebla()
}

function onMetodoElegido() {
  online.onMetodoElegido()
}

function jugar() {
  boosterActivo.value = null
  online.buscar()
}

function cancelarBusqueda() {
  entrada.value = false
  online.cancelar()
}

async function buscarIpRed() {
  const host = location.hostname
  if (host !== 'localhost' && host !== '127.0.0.1') {
    ipRed.value = host
    return
  }
  try {
    const respuesta = await fetch('/api/red-local')
    const data = (await respuesta.json()) as { ip?: string }
    if (data.ip) ipRed.value = data.ip
  } catch {
    ipRed.value = ''
  }
}

async function copiarEnlace() {
  if (!enlaceSala.value) return
  await navigator.clipboard.writeText(enlaceSala.value)
  copiado.value = true
}

function crear() {
  copiado.value = false
  online.crearSala()
}

function unirse() {
  online.unirseSala(codigo.value)
}

watch(espera, (salaEspera) => {
  if (!salaEspera) return
  abriendoUnion.value = false
  codigo.value = ''
})

function empezar() {
  online.empezarSala()
}

function volverSala() {
  online.salirSala()
}

function cantar() {
  if (bloqueaCarton()) return
  online.cantar()
}

function jugarOtraVez() {
  gastados.value = {}
  efectos.value = {}
  boosterActivo.value = null
  online.reiniciar()
  online.buscar()
}

function salir() {
  online.desconectar()
  void router.push('/lobby')
}

function atras() {
  if (fase.value === 'cola') {
    cancelarBusqueda()
    return
  }
  if (entrada.value) {
    salir()
    return
  }
  if (enPartida.value) {
    salir()
    return
  }
  if (espera.value) {
    volverSala()
    return
  }
  salir()
}

function enviarTexto(texto: string) {
  online.enviarChat(texto)
}

function pulsarBooster(id: number) {
  if (fase.value !== 'jugando') return
  if (cantidad(id) <= 0) return
  const booster = BOOSTERS.find((item) => item.id === id)
  if (!booster) return
  if (booster.propio) {
    disparar(id, usuarioId)
    return
  }
  boosterActivo.value = boosterActivo.value === id ? null : id
}

function elegirObjetivo(id: string) {
  if (!puedeApuntar(id) || boosterActivo.value === null) return
  const boosterId = boosterActivo.value
  boosterActivo.value = null
  disparar(boosterId, id)
}

function disparar(boosterId: number, objetivoId: string) {
  if (cantidad(boosterId) <= 0) return
  gastados.value = { ...gastados.value, [boosterId]: (gastados.value[boosterId] ?? 0) + 1 }
  online.lanzarBooster(boosterId, objetivoId)
  animarVuelo({ deId: usuarioId, deNombre: '', boosterId, objetivoId })
}

function animarVuelo(vuelo: VueloBoosterOnline) {
  const origen = document.querySelector(`[data-booster="${vuelo.boosterId}"]`)
  const destino = document.querySelector(`[data-jugador="${vuelo.objetivoId}"]`)
  if (!(origen instanceof HTMLElement) || !(destino instanceof HTMLElement)) {
    aplicarEfecto(vuelo)
    return
  }
  const desde = origen.getBoundingClientRect()
  const hacia = destino.getBoundingClientRect()
  const id = ++proyectilSeq
  proyectiles.value = [
    ...proyectiles.value,
    { id, boosterId: vuelo.boosterId, x: desde.left + desde.width / 2 - 11, y: desde.top + desde.height / 2 - 11 },
  ]
  requestAnimationFrame(() => {
    proyectiles.value = proyectiles.value.map((bola) =>
      bola.id === id
        ? { ...bola, x: hacia.left + hacia.width / 2 - 11, y: hacia.top + hacia.height / 2 - 11 }
        : bola,
    )
  })
  window.setTimeout(() => {
    proyectiles.value = proyectiles.value.filter((bola) => bola.id !== id)
    aplicarEfecto(vuelo)
  }, 700)
}

function aplicarEfecto(vuelo: VueloBoosterOnline) {
  if ((vuelo.boosterId === 1 || vuelo.boosterId === 2) && vuelo.objetivoId === usuarioId && tengoEscudo.value) {
    return
  }
  const tipo =
    vuelo.boosterId === 1 ? 'hielo' : vuelo.boosterId === 2 ? 'sabotaje' : vuelo.boosterId === 3 ? 'suerte' : 'escudo'
  const segundos = vuelo.boosterId === 4 ? 12 : 8
  efectos.value = {
    ...efectos.value,
    [vuelo.objetivoId]: { tipo, hasta: Date.now() + segundos * 1000 },
  }
}

function alVuelo(evento: Event) {
  const vuelo = (evento as CustomEvent<VueloBoosterOnline>).detail
  if (!vuelo || vuelo.deId === usuarioId) return
  animarVuelo(vuelo)
}

onMounted(() => {
  buscarIpRed()
  const salaInvitada = String(route.query.sala ?? '').trim().toUpperCase()
  if (/^[A-Z0-9]{4}$/.test(salaInvitada)) {
    codigo.value = salaInvitada
    abriendoUnion.value = true
    online.unirseSala(salaInvitada)
  }
  window.addEventListener('df-booster-vuelo', alVuelo)
  relojEfectos = setInterval(() => {
    ahora.value = Date.now()
  }, 400)
})

onUnmounted(() => {
  window.removeEventListener('df-booster-vuelo', alVuelo)
  if (relojEfectos) clearInterval(relojEfectos)
  pararCarga()
})
</script>

<style scoped>
.online {
  min-height: 100vh;
  min-height: 100dvh;
  /* El ancho del cartón se calcula contra el alto disponible para que el
     tablero y el botón ¡BINGO! quepan siempre en pantalla */
  --board-w: min(440px, 86vw);
  --board-h-reserve: 260px;
  background:
    linear-gradient(180deg, rgba(4, 10, 24, 0.55), rgba(4, 8, 18, 0.78)),
    url('@/assets/img/fondo.png') center / cover no-repeat;
  font-family: Georgia, 'Times New Roman', serif;
  color: #e8e0c8;
  --noche-borde: rgba(191, 157, 83, 0.38);
  --oro-brillo: rgba(211, 171, 83, 0.24);
}

.carga,
.hub,
.partida {
  height: 100%;
}

.carga {
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(82px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom));
}

.panel-carga {
  width: min(440px, 100%);
  min-height: 430px;
  box-sizing: border-box;
  padding: 32px clamp(18px, 5vw, 42px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  text-align: center;
  border: 1px solid var(--noche-borde);
  border-radius: 22px;
  background: radial-gradient(ellipse at 50% 28%, rgba(31, 54, 91, .3), transparent 58%), rgba(5, 10, 21, .86);
  box-shadow: inset 0 0 36px rgba(211, 171, 83, .06), 0 22px 65px rgba(0, 0, 0, .5), 0 0 30px rgba(50, 85, 143, .16);
  backdrop-filter: blur(8px);
}

.emblema-carga {
  position: relative;
  width: 210px;
  height: 210px;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.emblema-carga::before {
  content: '';
  position: absolute;
  inset: 26%;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 200, 106, .25), rgba(48, 76, 123, .2) 50%, transparent 74%);
  filter: blur(10px);
  animation: resplandor-runa 3s ease-in-out infinite;
}

.sello-aro {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(232, 200, 106, .48);
}

.aro-exterior { inset: 8px; border-top-color: #f0d78c; border-bottom-color: rgba(122, 162, 232, .5); animation: sello-gira 14s linear infinite; }
.aro-interior { inset: 23px; border-style: dashed; border-color: rgba(142, 176, 232, .52); animation: sello-gira 22s linear infinite reverse; }

.dragon-carga {
  width: 132px;
  height: 132px;
  object-fit: contain;
  filter: drop-shadow(0 0 16px rgba(232, 200, 106, .28)) drop-shadow(0 12px 15px rgba(0, 0, 0, .55));
  animation: dragon-respira 3.2s ease-in-out infinite;
}

.runa { position: absolute; color: #f0d78c; text-shadow: 0 0 12px rgba(232, 200, 106, .7); }
.runa-uno { top: 16px; left: 52%; animation: runa-pulsa 2.4s ease-in-out infinite; }
.runa-dos { right: 10px; top: 52%; color: #a9c6f4; animation: runa-pulsa 2.4s ease-in-out .8s infinite; }
.runa-tres { bottom: 17px; left: 29%; animation: runa-pulsa 2.4s ease-in-out 1.5s infinite; }

.cargando {
  margin: 0;
  letter-spacing: 0.2em;
  color: #f0d78c;
  font-weight: 700;
  font-size: clamp(.86rem, 3vw, 1.05rem);
}

.carga-detalle {
  margin: 8px 0 0;
  max-width: 30ch;
  color: #c6d2e5;
  line-height: 1.5;
}

.rastreo-carga {
  width: min(250px, 74vw);
  height: 3px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(142, 176, 232, .2);
}

.rastreo-carga span {
  display: block;
  width: 36%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #e8c86a, #8eb0e8, transparent);
  animation: rastreo-magico 1.8s ease-in-out infinite;
}

@keyframes sello-gira { to { transform: rotate(1turn); } }
@keyframes dragon-respira { 0%, 100% { transform: translateY(3px) scale(.98); } 50% { transform: translateY(-5px) scale(1.025); } }
@keyframes resplandor-runa { 0%, 100% { opacity: .48; transform: scale(.88); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes runa-pulsa { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
@keyframes rastreo-magico { from { transform: translateX(-125%); } to { transform: translateX(380%); } }

.carga.preparando .panel-carga {
  border-color: rgba(142, 176, 232, .52);
}

.btn-salir-carga,
.accion {
  min-width: 210px;
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: linear-gradient(180deg, #263d68, #172747);
  color: #f0d78c;
  letter-spacing: 0.16em;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.accion.suave,
.btn-salir-carga {
  min-width: min(240px, 100%);
  background: linear-gradient(180deg, #1b2c4b, #111d33);
  border: 1px solid rgba(191, 157, 83, .42);
}

.btn-atras {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 20;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid rgba(0, 200, 255, 0.55);
  background: rgba(4, 16, 40, 0.8);
  color: #e8f4ff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.btn-atras:hover {
  background: rgba(0, 70, 130, 0.9);
}

.hub {
  display: flex;
  flex-direction: column;
  padding: clamp(18px, 3vh, 34px) clamp(16px, 3vw, 48px) 24px;
  gap: 12px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f0d78c;
  letter-spacing: 0.06em;
  min-height: 44px;
  padding: 0 8px;
}

.conexion {
  color: #f0b4b4;
  letter-spacing: 0.12em;
  font-size: 0.82rem;
}

.conexion.on {
  color: #9be7c4;
}

.cuerpo {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(220px, 0.82fr) minmax(320px, 1.35fr) minmax(250px, 0.9fr);
  gap: clamp(14px, 2vw, 28px);
  align-items: stretch;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

.panel {
  background: linear-gradient(155deg, rgba(17, 23, 34, 0.94), rgba(7, 12, 22, 0.9));
  border: 1px solid var(--noche-borde);
  border-radius: 14px;
  padding: 18px;
  box-shadow: inset 0 1px rgba(255, 235, 190, 0.035), 0 16px 38px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel h2,
.titulo {
  margin: 0;
  text-align: center;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f0d78c;
  font-size: 0.95rem;
}

.chat ul,
.ranking ol,
.lista ul,
.lista-room ul {
  list-style: none;
  margin: 10px 0;
  padding: 0;
  overflow: auto;
  flex: 1;
}

.chat li,
.ranking li,
.lista li,
.lista-room li {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.92rem;
}

.vacio,
.hint,
.col {
  color: #b7c6dc;
  text-align: center;
}

.chat form input,
.union input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid #35548a;
  background: rgba(6, 12, 24, 0.8);
  color: #f4f7ff;
  padding: 10px 12px;
}

.centro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  padding: clamp(16px, 2.5vw, 30px);
  border: 1px solid rgba(205, 169, 89, 0.3);
  border-radius: 18px;
  background: radial-gradient(ellipse at 50% 8%, rgba(104, 74, 31, 0.2), transparent 62%),
    linear-gradient(160deg, rgba(13, 17, 25, 0.86), rgba(6, 9, 16, 0.9));
  box-shadow: inset 0 0 38px rgba(206, 167, 84, 0.04), 0 20px 50px rgba(0, 0, 0, 0.3);
}

.encabezado-online { text-align: center; }
.sobrelinea { margin: 0 0 7px; color: #b89d61; font-size: 0.68rem; letter-spacing: 0.28em; }
.subtitulo-online { margin: 8px 0 0; color: #b9b4a8; font-size: 0.9rem; }
.acciones-online { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: min(100%, 470px); }
.acciones-online .accion { min-width: 0; width: 100%; padding: 13px 12px; font-size: 0.78rem; letter-spacing: 0.1em; border: 1px solid rgba(219, 190, 119, 0.25); }
.acciones-online .accion-principal { grid-column: 1 / -1; min-height: 54px; color: #fff3cc; border-color: rgba(237, 204, 126, 0.78); background: linear-gradient(180deg, #80632b, #493818); box-shadow: 0 0 24px var(--oro-brillo), inset 0 1px rgba(255,255,255,.18); font-size: 0.95rem; }
.acciones-online .accion-secundaria { background: linear-gradient(180deg, rgba(48, 54, 61, .96), rgba(25, 29, 36, .98)); }
.acciones-online .accion-caza { grid-column: 1 / -1; background: linear-gradient(180deg, #3d3023, #251d18); color: #e7c18b; }
.acciones-online .accion-salir { grid-column: 1 / -1; width: min(100%, 220px); justify-self: center; }
.acciones-online .accion:hover { filter: brightness(1.18); transform: translateY(-1px); }

.logo {
  width: min(300px, 34vw);
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.65));
}

.ranking .col {
  margin: 8px 0 0;
  letter-spacing: 0.16em;
  font-size: 0.75rem;
}

.puesto {
  width: 18px;
  color: #f0d78c;
}

.rnombre,
.lnombre {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.puntos {
  color: #f0d78c;
}

.mini-foto,
.foto {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #1b3054;
  border: 2px solid #8eb0e8;
  flex: 0 0 auto;
}

.mini-foto img,
.foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.partida {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 100dvh;
  height: 100dvh;
  box-sizing: border-box;
  padding: 12px 16px 16px;
  gap: 10px;
  position: relative;
}

.fila-jugadores {
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
}

.ficha {
  width: 132px;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.ficha .foto {
  width: 72px;
  height: 72px;
  border-width: 3px;
}

.fnombre,
.fmeta {
  max-width: 132px;
  overflow: visible;
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: center;
}

.fmeta {
  color: #b7c6dc;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ficha.yo .foto {
  border-color: #f0d78c;
}

.ficha.objetivo {
  cursor: pointer;
}

.ficha.objetivo .foto {
  box-shadow: 0 0 0 3px #7ad7ff, 0 0 16px #7ad7ff;
}

.ficha.hielo .foto {
  box-shadow: 0 0 0 3px #9ad7ff;
  filter: saturate(0.4);
}

.ficha.sabotaje .foto {
  box-shadow: 0 0 0 3px #e23b3b;
}

.ficha.suerte .foto,
.ficha.escudo .foto {
  box-shadow: 0 0 0 3px #f0d78c;
}

.mesa {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  column-gap: 28px;
  align-items: center;
}

.oraculo {
  justify-self: end;
}

.oraculo,
.carton-wrap,
.lista {
  text-align: center;
}

.carton-wrap {
  position: relative;
  justify-self: center;
}

.bola {
  width: 118px;
  height: 118px;
  margin: 0 auto 8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2.4rem;
  color: #10233f;
  background: radial-gradient(circle at 35% 30%, #fff, #dbe7ff 40%, #7aa2e8);
  box-shadow: 0 0 24px rgba(90, 140, 230, 0.55);
}

.bola.vacia {
  color: #9fb0c6;
  background: #17233a;
  box-shadow: none;
}

.lbl,
.metodo {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #d5e2f5;
  font-size: 0.78rem;
}

.metodo-esquina {
  position: static;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.metodo-esquina .metodo {
  margin: 0;
}

.metodo-esquina :deep(.method-preview) {
  padding: 5px;
  background: rgba(8, 16, 32, 0.82);
}

.recientes {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}

.mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #1b3054;
}

.letras {
  display: grid;
  width: var(--board-w);
  margin: 0 auto 8px;
  gap: 8px;
  letter-spacing: 0;
  text-align: center;
  color: #f0d78c;
}

.board {
  display: grid;
  gap: 8px;
  width: var(--board-w);
}

.metodo-lbl {
  text-align: center;
  color: #9fb0c6;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem;
  margin: 0 0 10px;
}

.metodo-lbl strong {
  color: #e8c86a;
}

.cell {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid #3d5f93;
  background: rgba(12, 28, 58, 0.88);
  color: #d7e4f7;
  font: inherit;
  font-weight: 700;
}

.cell.llamada {
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(122, 215, 255, 0.35);
}

.cell.marked,
.cell.free {
  background: linear-gradient(180deg, #3a2f10, #243018);
  color: #ffe9a8;
  border-color: #e8c86a;
}

.cell.win {
  background: linear-gradient(180deg, #e8c86a, #b58f2f);
  color: #1a1305;
}

.carton-wrap.congelado :deep(.board) {
  outline: 2px solid #9ad7ff;
  filter: saturate(0.55);
}

.carton-wrap.sabotaje :deep(.board) {
  outline: 2px solid #e23b3b;
}

.carton-wrap.suerte :deep(.board) {
  outline: 2px solid #f0d78c;
}

.lista {
  background: rgba(8, 16, 32, 0.72);
  border: 1px solid rgba(120, 160, 220, 0.35);
  border-radius: 16px;
  padding: 12px;
  justify-self: start;
  align-self: center;
  width: min(320px, 100%);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lista :deep(.chat-sala) {
  flex: 1;
  width: 100%;
  min-height: 0;
  max-height: none;
  background: transparent;
  border: 0;
  padding: 4px;
}

.lista ul {
  overflow: visible;
  flex: 0 0 auto;
}

.lista .lnombre {
  flex: 1 1 auto;
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
  overflow-wrap: anywhere;
}

.estado {
  color: #9be7c4;
  font-size: 0.75rem;
}

.barra {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  column-gap: 18px;
}

.barra-lado {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.boosters {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex: 0 0 auto;
}

.booster {
  width: 74px;
  height: 74px;
  border-radius: 12px;
  border: 1px solid #3d5f93;
  background: rgba(10, 22, 44, 0.85);
  color: #f0d78c;
  position: relative;
  cursor: pointer;
}

.booster img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.booster span {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 0.8rem;
}

.booster.activo {
  box-shadow: 0 0 0 2px #7ad7ff;
}

.booster.vacio {
  opacity: 0.45;
}

.bingo {
  display: block;
  margin: 0;
  justify-self: center;
  width: var(--board-w);
  font-size: 1.1rem;
}

.bingo.listo {
  color: #fff4ce;
  border: 1px solid #f0d78c;
  background: linear-gradient(180deg, #bd812e, #783b1f);
  box-shadow: 0 0 0 2px rgba(240, 215, 140, 0.22), 0 0 22px rgba(240, 151, 54, 0.48);
  animation: bingo-llama 1.15s ease-in-out infinite;
}

.bingo.listo:hover { filter: brightness(1.12); }
.bingo:disabled { cursor: default; }

@keyframes bingo-llama {
  0%, 100% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 0 2px rgba(240, 215, 140, 0.18), 0 0 14px rgba(240, 151, 54, 0.32); }
  50% { transform: scale(1.045); filter: brightness(1.18); box-shadow: 0 0 0 4px rgba(240, 215, 140, 0.3), 0 0 28px rgba(240, 151, 54, 0.62); }
}

/* El aviso ya no se coloca encima del botón ¡BINGO! (lo tapaba) */
.aviso {
  position: fixed;
  left: 50%;
  top: 76px;
  transform: translateX(-50%);
  max-width: min(92vw, 520px);
  text-align: center;
  background: #4a1f1f;
  border: 1px solid #a05050;
  color: #ffd7d7;
  padding: 12px 20px;
  border-radius: 10px;
  z-index: 10060;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 16, 0.72);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 18px;
  /* Si el modal no cabe, se desplaza en vez de recortarse */
  overflow-y: auto;
  z-index: 50;
}

.modal {
  width: min(440px, 92vw);
  background: rgba(10, 18, 34, 0.95);
  border: 1px solid #8eb0e8;
  border-radius: 16px;
  padding: 22px;
  text-align: center;
}

.modal.gane {
  border-color: #f0d78c;
}

.union input {
  margin: 12px 0;
  letter-spacing: 0.28em;
  text-align: center;
  text-transform: uppercase;
}

.acciones-modal {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.premio {
  color: #4fd07a;
  font-weight: 700;
}

.mini-board {
  width: min(340px, 78vw);
  margin: 18px auto;
  gap: 5px;
}

.mini-board .cell {
  font-size: clamp(0.7rem, 2.6vw, 1rem);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==========================================================================
   El cartón se limita también por el ALTO disponible: así el tablero y el
   botón ¡BINGO! siempre caben en pantalla sin hacer scroll.
   ========================================================================== */
@media (max-height: 820px) {
  .online {
    --board-w: min(440px, 86vw, calc(100dvh - var(--board-h-reserve)));
  }
}

/* Por debajo de 700px de ancho el oráculo se apila sobre el cartón:
   el cartón necesita reservado más alto */
@media (max-width: 700px) {
  .online {
    --board-h-reserve: 340px;
    --board-w: min(440px, 88vw, calc(100dvh - var(--board-h-reserve)));
    padding: 0;
  }

  .hub { height: auto; min-height: 100dvh; gap: 14px; padding: max(16px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom)); }
  .top { font-size: 0.84rem; }
  .cuerpo { flex: 1 0 auto; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .centro { grid-row: 1; padding: 22px 16px; gap: 10px; }
  .logo { width: min(220px, 58vw); }
  .subtitulo-online { max-width: 28ch; line-height: 1.45; }
  .panel { min-height: 220px; }
  .chat-sala { min-height: 220px; }
  .ranking { max-height: 260px; }
  .room .room-centro { width: 100%; box-sizing: border-box; padding: 64px 16px 20px; }
  .codigo { font-size: clamp(2rem, 12vw, 3.2rem); letter-spacing: 0.22em; }
  .partida { min-height: 100dvh; height: auto; grid-template-rows: auto auto auto; padding: max(58px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom)); gap: 12px; }
  .fila-jugadores { gap: 8px; flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; padding: 4px 2px 8px; }
  .ficha { width: 82px; flex: 0 0 82px; font-size: 0.8rem; }
  .ficha .foto { width: 48px; height: 48px; }

  .bar {
    padding-bottom: 8px;
  }

  .bar h1 {
    font-size: 1.1rem;
    letter-spacing: 0.18em;
  }

  .players {
    gap: 6px;
  }

  .mesa {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }
  .oraculo { order: 0; align-self: stretch; }
  .carton-wrap { order: 1; }
  .lista { order: 2; width: 100%; box-sizing: border-box; }
  .lista ul { max-height: 120px; overflow: auto; }
  .lista :deep(.chat-sala) { max-height: 190px; }

  .oraculo {
    min-width: 0;
  }

  .bola {
    width: 78px;
    height: 78px;
    font-size: 2rem;
    margin: 4px auto;
  }

  .recientes {
    gap: 5px;
    margin: 6px 0;
  }

  .mini {
    width: 30px;
    height: 30px;
    font-size: 0.8rem;
  }

  .bingo {
    margin-top: 0;
    min-height: 54px;
    padding: 10px 20px;
    position: sticky;
    bottom: max(8px, env(safe-area-inset-bottom));
    z-index: 5;
    box-shadow: 0 8px 24px rgba(0,0,0,.5), 0 0 18px rgba(211,171,83,.22);
  }
  .barra { grid-template-columns: 1fr; gap: 10px; align-items: center; }
  .barra-lado { justify-content: center; }
  .barra-lado[aria-hidden='true'] { display: none; }
  .boosters { justify-content: center; gap: 10px; }
  .booster { width: 58px; height: 58px; }
  .booster img { width: 38px; height: 38px; }
  .metodo-esquina { display: none; }

  .aviso {
    top: 62px;
    font-size: 0.85rem;
    padding: 9px 14px;
  }
}

@media (min-width: 701px) and (max-width: 1050px) {
  .cuerpo { grid-template-columns: minmax(190px, .8fr) minmax(300px, 1.2fr); }
  .ranking { grid-column: 1 / -1; max-height: 210px; }
  .ranking ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  .sello-aro,
  .dragon-carga,
  .emblema-carga::before,
  .runa,
  .rastreo-carga span { animation: none !important; }
}

@media (max-height: 560px) {
  .carga { padding-top: 66px; padding-bottom: 16px; }
  .panel-carga { min-height: 0; padding-block: 18px; gap: 10px; }
  .emblema-carga { width: 148px; height: 148px; }
  .dragon-carga { width: 90px; height: 90px; }
  .aro-exterior { inset: 4px; }
  .aro-interior { inset: 16px; }
}

/* Pantallas muy bajas (landscape): el cartón se reduce al mínimo usable */
@media (max-height: 520px) {
  .online {
    --board-w: min(300px, 60vw, calc(100dvh - 220px));
  }
}
</style>
