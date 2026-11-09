<template>
  <div class="caza">
    <button type="button" class="btn-atras" aria-label="Volver" @click="atras">←</button>
    <section v-if="fase === 'hub'" class="centro hub-caza">
      <p class="kicker">Evento</p>
      <h1>Cazar dragones</h1>
      <DragonAncestral class="retrato" role="img" aria-label="Dragón Ancestral" />
      <div class="reglas-caza">
        <p class="texto"><strong>2 cazadores contra el dragón</strong> · fila, columna o diagonal.</p>
        <p class="texto"><strong>Ambos deben ganar</strong> para girar la ruleta de diamantes.</p>
        <p class="texto"><strong>Marca cada bola a tiempo</strong> para mantener visible el cartón.</p>
      </div>
      <p v-if="error" class="aviso">{{ error }}</p>
      <div class="acciones-caza">
        <button type="button" class="accion accion-principal" :disabled="!conectado" @click="buscar">
          {{ conectado ? 'BUSCAR CAZADOR' : 'CONECTANDO…' }}
        </button>
        <button type="button" class="accion" :disabled="!conectado" @click="crearSala">CREAR SALA</button>
        <button type="button" class="accion" :disabled="!conectado" @click="abriendoUnion = true">UNIRSE A UNA SALA</button>
        <button type="button" class="accion suave accion-volver" @click="volver">VOLVER</button>
      </div>
    </section>

    <section v-else-if="fase === 'sala'" class="centro sala-caza">
      <p class="kicker">SALA PRIVADA</p>
      <p class="codigo">{{ sala?.codigo }}</p>
      <button type="button" class="accion" @click="copiarCodigo">
        {{ copiado ? 'COPIADO' : 'COPIAR CÓDIGO' }}
      </button>
      <ul class="lista-sala">
        <li v-for="jugador in sala?.jugadores ?? []" :key="jugador.id">
          <span>{{ jugador.nombre }}</span>
          <strong v-if="jugador.id === sala?.anfitrionId">anfitrión</strong>
        </li>
      </ul>
      <button
        v-if="soyAnfitrion"
        type="button"
        class="accion"
        :disabled="(sala?.jugadores.length ?? 0) < 2"
        @click="empezar"
      >
        EMPEZAR
      </button>
      <p v-else class="texto">Esperando a que el anfitrión empiece.</p>
      <p v-if="error" class="aviso">{{ error }}</p>
      <button type="button" class="accion suave" @click="salirSala">SALIR</button>
    </section>

    <section v-else-if="fase === 'esperando'" class="centro">
      <div class="dragon-busqueda" role="img" aria-label="Dragón Ancestral explorando la niebla">
        <span class="brasa brasa-una"></span>
        <span class="brasa brasa-dos"></span>
        <DragonAncestral class="retrato" aria-hidden="true" />
        <span class="anillo-busqueda"></span>
      </div>
      <p class="kicker">La cacería comienza</p>
      <h1>Buscando cazador</h1>
      <p class="texto estado-busqueda">{{ esperando }} de 2 cazadores reunidos. El dragón rastrea a otro rival…</p>
      <div class="progreso-busqueda" role="status" aria-label="Buscando otro cazador"><span></span></div>
      <button type="button" class="accion suave" @click="salir">SALIR</button>
    </section>

    <section v-else class="partida">
      <header class="top">
        <span class="monedero">◆ {{ progress.diamonds }}</span>
        <span class="estado-caza"><i :class="{ conectado }"></i>{{ conectado ? 'Cacería en curso' : 'Sin conexión' }}</span>
      </header>

      <section class="cazadores" aria-label="Cazadores en la partida">
        <article
          v-for="(cazador, indice) in cazadores"
          :key="cazador.id"
          class="ficha-cazador"
          :class="{ yo: cazador.id === usuarioId, victoria: cazador.gano }"
        >
          <span class="retrato-cazador" aria-hidden="true">{{ inicial(cazador.nombre) }}</span>
          <span class="datos-cazador">
            <small>Cazador {{ String(indice + 1).padStart(2, '0') }}{{ cazador.id === usuarioId ? ' · TÚ' : '' }}</small>
            <strong>{{ cazador.nombre }}</strong>
          </span>
          <span class="estado-cazador">{{ cazador.gano ? '¡BINGO!' : 'EN CAZA' }}</span>
        </article>
      </section>

      <div class="mesa">
        <div class="oraculo">
          <div class="bola" :class="{ vacia: ultimaBola === null }">{{ ultimaBola ?? '—' }}</div>
          <p class="lbl">Última bola</p>
          <p class="llamadas-total">{{ llamadas.length }} / 75</p>
        </div>

        <div class="carton-wrap carton-jugador">
          <p class="titulo-carton">Tu cartón</p>
          <p class="letras">BINGO</p>
          <div class="grid-nube">
            <div class="board">
              <button
                v-for="(celda, i) in carton"
                :key="i"
                type="button"
                class="cell"
                :class="{
                  free: celda.free,
                  marked: celda.marked,
                  win: indicesGanadores.includes(i),
                  llamada: esLlamada(celda),
                }"
                @click="marcar(i)"
              >
                <span v-if="celda.free">FREE</span>
                <span v-else>{{ celda.number }}</span>
              </button>
            </div>
            <div
              v-if="opacidadNube > 0"
              class="nube-oscuridad"
              :style="{ opacity: opacidadNube / 100 }"
              aria-hidden="true"
            ></div>
          </div>
        </div>

        <aside class="panel panel-dragon">
          <div class="dragon-encabezado">
            <DragonAncestral class="dragon" aria-hidden="true" />
            <div class="dragon-datos">
              <p class="titulo-carton">Rival</p>
              <h2>Dragón Ancestral</h2>
              <p class="amenaza-texto">Amenaza · {{ Math.round(dragonAmenaza * 100) }}%</p>
              <div class="barra-amenaza" role="progressbar" :aria-valuenow="Math.round(dragonAmenaza * 100)" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso del patrón del dragón">
                <span :style="{ width: `${dragonAmenaza * 100}%` }"></span>
              </div>
            </div>
          </div>
          <div class="dragon-conteo">
            <span>Casillas cubiertas</span>
            <strong>{{ dragonMarcadas }} / 24</strong>
          </div>
          <p class="letras letras-dragon" aria-hidden="true">BINGO</p>
          <div class="board board-dragon" role="grid" aria-label="Cartón del Dragón Ancestral">
            <div
              v-for="(celda, i) in dragonCarton"
              :key="i"
              class="cell"
              :class="{ free: celda.free, 'marcada-dragon': celda.marked && !celda.free, win: dragonIndicesAmenaza.includes(i) }"
              role="gridcell"
              :aria-label="celda.free ? 'Libre' : `${celda.number}${celda.marked ? ', cubierta' : ''}`"
            >
              <span v-if="celda.free">✦</span>
              <span v-else>{{ celda.number }}</span>
            </div>
          </div>
        </aside>
      </div>

      <div class="barra">
        <button type="button" class="bingo" :disabled="fase !== 'jugando'" @click="cantar">¡BINGO!</button>
        <button type="button" class="accion suave" @click="salir">SALIR</button>
      </div>
      <p v-if="aviso" class="aviso flotante">{{ aviso }}</p>
    </section>

    <div v-if="abriendoUnion" class="modal-backdrop" @click.self="abriendoUnion = false">
      <form class="modal" @submit.prevent="unirseCodigo">
        <h2>UNIRSE</h2>
        <p class="texto">Escribe el código de la caza.</p>
        <input v-model="codigoUnion" maxlength="4" pattern="[A-Za-z]{4}" placeholder="CÓDIGO" autocomplete="off" @input="codigoUnion = codigoUnion.replace(/[^a-z]/gi, '').toUpperCase()" />
        <button type="submit" class="accion">ENTRAR</button>
        <button type="button" class="accion suave" @click="abriendoUnion = false">CANCELAR</button>
      </form>
    </div>

    <div v-if="fase === 'ruleta'" class="velo">
      <div class="ruleta-panel">
        <p class="kicker">Los dos vencieron al dragón</p>
        <h2>La ruleta</h2>
        <div class="aro">
          <span class="puntero" aria-hidden="true"></span>
          <div
            class="rueda"
            :class="{ gira: girando }"
            :style="{ transform: `rotate(${giro}deg)`, background: fondoRuleta }"
            @transitionend="alFinGiro"
          ></div>
        </div>
        <ul class="leyenda">
          <li
            v-for="premio in premios"
            :key="premio.diamantes"
            :class="{ caido: aterrizo && premio.diamantes === premioCaido }"
          >
            <span class="muestra" :style="{ background: premio.color }"></span>
            {{ formato(premio.diamantes) }} diamantes
          </li>
        </ul>
        <p v-if="aterrizo" class="texto">
          {{
            pagado
              ? `Cada cazador recibe ${formato(premioCaido)} diamantes y 100 XP.`
              : `La ruleta cayó en ${formato(premioCaido)}, pero no se pudo guardar el premio.`
          }}
        </p>
        <button v-if="aterrizo" type="button" class="accion" @click="volver">VOLVER</button>
      </div>
    </div>

    <div v-if="fase === 'fin'" class="velo">
      <div class="ruleta-panel">
        <DragonAncestral class="retrato" aria-hidden="true" />
        <h2>La caza terminó</h2>
        <p class="texto">{{ mensajeFin }}</p>
        <button type="button" class="accion" @click="volver">VOLVER</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DragonAncestral from '../components/DragonAncestral.vue'
