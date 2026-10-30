<template>
  <div class="caza">
    <button type="button" class="btn-atras" aria-label="Volver" @click="atras">←</button>
    <section v-if="fase === 'hub'" class="centro">
      <p class="kicker">Evento</p>
      <h1>Cazar dragones</h1>
      <img class="retrato" :src="dragonSrc" alt="Dragón Ancestral" />
      <p class="texto">
        Tú y otro cazador se enfrentan al Dragón Ancestral. El cartón es de 5 por 5, con números del 1 al 75.
        Ganan con fila, columna o diagonal. Si el dragón completa el cartón antes, pierden los dos.
      </p>
      <p class="texto">
        Si los dos le ganan, sale una ruleta. El premio grande son 10.000 diamantes. Las demás recompensas van de 100 a 500.
      </p>
      <p class="texto">
        Noches de eclipse: si dejas pasar bolas sin marcar, una nube tapa el cartón y se oscurece de a poco. Al marcar, se aclara.
      </p>
      <p v-if="error" class="aviso">{{ error }}</p>
      <button type="button" class="accion" :disabled="!conectado" @click="buscar">
        {{ conectado ? 'BUSCAR CAZADOR' : 'CONECTANDO…' }}
      </button>
      <button type="button" class="accion" :disabled="!conectado" @click="crearSala">CREAR SALA</button>
      <button type="button" class="accion" :disabled="!conectado" @click="abriendoUnion = true">UNIRSE</button>
      <button type="button" class="accion suave" @click="volver">VOLVER</button>
    </section>

    <section v-else-if="fase === 'sala'" class="centro">
      <p class="kicker">Sala</p>
      <h1>Código</h1>
      <p class="codigo">{{ sala?.codigo }}</p>
      <p class="texto">
        Tu amigo entra a Online, abre Cazar dragones, pulsa UNIRSE y escribe este código. Los dos tienen que estar en el mismo juego.
      </p>
      <p v-if="enlaceSala" class="enlace">{{ enlaceSala }}</p>
      <button type="button" class="accion" @click="copiarCodigo">
        {{ copiado ? 'CÓDIGO COPIADO' : 'COPIAR CÓDIGO' }}
      </button>
      <button v-if="enlaceSala" type="button" class="accion" @click="copiarEnlace">
        {{ copiadoEnlace ? 'ENLACE COPIADO' : 'COPIAR ENLACE' }}
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
      <img class="retrato" :src="dragonSrc" alt="" />
      <h1>Buscando cazador</h1>
      <p class="texto">{{ esperando }} de 2 en la cola. Hace falta otro jugador real.</p>
      <button type="button" class="accion suave" @click="salir">SALIR</button>
    </section>

    <section v-else class="partida">
      <header class="top">
        <span>◆ {{ progress.diamonds }}</span>
        <span>{{ conectado ? 'caza en curso' : 'sin conexión' }}</span>
      </header>

      <div class="mesa">
        <div class="oraculo">
          <div class="bola" :class="{ vacia: ultimaBola === null }">{{ ultimaBola ?? '—' }}</div>
          <p class="lbl">Última bola</p>
        </div>

        <div class="carton-wrap">
          <p class="letras">BINGO</p>
          <p class="eclipse-nombre">Noches de eclipse</p>
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

        <aside class="panel">
          <img class="dragon" :src="dragonSrc" alt="Dragón Ancestral" />
          <h2>Dragón Ancestral</h2>
          <p>{{ dragonMarcadas }} números cubiertos</p>
          <ul>
            <li v-for="cazador in cazadores" :key="cazador.id">
              <span>{{ cazador.nombre }}{{ cazador.id === usuarioId ? ' (tú)' : '' }}</span>
              <strong>{{ cazador.gano ? 'bingo' : 'en caza' }}</strong>
            </li>
          </ul>
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
        <input v-model="codigoUnion" maxlength="4" placeholder="CÓDIGO" autocomplete="off" />
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
              ? `Cada cazador recibe ${formato(premioCaido)} diamantes.`
              : `La ruleta cayó en ${formato(premioCaido)}, pero no se pudo guardar el premio.`
          }}
        </p>
        <button v-if="aterrizo" type="button" class="accion" @click="volver">VOLVER</button>
      </div>
    </div>

    <div v-if="fase === 'fin'" class="velo">
      <div class="ruleta-panel">
        <img class="retrato" :src="dragonSrc" alt="" />
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
import dragonSrc from '@/assets/img/dragon.png'
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
const copiadoEnlace = ref(false)
const ipRed = ref('')
const codigoUrl = String(route.query.caza ?? '').trim().toUpperCase()
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
const mensajeFin = ref('')
const girando = ref(false)
const giro = ref(0)
const aterrizo = ref(false)
const premioCaido = ref(0)
const pagado = ref(false)
const premios = PREMIOS
let quiereBuscar = false
let cerrando = false

const soyAnfitrion = computed(() => sala.value?.anfitrionId === usuarioId)
const enlaceSala = computed(() => {
  if (!sala.value || !ipRed.value) return ''
  const puerto = location.port ? `:${location.port}` : ''
  return `${location.protocol}//${ipRed.value}${puerto}/cazar-dragones?caza=${sala.value.codigo}`
})

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

async function copiarEnlace() {
  if (!enlaceSala.value) return
  await navigator.clipboard.writeText(enlaceSala.value)
  copiadoEnlace.value = true
  window.setTimeout(() => {
    copiadoEnlace.value = false
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
  socket.on('dragon:fin', (data: { mensaje: string }) => {
    if (fase.value === 'ruleta') return
    quiereBuscar = false
    mensajeFin.value = data.mensaje
    fase.value = 'fin'
  })
  void buscarIpRed()
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
  height: 100%;
  color: #e7eef8;
  background:
    linear-gradient(180deg, rgba(4, 10, 24, 0.62), rgba(4, 8, 18, 0.82)),
    url('@/assets/img/fondo.png') center / cover no-repeat;
  font-family: Georgia, 'Times New Roman', serif;
}

.centro,
.partida {
  height: 100%;
}

.centro {
  max-width: 640px;
  margin: 0 auto;
  padding: 72px 20px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  overflow: auto;
  box-sizing: border-box;
}

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

.accion,
.bingo {
  min-width: 220px;
  border: 0;
  border-radius: 12px;
  padding: 14px 18px;
  background: linear-gradient(180deg, #2a63d6, #17398a);
  color: white;
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
  border: 1px solid rgba(214, 226, 245, 0.45);
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

.partida {
  display: flex;
  flex-direction: column;
  padding: 16px 18px 20px;
  box-sizing: border-box;
}

.top {
  display: flex;
  justify-content: space-between;
  color: #f0d78c;
}

.mesa {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 140px minmax(260px, 420px) 220px;
  gap: 28px;
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
}

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

.panel {
  background: rgba(8, 16, 32, 0.72);
  border: 1px solid rgba(120, 160, 220, 0.35);
  border-radius: 16px;
  padding: 12px;
}

.dragon {
  width: 96px;
  height: 96px;
  object-fit: contain;
}

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
  .mesa {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
