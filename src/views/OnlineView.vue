<template>
  <div class="online">
    <header class="bar">
      <button type="button" class="back" aria-label="Volver al lobby" @click="salir">←</button>
      <h1>ONLINE</h1>
      <div class="bar-right">
        <span class="coins">🪙 {{ progress.coins }}</span>
        <span class="dot" :class="{ on: conectado }" :title="conectado ? 'Conectado' : 'Sin conexión'"></span>
      </div>
    </header>

    <p v-if="errorConexion" class="error">{{ errorConexion }}</p>

    <!-- ===== IDLE ===== -->
    <section v-if="fase === 'idle'" class="panel intro">
      <img src="@/assets/img/logo.png" alt="Dark Fantasy" class="logo" />
      <h2>Bingo multijugador</h2>
      <ul class="reglas">
        <li>Cartón de 5 × 5 con 75 números.</li>
        <li>La ruleta decide el método: fila, columna o diagonal.</li>
        <li>Marca tú mismo los números que salgan y pulsa BINGO.</li>
        <li>De 2 a 4 jugadores; si faltan, entran bots.</li>
        <li>El ganador recibe 25 monedas.</li>
      </ul>
      <button type="button" class="primary" :disabled="!conectado && !!errorConexion" @click="buscar">
        BUSCAR PARTIDA
      </button>
    </section>

    <!-- ===== COLA ===== -->
    <section v-else-if="fase === 'cola'" class="panel cola">
      <div class="spinner" aria-hidden="true"></div>
      <h2>Buscando rivales…</h2>
      <p class="hint">Si no aparecen jugadores en unos segundos, entrarán bots.</p>
      <button type="button" class="ghost" @click="cancelar">Cancelar</button>
    </section>

    <!-- ===== JUGANDO / TERMINADO ===== -->
    <section v-else class="juego">
      <div class="players">
        <div
          v-for="j in jugadores"
          :key="j.id"
          class="player"
          :class="{ me: j.id === usuarioId, winner: j.ganador, off: !j.conectado }"
        >
          <span class="avatar">{{ inicial(j.nombre) }}</span>
          <span class="pname">{{ j.nombre }}</span>
          <span v-if="j.esBot" class="tag">BOT</span>
        </div>
      </div>

      <div class="mesa">
        <div class="oraculo">
          <p class="lbl">Última bola</p>
          <div class="bola" :class="{ vacia: ultimaBola === null }">
            {{ ultimaBola ?? '—' }}
          </div>
          <div class="recientes">
            <span v-for="(n, i) in oracleSlots" :key="i" class="mini" :class="{ vacia: n === null }">
              {{ n ?? '' }}
            </span>
          </div>
          <p class="lbl">Bolas cantadas: {{ cantadas.length }}</p>
        </div>

        <div class="carton-wrap">
          <p class="metodo-lbl">
            Método:
            <strong>{{ metodoNombre }}</strong>
          </p>
          <div class="board" :style="{ gridTemplateColumns: `repeat(${sala?.size ?? 5}, 1fr)` }">
            <button
              v-for="(c, i) in tuCarton"
              :key="i"
              type="button"
              class="cell"
              :class="{ free: c.free, marked: c.marked, win: esGanadorIdx(i), llamada: esLlamada(c) }"
              @click="marcarCelda(i)"
            >
              <span v-if="c.free">★</span>
              <span v-else>{{ c.number }}</span>
            </button>
          </div>
          <button
            type="button"
            class="primary bingo"
            :disabled="fase !== 'jugando'"
            @click="cantar"
          >
            ¡BINGO!
          </button>
        </div>
      </div>

      <transition name="fade">
        <p v-if="aviso" class="aviso">{{ aviso }}</p>
      </transition>
    </section>

    <!-- ===== OVERLAY FIN ===== -->
    <div v-if="fase === 'terminado'" class="modal-backdrop">      <div class="modal" :class="{ gane: esGanador, perdi: !esGanador }">
        <h2>{{ esGanador ? '¡BINGO! GANASTE' : 'Fin de la partida' }}</h2>
        <p class="result-line">
          <template v-if="ganador">Ganador: <strong>{{ ganador.nombre }}</strong></template>
          <template v-else>Nadie completó el patrón.</template>
        </p>
        <p v-if="esGanador" class="premio">+25 monedas 🪙</p>
        <div class="board mini-board" :style="{ gridTemplateColumns: `repeat(${sala?.size ?? 5}, 1fr)` }">
          <div
            v-for="(c, i) in tuCarton"
            :key="i"
            class="cell"
            :class="{ free: c.free, marked: c.marked, win: esGanadorIdx(i) }"
          >
            <span v-if="c.free">★</span>
            <span v-else>{{ c.number }}</span>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="primary" @click="jugarOtraVez">JUGAR DE NUEVO</button>
          <button type="button" class="ghost" @click="salir">LOBBY</button>
        </div>
      </div>
    </div>

    <!-- ===== ALERTA DE COLA ===== -->
    <transition name="fade">
      <div v-if="alerta" class="alerta-banner">⚠ {{ alerta }}</div>
    </transition>

    <!-- ===== RULETA DEL MÉTODO ===== -->
    <RuletaMetodosOverlay
      :show="showRuleta"
      :metodos="metodosVictoria"
      :size="sala?.size ?? 5"
      :resultado="metodoVictoria"
      @elegido="onMetodoElegido"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import { usePartidaOnline } from '../composables/usePartidaOnline'