import { crearSocketOnline } from '../api/socket'
import type { BingoCell } from '../domain/bingo/tipos'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'

const PREMIOS = [
  { diamantes: 10000, peso: 2, color: '#e6c35c' },
  { diamantes: 500, peso: 8, color: '#1d4e89' },
  { diamantes: 350, peso: 15, color: '#0e6b4f' },
  { diamantes: 250, peso: 25, color: '#3d2a6b' },
  { diamantes: 180, peso: 25, color: '#8a3a1b' },
  { diamantes: 100, peso: 25, color: '#6b1d3a' },
] as const

const fondoRuleta = (() => {
  let acumulado = 0
  const partes: string[] = []
  for (const premio of PREMIOS) {
    const inicio = (acumulado / 100) * 360
    acumulado += premio.peso
    const fin = (acumulado / 100) * 360
    partes.push(`${premio.color} ${inicio}deg ${fin}deg`)
  }
  return `conic-gradient(${partes.join(', ')})`
})()

interface CazadorVista {
  id: string
  nombre: string
  gano: boolean
}

interface VistaCaza {
  calledList: number[]
  lastDrawn: number | null
  tuCarton: BingoCell[]
  indicesGanadores: number[]
  cazadores: CazadorVista[]
  dragonMarcadas: number
  dragonCarton: BingoCell[]
}

