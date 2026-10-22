<template>
  <div class="online">
    <section v-if="mostrarCarga" class="carga">
      <div
        class="aro-wrap"
        :style="{ '--p': cargaPorcentaje }"
        role="progressbar"
        :aria-valuenow="cargaPorcentaje"
        aria-valuemin="1"
        aria-valuemax="100"
        aria-label="Cargando partida"
      >
        <span class="aro"></span>
        <span class="nucleo"></span>
      </div>
      <p class="cargando">CARGANDO... {{ cargaPorcentaje }}%</p>
      <button type="button" class="btn-salir-carga" @click="cancelarBusqueda">SALIR</button>
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
            <img v-if="retrato(j.nombre)" :src="retrato(j.nombre) || ''" :alt="j.nombre" />
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
          <p class="letras">BINGO</p>
          <div class="board" :style="{ gridTemplateColumns: `repeat(${sala?.size ?? 5}, 1fr)` }">
            <button
              v-for="(c, i) in tuCarton"
              :key="i"
              type="button"
              class="cell"
              :class="{ free: c.free, marked: c.marked, win: esGanadorIdx(i), llamada: esLlamada(c) }"
              @click="marcarCelda(i)"
            >
              <span v-if="c.free">FREE</span>
              <span v-else>{{ c.number }}</span>
            </button>
          </div>
        </div>

        <aside class="lista">
          <h2>LISTA DE JUGADORES</h2>
          <ul>
            <li v-for="j in jugadores" :key="j.id">
              <span class="mini-foto">
                <img v-if="retrato(j.nombre)" :src="retrato(j.nombre) || ''" alt="" />
                <span v-else>{{ inicial(j.nombre) }}</span>
              </span>
              <span class="lnombre">{{ j.nombre }}</span>
              <span class="estado">{{ j.conectado ? 'en juego' : 'fuera' }}</span>
            </li>
          </ul>
        </aside>
      </div>

      <div class="barra">
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
        <button type="button" class="bingo" :disabled="fase !== 'jugando'" @click="cantar">¡BINGO!</button>
      </div>

      <div v-if="metodoVictoria" class="metodo-esquina">
        <MethodPatternPreview
          :size="sala?.size ?? 5"
          :win-modes="[metodoVictoria]"
          :cell-px="10"
          :gap-px="2"
        />
        <p class="metodo">{{ metodoNombre }}</p>
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
        <p class="hint">Comparte el código para que entren a la sala.</p>
        <aside class="panel lista-room">
          <h2>LISTA DE JUGADORES</h2>
          <ul>
            <li v-for="j in espera.jugadores" :key="j.id">
              <span class="mini-foto">
                <img v-if="retrato(j.nombre)" :src="retrato(j.nombre) || ''" alt="" />
                <span v-else>{{ inicial(j.nombre) }}</span>
              </span>
              <span>{{ j.nombre }}</span>
              <span v-if="j.id === espera.anfitrionId" class="estado">anfitrión</span>
            </li>
          </ul>
        </aside>
        <button v-if="soyAnfitrion" type="button" class="accion" @click="empezar">JUGAR</button>
        <p v-else class="hint">Esperando a que el anfitrión empiece.</p>
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
        <aside class="panel chat">
          <h2>Chat de jugadores</h2>
          <ul ref="listaChat">
            <li v-for="m in chat" :key="m.id">
              <strong>{{ m.nombre }}:</strong> {{ m.texto }}
            </li>
            <li v-if="chat.length === 0" class="vacio">Todavía no hay mensajes.</li>
          </ul>
          <form @submit.prevent="enviar">
            <input v-model="borrador" maxlength="80" placeholder="Escribe un mensaje" />
          </form>
        </aside>

        <div class="centro">
          <p class="titulo">MODO ONLINE</p>
          <img src="@/assets/img/logo.png" alt="Dark Fantasy" class="logo" />
          <button type="button" class="accion" @click="jugar">JUGAR</button>
          <button type="button" class="accion" @click="abriendoUnion = true">UNIRSE</button>
          <button type="button" class="accion" @click="crear">CREAR</button>
          <button type="button" class="accion suave" @click="salir">SALIR</button>
          <p v-if="errorConexion" class="error">{{ errorConexion }}</p>
        </div>

        <aside class="panel ranking">
          <h2>RANKING DE JUGADORES</h2>
          <p class="col">PUNTOS</p>
          <ol>
            <li v-for="(fila, i) in rankingVisible" :key="fila.nombre + i">
              <span class="puesto">{{ i + 1 }}</span>
              <span class="mini-foto">
                <img v-if="retrato(fila.nombre)" :src="retrato(fila.nombre) || ''" alt="" />
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
        <p v-if="errorSala" class="error">{{ errorSala }}</p>
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
      kicker="Modo online"
      @elegido="onMetodoElegido"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import { usePartidaOnline } from '../composables/usePartidaOnline'