import { nombreMetodo } from '../domain/bingo/nombresMetodo'
import RuletaMetodosOverlay from '../components/RuletaMetodosOverlay.vue'
import type { BingoCell } from '../domain/bingo/tipos'

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
} = online

const jugadores = computed(() => sala.value?.jugadores ?? [])
const metodoNombre = computed(() =>
  metodoVictoria.value ? nombreMetodo(metodoVictoria.value) : '—',
)

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || '?'
}

function esGanadorIdx(i: number): boolean {
  return indicesGanadores.value.includes(i)
}

function esLlamada(c: BingoCell): boolean {
  return c.free || cantadas.value.includes(c.number)
}

function marcarCelda(i: number) {
  online.marcarCelda(i)
}

function onMetodoElegido() {
  online.onMetodoElegido()
}

function buscar() {
  online.buscar()
}

function cancelar() {
  online.cancelar()
}

function cantar() {
  online.cantar()
}

function jugarOtraVez() {
  online.reiniciar()
  online.buscar()
}

function salir() {
  online.desconectar()
  void router.push('/lobby')
}
</script>

<style scoped>
.online {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(6, 10, 20, 0.82) 0%, rgba(6, 10, 20, 0.9) 100%),
    url('@/assets/img/fondo.png') center center / cover no-repeat fixed;
  color: #e8eef4;
  font-family: Georgia, 'Times New Roman', serif;
  display: flex;
  flex-direction: column;
  padding: 18px clamp(14px, 4vw, 48px) 32px;
}

.alerta-banner {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10050;
  max-width: min(92vw, 520px);
  text-align: center;
  padding: 14px 24px;
  border-radius: 12px;
  background: linear-gradient(180deg, #5a1c1c, #3a1010);
  border: 1px solid #d06a4a;
  color: #ffdcc4;
  font-weight: 700;
  letter-spacing: 0.03em;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.6), 0 0 22px rgba(208, 106, 74, 0.35);
  pointer-events: none;
}

.bar {
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #2a3a56;
  padding-bottom: 12px;
}

.bar h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.28em;
  color: #e8c86a;
}

.bar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.coins {
  color: #e8c86a;
  font-size: 1rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #7a3b3b;
  box-shadow: 0 0 8px #000 inset;
}

.dot.on {
  background: #4fd07a;
  box-shadow: 0 0 10px #4fd07a;
}

button {
  font-family: inherit;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #3a4d70;
  background: #17233a;
  color: #e8eef4;
}

.back {
  width: 44px;
  height: 44px;
  font-size: 1.3rem;
  color: #e8c86a;
}