interface JugadorSala {
  id: string
  nombre: string
}

interface SalaCaza {
  codigo: string
  anfitrionId: string
  jugadores: JugadorSala[]
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const progress = useProgressStore()
const usuarioId = auth.usuario?.id ?? ''
const socket = crearSocketOnline()

const fase = ref<'hub' | 'sala' | 'esperando' | 'jugando' | 'ruleta' | 'fin'>('hub')
const sala = ref<SalaCaza | null>(null)
const abriendoUnion = ref(false)
const codigoUnion = ref('')
const copiado = ref(false)
const codigoUrlBruto = String(route.query.caza ?? '').trim().toUpperCase()
const codigoUrl = /^[A-Z]{4}$/.test(codigoUrlBruto) ? codigoUrlBruto : ''
const conectado = ref(false)
const esperando = ref(0)
const error = ref('')
const aviso = ref('')
const carton = ref<BingoCell[]>([])
const llamadas = ref<number[]>([])
const ultimaBola = ref<number | null>(null)
const indicesGanadores = ref<number[]>([])
const cazadores = ref<CazadorVista[]>([])
const dragonMarcadas = ref(0)
const dragonCarton = ref<BingoCell[]>([])
const mensajeFin = ref('')
const girando = ref(false)
const giro = ref(0)
const aterrizo = ref(false)
const premioCaido = ref(0)
const pagado = ref(false)
const premios = PREMIOS
let quiereBuscar = false
let cerrando = false

const lineasDragon = [
  ...Array.from({ length: 5 }, (_, fila) => Array.from({ length: 5 }, (_, columna) => fila * 5 + columna)),
  ...Array.from({ length: 5 }, (_, columna) => Array.from({ length: 5 }, (_, fila) => fila * 5 + columna)),
  Array.from({ length: 5 }, (_, i) => i * 6),
  Array.from({ length: 5 }, (_, i) => (i + 1) * 4),
]

const dragonAmenazaEstado = computed(() => {
  let progreso = 0
  let indices: number[] = []
  for (const linea of lineasDragon) {
    const cubiertas = linea.filter((indice) => dragonCarton.value[indice]?.marked).length
    if (cubiertas > progreso) {
      progreso = cubiertas
      indices = linea
    }
  }
  return { progreso: progreso / 5, indices }
})
const dragonAmenaza = computed(() => dragonAmenazaEstado.value.progreso)
const dragonIndicesAmenaza = computed(() => dragonAmenazaEstado.value.indices)

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toLocaleUpperCase('es-CO') || 'C'
}

const soyAnfitrion = computed(() => sala.value?.anfitrionId === usuarioId)

function formato(valor: number): string {
  return valor.toLocaleString('es-CO')
}

function esLlamada(celda: BingoCell): boolean {
  return !celda.free && llamadas.value.includes(celda.number)
}

/** Igual que en la campaña: 5 bolas sin marcar abren la nube al 20%. Cada 2 más suman 20%. Cada marca quita 10%. */
const opacidadNube = computed(() => {
  if (fase.value !== 'jugando') return 0
  const lista = llamadas.value
  const tablero = carton.value
  let sinMarca = 0
  let marcas = 0
  for (const celda of tablero) {
    if (!celda.free && celda.marked) marcas++
  }
  for (let i = 0; i < lista.length; i++) {
    const numero = lista[i]
    const celda = tablero.find((item) => !item.free && item.number === numero)
    if (!celda) {
      if (i < lista.length - 1) sinMarca++
      continue
    }
    if (celda.marked) continue
    if (i < lista.length - 1) sinMarca++
  }
  if (sinMarca < 5) return 0
  const base = Math.min(100, 20 + Math.floor((sinMarca - 5) / 2) * 20)
  return Math.max(0, base - marcas * 10)
})