import { nombreMetodo } from '../domain/bingo/nombresMetodo'
import { retratoPorNombre } from '../game/portraits'
import MethodPatternPreview from '../components/MethodPatternPreview.vue'
import RuletaMetodosOverlay from '../components/RuletaMetodosOverlay.vue'
import type { BingoCell } from '../domain/bingo/tipos'
import type { VueloBoosterOnline } from '../domain/online/tipos'
import freezeIcon from '@/assets/img/freeze.png'
import shieldIcon from '@/assets/img/shield 1.png'
import luckIcon from '@/assets/img/goodluck 2.png'
import sabotageIcon from '@/assets/img/sabotage 2.png'

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

const router = useRouter()
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

const boosters = BOOSTERS
const borrador = ref('')
const codigo = ref('')
const abriendoUnion = ref(false)
const listaChat = ref<HTMLUListElement | null>(null)
const cargaPorcentaje = ref(1)
const entrada = ref(false)
const boosterActivo = ref<number | null>(null)
const gastados = ref<Record<number, number>>({})
const proyectiles = ref<Proyectil[]>([])
const efectos = ref<Record<string, Efecto>>({})
let proyectilSeq = 0
let relojEfectos: ReturnType<typeof setInterval> | null = null
let relojCarga: ReturnType<typeof setInterval> | null = null
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
const soyAnfitrion = computed(() => espera.value?.anfitrionId === usuarioId)
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
  if (relojCarga) clearInterval(relojCarga)
  relojCarga = null
  if (cierreCarga) clearTimeout(cierreCarga)
  cierreCarga = null
}

function pulsarCarga(hasta: number, cadaMs: number, alLlegar?: () => void) {
  pararCarga()
  if (cargaPorcentaje.value >= hasta) {
    alLlegar?.()
    return
  }
  relojCarga = setInterval(() => {
    cargaPorcentaje.value += 1
    if (cargaPorcentaje.value < hasta) return
    if (relojCarga) clearInterval(relojCarga)
    relojCarga = null
    alLlegar?.()
  }, cadaMs)
}

watch(fase, (valor, anterior) => {
  if (valor === 'cola' && anterior !== 'cola') {
    entrada.value = false
    cargaPorcentaje.value = 1
    pulsarCarga(99, 100)
  }
  if (valor === 'jugando' && anterior !== 'jugando') {
    entrada.value = true
    pulsarCarga(100, 16, () => {
      cierreCarga = window.setTimeout(() => {
        entrada.value = false
      }, 280)
    })
  }
  if (valor === 'idle') {
    entrada.value = false
    pararCarga()
  }
})

watch(chat, async () => {
  await nextTick()
  const lista = listaChat.value
  if (lista) lista.scrollTop = lista.scrollHeight
})

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || '?'
}

function retrato(nombre: string): string | null {
  return retratoPorNombre(nombre)
}

function cantidad(id: number): number {
  return Math.max(0, progress.boosterCount(id) - (gastados.value[id] ?? 0))
}

function esGanadorIdx(i: number): boolean {
  return indicesGanadores.value.includes(i)
}

function esLlamada(c: BingoCell): boolean {
  return c.free || cantadas.value.includes(c.number)
}

function puedeApuntar(id: string): boolean {
  return apuntando.value && id !== usuarioId
}