.primary {
  background: linear-gradient(180deg, #e8c86a, #b58f2f);
  color: #1a1305;
  border: none;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 14px 22px;
  box-shadow: 0 6px 18px rgba(232, 200, 106, 0.25);
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost {
  background: transparent;
  color: #e8eef4;
  padding: 12px 20px;
}

.error {
  color: #ffb4b4;
  text-align: center;
  margin: 16px 0 0;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.logo {
  width: min(320px, 70vw);
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.6));
}

.intro h2 {
  color: #e8c86a;
  margin: 0;
}

.reglas {
  list-style: none;
  padding: 0;
  margin: 0;
  line-height: 1.9;
  color: #c4d2e4;
}

.reglas li::before {
  content: '◆ ';
  color: #7ad7ff;
}

.hint {
  color: #9fb0c6;
}

.spinner {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 4px solid #2a3a56;
  border-top-color: #e8c86a;
  animation: giro 0.9s linear infinite;
}

@keyframes giro {
  to {
    transform: rotate(360deg);
  }
}

.juego {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 18px;
}

.players {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.player {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #131d31;
  border: 1px solid #2a3a56;
}

.player.me {
  border-color: #e8c86a;
}

.player.winner {
  background: #2a2410;
  box-shadow: 0 0 14px rgba(232, 200, 106, 0.5);
}

.player.off {
  opacity: 0.45;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #24344f;
  color: #e8c86a;
  font-weight: 700;
}

.tag {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 4px;
  background: #3a2f10;
  color: #e8c86a;
}

.mesa {
  flex: 1;
  display: flex;
  gap: clamp(16px, 4vw, 48px);
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.oraculo {
  text-align: center;
  min-width: 180px;
}

.lbl {
  color: #9fb0c6;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.bola {
  width: 120px;
  height: 120px;
  margin: 8px auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 3rem;
  font-weight: 700;
  color: #1a1305;
  background: radial-gradient(circle at 35% 30%, #ffe9a8, #e8c86a 60%, #b58f2f);
  box-shadow: 0 0 26px rgba(232, 200, 106, 0.5);
}

.bola.vacia {
  color: #6a7791;
  background: #17233a;
  box-shadow: none;
}

.recientes {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 10px 0;
}

.mini {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #24344f;
  color: #e8eef4;
  font-weight: 600;
}

.mini.vacia {
  background: #17233a;
  color: transparent;
}

.board {
  display: grid;
  gap: 8px;
  width: min(440px, 86vw);
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
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #1a2740;
  border: 1px solid #2f4568;
  color: #cdd9e8;
  font-family: inherit;
  font-size: clamp(0.9rem, 3.4vw, 1.35rem);
  font-weight: 600;
  padding: 0;
  cursor: default;
}

.cell.llamada {
  cursor: pointer;
  border-color: #4a6a94;
  box-shadow: inset 0 0 0 1px rgba(122, 215, 255, 0.25);
}

.cell.llamada:hover {
  border-color: #7ad7ff;
  transform: translateY(-1px);
}

.cell.free {
  color: #e8c86a;
  font-size: 1.4rem;
}

.cell.marked {
  background: linear-gradient(180deg, #3a2f10, #26301c);
  border-color: #e8c86a;
  color: #ffe9a8;
}

.cell.win {
  background: linear-gradient(180deg, #e8c86a, #b58f2f);
  color: #1a1305;
  animation: pulso 1s ease-in-out infinite alternate;
}

@keyframes pulso {
  to {
    box-shadow: 0 0 16px rgba(232, 200, 106, 0.9);
  }
}

.bingo {
  display: block;
  margin: 18px auto 0;
  width: min(440px, 86vw);
  font-size: 1.1rem;
}

.aviso {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  background: #4a1f1f;
  border: 1px solid #a05050;
  color: #ffd7d7;
  padding: 12px 20px;
  border-radius: 10px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 16, 0.82);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 50;
}

.modal {
  background: #101a2c;
  border: 1px solid #3a4d70;
  border-radius: 16px;
  padding: 26px clamp(18px, 4vw, 40px);
  text-align: center;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.modal.gane {
  border-color: #e8c86a;
}

.modal h2 {
  margin: 0 0 8px;
  color: #e8c86a;
  letter-spacing: 0.06em;
}

.result-line {
  color: #c4d2e4;
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
</style>