function fusionarCarton(nuevo: BingoCell[]) {
  const previas = new Set(carton.value.filter((celda) => celda.marked && !celda.free).map((celda) => celda.number))
  carton.value = nuevo.map((celda) => ({
    ...celda,
    marked: celda.free || previas.has(celda.number),
  }))
}

function aplicarVista(vista: VistaCaza) {
  if (fase.value === 'ruleta' || fase.value === 'fin') return
  fase.value = 'jugando'
  llamadas.value = vista.calledList
  ultimaBola.value = vista.lastDrawn
  indicesGanadores.value = vista.indicesGanadores
  cazadores.value = vista.cazadores
  dragonMarcadas.value = vista.dragonMarcadas
  dragonCarton.value = vista.dragonCarton
  fusionarCarton(vista.tuCarton)
}

function giroHasta(diamantes: number): number {
  let acumulado = 0
  for (const premio of PREMIOS) {
    const inicio = (acumulado / 100) * 360
    acumulado += premio.peso
    const fin = (acumulado / 100) * 360
    if (premio.diamantes === diamantes) return 360 * 6 - (inicio + fin) / 2
  }
  return 360 * 6
}

let relojRuleta: ReturnType<typeof setTimeout> | null = null

function abrirRuleta(diamantes: number, quedoPagado: boolean) {
  fase.value = 'ruleta'
  premioCaido.value = diamantes
  pagado.value = quedoPagado
  aterrizo.value = false
  girando.value = false
  giro.value = 0
  if (relojRuleta) clearTimeout(relojRuleta)
  void nextTick(() => {
    requestAnimationFrame(() => {
      girando.value = true
      giro.value = giroHasta(diamantes)
      relojRuleta = setTimeout(() => alFinGiro(), 5200)
    })
  })
}

function alFinGiro() {
  if (!girando.value || aterrizo.value) return
  aterrizo.value = true
  if (relojRuleta) clearTimeout(relojRuleta)
  if (pagado.value) void progress.hidratarDesdeApi().catch(() => {})
}

function emitirCuandoConecte(evento: string, payload?: unknown) {
  const mandar = () => socket.emit(evento, payload)
  if (socket.connected) mandar()
  else socket.once('connect', mandar)
}

function crearSala() {
  error.value = ''
  quiereBuscar = false
  emitirCuandoConecte('dragon:create')
}

function unirseCodigo() {
  const codigo = codigoUnion.value.trim().toUpperCase()
  if (!codigo) return
  error.value = ''
  quiereBuscar = false
  abriendoUnion.value = false
  codigoUnion.value = ''
  emitirCuandoConecte('dragon:code', { codigo })
}

function empezar() {
  error.value = ''
  socket.emit('dragon:start')
}

function salirSala() {
  socket.emit('dragon:room-leave')
  sala.value = null
  fase.value = 'hub'
  error.value = ''
}

async function copiarCodigo() {
  const codigo = sala.value?.codigo
  if (!codigo) return
  await navigator.clipboard.writeText(codigo)
  copiado.value = true
  window.setTimeout(() => {
    copiado.value = false
  }, 1600)
}

function buscar() {
  error.value = ''
  aviso.value = ''
  sala.value = null
  fase.value = 'esperando'
  esperando.value = 1
  quiereBuscar = true
  if (socket.connected) socket.emit('dragon:join')
}

function salir() {
  quiereBuscar = false
  socket.emit('dragon:leave')
  fase.value = 'hub'
  aviso.value = ''
}

function volver() {
  quiereBuscar = false
  socket.emit('dragon:leave')
  void router.push('/online')
}

function atras() {
  if (fase.value === 'sala') {
    salirSala()
    return
  }
  if (fase.value === 'esperando') {
    salir()
    return
  }
  volver()
}

function cantar() {
  aviso.value = ''
  socket.emit('dragon:claim')
}

function marcar(indice: number) {
  const celda = carton.value[indice]
  if (!celda || celda.free || fase.value !== 'jugando') return
  if (!celda.marked && !llamadas.value.includes(celda.number)) {
    aviso.value = 'Esa bola todavía no salió.'
    return
  }
  celda.marked = !celda.marked
  aviso.value = ''
}