function marcarCelda(i: number) {
  if (estoyCongelado.value) {
    online.mostrarAviso('Estás congelado.')
    return
  }
  if (estoySaboteado.value) {
    online.mostrarAviso('Tu cartón está saboteado.')
    return
  }
  online.marcarCelda(i)
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

function crear() {
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

function enviar() {
  online.enviarChat(borrador.value)
  borrador.value = ''
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
  height: 100%;
  color: #e7eef8;
  background:
    linear-gradient(180deg, rgba(4, 10, 24, 0.55), rgba(4, 8, 18, 0.78)),
    url('@/assets/img/fondo.png') center / cover no-repeat;
  font-family: Georgia, 'Times New Roman', serif;
}

.carga,
.hub,
.partida {
  height: 100%;
}

.carga {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.aro-wrap {
  --p: 1;
  position: relative;
  width: 148px;
  height: 148px;
  display: grid;
  place-items: center;
}

.aro {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from -90deg,
    #3b82f6 calc(var(--p) * 1%),
    rgba(255, 255, 255, 0.88) 0
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px));
  filter: drop-shadow(0 0 14px rgba(59, 130, 246, 0.45));
}

.nucleo {
  width: calc(18px + (var(--p) - 1) * 0.96px);
  height: calc(18px + (var(--p) - 1) * 0.96px);
  border-radius: 50%;
  background: radial-gradient(circle at 40% 34%, #93c5fd, #1d4ed8 62%, #1e3a8a);
  box-shadow: 0 0 18px #3b82f6;
  transition: width 90ms linear, height 90ms linear;
}

.cargando {
  margin: 0;
  letter-spacing: 0.18em;
  color: #dbe7ff;
}

.btn-salir-carga,
.accion {
  min-width: 210px;
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: linear-gradient(180deg, #2450b8, #17398a);
  color: #f4f7ff;
  letter-spacing: 0.16em;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.accion.suave,
.btn-salir-carga {
  background: linear-gradient(180deg, #31425f, #1c283c);
}

.hub {
  display: flex;
  flex-direction: column;
  padding: 18px 22px 22px;
  gap: 12px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f0d78c;
  letter-spacing: 0.06em;
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
  grid-template-columns: minmax(210px, 280px) 1fr minmax(230px, 320px);
  gap: 18px;
}

.panel {
  background: rgba(8, 16, 32, 0.72);
  border: 1px solid rgba(120, 160, 220, 0.35);
  border-radius: 16px;
  padding: 14px;
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
}

.logo {
  width: min(340px, 42vw);
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
  grid-template-rows: auto 1fr auto;
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
  width: 110px;
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
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  grid-template-columns: 150px minmax(280px, 460px) 230px;
  column-gap: 72px;
  row-gap: 18px;
  align-items: center;
  justify-content: center;
}

.oraculo,
.carton-wrap,
.lista {
  text-align: center;
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
  position: absolute;
  left: 18px;
  bottom: 16px;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  margin: 0 0 8px;
  letter-spacing: 0.55em;
  color: #f0d78c;
}

.board {
  display: grid;
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

.carton-wrap.congelado .board {
  outline: 2px solid #9ad7ff;
  filter: saturate(0.55);
}

.carton-wrap.sabotaje .board {
  outline: 2px solid #e23b3b;
}

.carton-wrap.suerte .board {
  outline: 2px solid #f0d78c;
}

.lista {
  background: rgba(8, 16, 32, 0.72);
  border: 1px solid rgba(120, 160, 220, 0.35);
  border-radius: 16px;
  padding: 12px;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.estado {
  color: #9be7c4;
  font-size: 0.75rem;
}

.barra {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 14px;
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
  min-width: 180px;
  height: 64px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(180deg, #2a63d6, #17398a);
  color: white;
  letter-spacing: 0.14em;
  font-weight: 800;
  cursor: pointer;
}

.pista,
.aviso,
.alerta {
  position: absolute;
  left: 50%;
  bottom: 108px;
  transform: translateX(-50%);
  margin: 0;
  background: rgba(8, 16, 32, 0.9);
  border: 1px solid #7aa2e8;
  border-radius: 10px;
  padding: 8px 14px;
}

.alerta {
  position: fixed;
  top: 16px;
  bottom: auto;
  z-index: 30;
}

.proyectil {
  position: fixed;
  width: 22px;
  height: 22px;
  margin: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 40;
  transition: left 0.65s cubic-bezier(0.2, 0.75, 0.2, 1), top 0.65s cubic-bezier(0.2, 0.75, 0.2, 1);
}

.proyectil.tipo-1 {
  background: #b9ecff;
  box-shadow: 0 0 16px #7ad7ff;
}

.proyectil.tipo-2 {
  background: #ff8d8d;
  box-shadow: 0 0 16px #e23b3b;
}

.proyectil.tipo-3 {
  background: #ffe08a;
  box-shadow: 0 0 16px #f0d78c;
}

.proyectil.tipo-4 {
  background: #9eb7ff;
  box-shadow: 0 0 16px #3d7dff;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 16, 0.72);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 18px;
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
  color: #9be7c4;
}

.error {
  color: #ffb4b4;
}

.room-centro {
  overflow: auto;
}

.codigo {
  margin: 0;
  font-size: 2.4rem;
  letter-spacing: 0.4em;
  color: #f0d78c;
}

.lista-room {
  width: min(420px, 90vw);
  max-height: 240px;
}

@media (max-width: 980px) {
  .cuerpo,
  .mesa {
    grid-template-columns: 1fr;
  }

  .panel {
    max-height: 220px;
  }
}
</style>