onMounted(() => {
  socket.on('connect', () => {
    conectado.value = true
    error.value = ''
    if (quiereBuscar && fase.value === 'esperando') socket.emit('dragon:join')
    else if (codigoUrl && fase.value === 'hub') socket.emit('dragon:code', { codigo: codigoUrl })
  })
  socket.on('disconnect', () => {
    conectado.value = false
    if (cerrando) return
    if (fase.value === 'sala') {
      sala.value = null
      fase.value = 'hub'
      error.value = 'Se cortó la conexión.'
      return
    }
    if (fase.value === 'jugando' || fase.value === 'esperando') {
      quiereBuscar = false
      mensajeFin.value = 'Se cortó la conexión. La caza se cancela.'
      fase.value = 'fin'
    }
  })
  socket.on('connect_error', (err: Error) => {
    conectado.value = false
    error.value = err.message || 'No se pudo entrar a la caza.'
  })
  socket.on('dragon:sala', (vista: SalaCaza) => {
    if (fase.value === 'jugando' || fase.value === 'ruleta' || fase.value === 'fin') return
    sala.value = vista
    fase.value = 'sala'
    error.value = ''
    quiereBuscar = false
    abriendoUnion.value = false
  })
  socket.on('dragon:error', (data: { mensaje: string }) => {
    error.value = data.mensaje
  })
  socket.on('dragon:sala-cerrada', () => {
    sala.value = null
    if (fase.value === 'sala') fase.value = 'hub'
  })
  socket.on('dragon:esperando', (data: { esperando: number }) => {
    if (fase.value === 'jugando' || fase.value === 'ruleta' || fase.value === 'fin') return
    fase.value = 'esperando'
    esperando.value = data.esperando
  })
  socket.on('dragon:estado', (vista: VistaCaza) => {
    aplicarVista(vista)
  })
  socket.on('dragon:bola', (data: { numero: number }) => {
    if (fase.value !== 'jugando') return
    ultimaBola.value = data.numero
  })
  socket.on('dragon:rechazo', (data: { mensaje: string }) => {
    aviso.value = data.mensaje
  })
  socket.on('dragon:ruleta', (data: { diamantes: number; pagado: boolean }) => {
    quiereBuscar = false
    abrirRuleta(data.diamantes, data.pagado)
  })
  socket.on('dragon:fin', (data: { mensaje: string; xp?: number }) => {
    if (fase.value === 'ruleta') return
    quiereBuscar = false
    mensajeFin.value = data.xp ? `${data.mensaje} · +${data.xp} XP por participar.` : data.mensaje
    fase.value = 'fin'
  })
  socket.connect()
})

onUnmounted(() => {
  cerrando = true
  if (relojRuleta) clearTimeout(relojRuleta)
  if (fase.value === 'sala') socket.emit('dragon:room-leave')
  if (fase.value === 'esperando' || fase.value === 'jugando') socket.emit('dragon:leave')
  socket.removeAllListeners()
  socket.disconnect()
})
</script>

<style scoped>
.caza {
  min-height: 100vh;
  min-height: 100dvh;
  color: #e7eef8;
  background:
    linear-gradient(180deg, rgba(4, 10, 24, 0.62), rgba(4, 8, 18, 0.82)),
    url('@/assets/img/fondo.png') center / cover no-repeat;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --oro: #e6c875;
  --borde-oro: rgba(205, 169, 89, 0.38);
}

.centro,
.partida {
  height: 100%;
}

.centro {
  width: min(680px, 100%);
  max-height: 100dvh;
  margin: 0 auto;
  padding: max(76px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  overflow: auto;
  box-sizing: border-box;
}

.hub-caza {
  width: min(920px, 100%);
  justify-content: flex-start;
  margin: 0 auto;
  padding-top: max(74px, env(safe-area-inset-top));
}

.reglas-caza {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.reglas-caza .texto {
  padding: 14px;
  border: 1px solid rgba(205, 169, 89, 0.22);
  border-radius: 12px;
  background: rgba(10, 14, 22, 0.78);
  text-align: left;
  font-size: 0.92rem;
}

.reglas-caza strong { display: block; color: var(--oro); margin-bottom: 5px; }

.acciones-caza {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: min(100%, 520px);
  margin-top: 4px;
}

.acciones-caza .accion { min-width: 0; width: 100%; }
.acciones-caza .accion-principal { grid-column: 1 / -1; min-height: 54px; }
.acciones-caza .accion-volver { grid-column: 1 / -1; justify-self: center; width: min(100%, 240px); }

.kicker {
  margin: 0;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #f0d78c;
  font-size: 0.78rem;
}

h1,
h2 {
  margin: 0;
  font-weight: 700;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
}

.texto {
  margin: 0;
  line-height: 1.45;
  color: #d5e2f5;
}

.codigo {
  margin: 0;
  font-size: 2.4rem;
  letter-spacing: 0.35em;
  color: #f0d78c;
  font-weight: 800;
}

.enlace {
  margin: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: #9fd0ff;
  font-size: 0.92rem;
}

.lista-sala {
  list-style: none;
  margin: 0;
  padding: 0;
  width: min(360px, 100%);
}

.lista-sala li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
}

.modal {
  width: min(360px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(120, 160, 220, 0.4);
  background: #101a30;
}

.modal input {
  border-radius: 10px;
  border: 1px solid #35548a;
  background: rgba(6, 12, 24, 0.8);
  color: #f4f7ff;
  padding: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
}

.retrato {
  width: 140px;
  height: 140px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.45));
}

.dragon-busqueda {
  position: relative;
  width: 230px;
  height: 230px;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.dragon-busqueda::before {
  content: '';
  position: absolute;
  inset: 18%;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(219, 87, 35, 0.3), rgba(98, 35, 24, 0.12) 48%, transparent 72%);
  filter: blur(8px);
  animation: aliento-dragon 2.8s ease-in-out infinite;
}

.dragon-busqueda .retrato {
  width: 180px;
  height: 180px;
  animation: vigilia-dragon 3.6s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(204, 91, 45, 0.34));
}

.anillo-busqueda {
  position: absolute;
  inset: 9px;
  border: 1px solid rgba(230, 200, 117, 0.34);
  border-radius: 50%;
  border-top-color: var(--oro);
  animation: rastreo 5s linear infinite;
}

.brasa {
  position: absolute;
  bottom: 24%;
  left: 54%;
  z-index: 2;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ffb347;
  box-shadow: 0 0 12px 4px rgba(255, 112, 37, 0.58);
  animation: ascua 1.7s ease-out infinite;
}

.brasa-dos { animation-delay: 0.85s; left: 48%; }
.estado-busqueda { text-align: center; }
.progreso-busqueda { width: min(280px, 80vw); height: 3px; overflow: hidden; background: rgba(230, 200, 117, .18); border-radius: 99px; }
.progreso-busqueda span { display: block; width: 38%; height: 100%; background: linear-gradient(90deg, transparent, #e6c875, #ed7c3b, transparent); animation: rastreo-barra 1.8s ease-in-out infinite; }

@keyframes vigilia-dragon { 0%, 100% { transform: translateY(3px) scale(.98); } 50% { transform: translateY(-5px) scale(1.02); } }
@keyframes aliento-dragon { 0%, 100% { opacity: .45; transform: scale(.86); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes rastreo { to { transform: rotate(1turn); } }
@keyframes ascua { 0% { opacity: 0; transform: translateY(10px) scale(.5); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-34px) scale(0); } }
@keyframes rastreo-barra { 0% { transform: translateX(-120%); } 100% { transform: translateX(360%); } }

.accion,
.bingo {
  min-width: 220px;
  border: 0;
  border-radius: 12px;
  padding: 14px 18px;
  background: linear-gradient(180deg, #68522a, #3b2c18);
  border: 1px solid rgba(230, 200, 117, 0.42);
  color: #fff3d0;
  letter-spacing: 0.12em;
  font-weight: 800;
  cursor: pointer;
}

.accion:disabled {
  opacity: 0.55;
  cursor: default;
}

.accion.suave {
  background: transparent;
  border: 1px solid rgba(214, 196, 145, 0.42);
}

.accion-principal { background: linear-gradient(180deg, #9b542e, #5c2f20); box-shadow: 0 0 24px rgba(202, 94, 44, .2); }

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

.partida {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;
  gap: 8px;
  padding: 12px 18px 10px;
  box-sizing: border-box;
  overflow: hidden;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f0d78c;
  min-height: 28px;
  font-size: 0.84rem;
}

.monedero { font-weight: 800; }
.estado-caza { display: inline-flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: .12em; font-size: .68rem; }
.estado-caza i { width: 8px; height: 8px; border-radius: 50%; background: #d05b49; box-shadow: 0 0 10px currentColor; }
.estado-caza i.conectado { background: #77d39a; }

.cazadores { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: min(900px, 100%); align-self: center; }
.ficha-cazador { display: flex; align-items: center; min-width: 0; gap: 10px; padding: 7px 12px; border: 1px solid rgba(142, 175, 202, .24); border-radius: 12px; background: linear-gradient(110deg, rgba(17, 30, 47, .94), rgba(8, 15, 26, .76)); box-shadow: inset 0 1px rgba(255,255,255,.04), 0 5px 16px rgba(0,0,0,.18); }
.ficha-cazador.yo { border-color: rgba(230, 200, 117, .58); }
.ficha-cazador.victoria { box-shadow: inset 0 0 18px rgba(230, 200, 117, .12); }
.retrato-cazador { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(230, 200, 117, .7); background: radial-gradient(circle at 35% 25%, #586c6d, #172b37 72%); color: #ffe6a2; font: 700 1rem Georgia, serif; box-shadow: 0 0 14px rgba(230, 200, 117, .12); }
.datos-cazador { display: grid; min-width: 0; gap: 2px; text-align: left; }
.datos-cazador small { color: #bdcadd; font-size: .58rem; letter-spacing: .14em; }
.datos-cazador strong { overflow: hidden; color: #f4f0e8; font: 600 .92rem Georgia, serif; text-overflow: ellipsis; white-space: nowrap; }
.estado-cazador { margin-left: auto; color: #9eb2c4; font-size: .6rem; font-weight: 800; letter-spacing: .1em; white-space: nowrap; }
.victoria .estado-cazador { color: #ffe29a; }
.titulo-carton { margin: 0 0 3px; color: #f2d98e; font: 600 .78rem Georgia, serif; letter-spacing: .08em; text-transform: uppercase; }
.llamadas-total { margin: 5px 0 0; color: #aebbd0; font-size: .72rem; letter-spacing: .12em; }

.mesa {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 100px minmax(230px, 1fr) minmax(260px, 1fr);
  width: min(1100px, 100%);
  margin: 0 auto;
  gap: 18px;
  align-items: center;
  justify-content: center;
}

.oraculo,
.carton-wrap,
.panel {
  text-align: center;
}

.carton-wrap {
  position: relative;
  overflow: visible;
  min-width: 0;
}

.carton-jugador { padding: 8px 10px; border: 1px solid var(--borde-oro); border-radius: 14px; background: linear-gradient(155deg, rgba(17, 23, 34, .88), rgba(7, 12, 22, .76)); box-shadow: 0 12px 30px rgba(0, 0, 0, .24), inset 0 1px rgba(255,255,255,.04); }

.eclipse-nombre {
  margin: 0 0 6px;
  color: #f0d78c;
  letter-spacing: 0.18em;
  font-size: 12px;
}

.grid-nube {
  position: relative;
  z-index: 1;
}

.nube-oscuridad {
  position: absolute;
  top: -46%;
  left: -36%;
  width: 172%;
  height: 168%;
  z-index: 6;
  pointer-events: none;
  background: url('../assets/img/eclipse.jpg') center / cover no-repeat;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.55);
  transition: opacity 0.7s ease;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 46%, transparent 74%);
  mask-image: radial-gradient(ellipse at center, #000 46%, transparent 74%);
}

.bola {
  width: 108px;
  height: 108px;
  margin: 0 auto 8px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2.2rem;
  color: #10233f;
  background: radial-gradient(circle at 35% 30%, #fff, #dbe7ff 40%, #7aa2e8);
}

.bola.vacia {
  color: #9fb0c6;
  background: #17233a;
}

.lbl,
.letras {
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f0d78c;
}

.letras {
  margin: 0 0 8px;
  letter-spacing: 0.55em;
}

.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  width: min(100%, 34vh, 300px);
  margin: 0 auto;
}

.cell {
  display: grid;
  place-items: center;
  min-width: 0;
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

.cell.marcada-dragon { border-color: rgba(231, 145, 89, .86); background: linear-gradient(145deg, #743d29, #40242a); color: #ffe0ad; box-shadow: inset 0 0 10px rgba(227, 126, 67, .2), 0 0 7px rgba(227, 126, 67, .14); }
.cell.marcada-dragon.win { border-color: #f5d779; background: linear-gradient(145deg, #d59d47, #755027); color: #fff3ca; box-shadow: 0 0 12px rgba(242, 186, 88, .4); }

.panel {
  background: linear-gradient(155deg, rgba(17, 23, 34, 0.94), rgba(7, 12, 22, 0.9));
  border: 1px solid var(--borde-oro);
  border-radius: 16px;
  padding: 12px;
}

.panel-dragon {
  padding: 8px 10px;
  border: 1px solid var(--borde-oro);
  border-radius: 14px;
  background: linear-gradient(155deg, rgba(17, 23, 34, .88), rgba(7, 12, 22, .76));
  box-shadow: 0 12px 30px rgba(0, 0, 0, .24), inset 0 1px rgba(255,255,255,.04);
}

.dragon {
  flex: 0 0 92px;
  width: 92px;
  height: 76px;
}

.panel-dragon { display: flex; flex-direction: column; align-items: stretch; min-width: 0; }
.dragon-encabezado { display: flex; align-items: center; justify-content: center; gap: 4px; }
.dragon-datos { flex: 1; min-width: 0; text-align: left; }
.dragon-datos h2 { color: #f6ebcc; font-size: clamp(.82rem, 1.2vw, 1.05rem); }
.amenaza-texto { margin: 4px 0 3px; color: #ddad79; font-size: .66rem; }
.barra-amenaza { height: 5px; overflow: hidden; border-radius: 99px; background: rgba(235, 223, 202, .12); }
.barra-amenaza span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #9b5834, #e1b75e); box-shadow: 0 0 8px rgba(225, 164, 87, .44); transition: width .45s ease; }
.dragon-conteo { display: flex; justify-content: space-between; gap: 8px; margin: 2px auto 1px; width: min(100%, 240px); color: #bac3cf; font-size: .64rem; }
.dragon-conteo strong { color: #f1d891; }
.letras-dragon { margin-bottom: 4px; font-size: .6rem; }
.board-dragon { width: min(100%, 27vh, 218px); gap: 4px; }
.board-dragon .cell { border-radius: 5px; font-size: clamp(.54rem, 1.1vw, .78rem); cursor: default; }
.board-dragon .cell.free { background: linear-gradient(145deg, #78502a, #3c2d26); border-color: #d2a55a; }

.panel ul {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}

.panel li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}

.barra {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.barra .bingo { min-height: 42px; padding: 8px 26px; }
.partida .aviso.flotante { position: absolute; bottom: 58px; left: 50%; transform: translateX(-50%); z-index: 9; width: max-content; max-width: min(90%, 600px); padding: 8px 14px; border: 1px solid rgba(236, 130, 112, .5); border-radius: 10px; background: rgba(33, 16, 20, .95); box-shadow: 0 8px 24px rgba(0,0,0,.35); }

.aviso {
  color: #ffd0d0;
}

.aviso.flotante {
  text-align: center;
  margin: 8px 0 0;
}

.velo {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.82);
  display: grid;
  place-items: center;
  z-index: 20;
}

.ruleta-panel {
  width: min(520px, 92vw);
  padding: 22px 18px;
  border-radius: 18px;
  background: rgba(8, 18, 38, 0.94);
  border: 1px solid rgba(240, 215, 140, 0.45);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.aro {
  position: relative;
  width: 260px;
  height: 260px;
}

.puntero {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 22px solid #f0d78c;
}

.rueda {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 8px solid #10233f;
  box-shadow: inset 0 0 0 2px rgba(240, 215, 140, 0.8);
}

.rueda.gira {
  transition: transform 4.8s cubic-bezier(0.12, 0.7, 0.08, 1);
}

.leyenda {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  width: 100%;
}

.leyenda li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d5e2f5;
}

.leyenda li.caido {
  color: #ffe9a8;
  font-weight: 700;
}

.muestra {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

@media (max-width: 860px) {
  .hub-caza { justify-content: flex-start; }
  .reglas-caza { grid-template-columns: 1fr; }
  .reglas-caza .texto { padding: 11px 13px; }
  .mesa {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .partida { min-height: 100dvh; height: auto; padding: max(72px, env(safe-area-inset-top)) 14px max(20px, env(safe-area-inset-bottom)); gap: 14px; }
  .mesa { gap: 16px; }
  .oraculo { order: 0; }
  .carton-wrap { order: 1; }
  .panel { order: 2; }
  .barra { position: sticky; bottom: max(8px, env(safe-area-inset-bottom)); z-index: 8; padding: 8px; border: 1px solid var(--borde-oro); border-radius: 14px; background: rgba(8, 12, 19, .94); }
  .barra .bingo { flex: 1; min-width: 0; min-height: 52px; }
  .barra .accion { min-width: 90px; }
  .dragon-busqueda { width: 200px; height: 200px; }
}

@media (max-width: 860px) and (orientation: landscape) {
  .partida {
    height: 100dvh;
    min-height: 0;
    padding: max(36px, env(safe-area-inset-top)) max(7px, env(safe-area-inset-right)) max(5px, env(safe-area-inset-bottom)) max(7px, env(safe-area-inset-left));
    gap: 4px;
  }
  .top { min-height: 20px; font-size: .72rem; }
  .estado-caza { gap: 5px; font-size: .56rem; }
  .cazadores { gap: 6px; }
  .ficha-cazador { gap: 6px; min-height: 34px; padding: 3px 6px; border-radius: 9px; }
  .retrato-cazador { flex-basis: 28px; width: 28px; height: 28px; font-size: .78rem; }
  .datos-cazador small { font-size: .49rem; }
  .datos-cazador strong { font-size: .72rem; }
  .estado-cazador { font-size: .49rem; }
  .mesa { grid-template-columns: 58px minmax(0, 1fr) minmax(0, 1fr); gap: 6px; overflow: hidden; }
  .bola { width: min(52px, 14vh); height: min(52px, 14vh); margin-bottom: 3px; font-size: 1.25rem; }
  .lbl { margin: 0; font-size: .53rem; letter-spacing: .08em; }
  .llamadas-total { margin-top: 2px; font-size: .55rem; }
  .carton-jugador, .panel-dragon { order: initial; padding: 4px; border-radius: 9px; }
  .titulo-carton { margin-bottom: 1px; font-size: .58rem; }
  .letras { margin-bottom: 3px; font-size: .52rem; letter-spacing: .35em; }
  .board { width: min(100%, 31vh, 148px); gap: 3px; }
  .cell { border-radius: 4px; font-size: .68rem; }
  .dragon { flex-basis: 58px; width: 58px; height: 48px; }
  .dragon-encabezado { gap: 1px; }
  .dragon-datos h2 { font-size: .66rem; line-height: 1.05; }
  .amenaza-texto { margin: 2px 0; font-size: .51rem; }
  .barra-amenaza { height: 4px; }
  .dragon-conteo { width: 100%; margin: 1px auto; font-size: .51rem; }
  .letras-dragon { margin-bottom: 2px; }
  .board-dragon { width: min(100%, 31vh, 148px); gap: 2px; }
  .board-dragon .cell { border-radius: 3px; font-size: .55rem; }
  .barra { position: static; gap: 6px; padding: 0; border: 0; background: transparent; }
  .barra .bingo { min-width: 0; min-height: 30px; padding: 4px 14px; font-size: .72rem; }
  .barra .accion { min-width: 64px; padding: 5px 9px; font-size: .58rem; }
  .partida .aviso.flotante { bottom: 42px; padding: 5px 8px; font-size: .65rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
</style>
