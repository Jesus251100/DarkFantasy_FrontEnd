<template>
  <div class="shop">
    <div class="top-bar">
      <button type="button" class="back-btn" @click="router.push('/lobby')" aria-label="Volver">
        <span class="back-ico" aria-hidden="true">‹</span>
      </button>

      <h1>Tienda</h1>

      <div class="currencies">
        <button type="button" class="currency gold" @click="abrirIntercambio('coins-to-diamonds')">
          🪙 {{ coins }} cambiar por diamantes
        </button>
        <button type="button" class="currency diamond" @click="abrirIntercambio('diamonds-to-coins')">
          💎 {{ diamonds }} cambiar por monedas
        </button>
      </div>
    </div>

    <div class="separator"></div>

    <div class="cards">
      <div v-for="item in boosters" :key="item.id" class="card">
        <img :src="item.icon" :alt="item.name" class="icon" />
        <h2>{{ item.name }}</h2>
        <p class="price-tag">
          <template v-if="item.currency === 'diamonds'">💎 {{ item.unitPrice }}</template>
          <template v-else>🪙 {{ item.unitPrice }}</template>
        </p>
        <button type="button" class="buy-btn" @click="abrirCompra(item)">Comprar</button>
      </div>
    </div>

    <!-- Modal INTERCAMBIO -->
    <div v-if="exchangeModal" class="modal-overlay" @click.self="cerrarIntercambio">
      <div class="modal modal-exchange" role="dialog" aria-labelledby="exchange-title">
        <h2 id="exchange-title">{{ tituloIntercambio }}</h2>
        <p class="exchange-rate">{{ MONEDAS_POR_DIAMANTE }} monedas = 1 diamante</p>
        <p class="exchange-rate">1 diamante = {{ MONEDAS_POR_DIAMANTE }} monedas</p>
        <p v-if="maxMonedas < MONEDAS_POR_DIAMANTE" class="buy-error">
          {{ avisoSinSaldo }}
        </p>
        <template v-else>
          <label class="exchange-label" for="exchange-range">{{ etiquetaBarra }}</label>
          <div class="exchange-scale">
            <span>{{ minimoBarra }}</span>
            <span>{{ maximoBarra }}</span>
          </div>
          <input
            id="exchange-range"
            class="exchange-range"
            type="range"
            :min="minimoBarra"
            :max="maximoBarra"
            :step="pasoBarra"
            :value="valorBarra"
            :disabled="intercambiando"
            @input="ajustarBarra"
          />
          <div class="exchange-sides">
            <p class="exchange-side">
              <span>Entregas</span>
              <strong>{{ entregaTexto }}</strong>
            </p>
            <p class="exchange-side recibe">
              <span>Recibes</span>
              <strong>{{ recibeTexto }}</strong>
            </p>
          </div>
          <p class="exchange-question">{{ resumenIntercambio }}</p>
        </template>
        <div class="modal-buttons">
          <button type="button" class="btn-si" :disabled="intercambiando || monedasValidas < MONEDAS_POR_DIAMANTE" @click="confirmarIntercambio">{{ intercambiando ? 'PROCESANDO…' : 'SI' }}</button>
          <button type="button" class="btn-no" :disabled="intercambiando" @click="cerrarIntercambio">NO</button>
        </div>
      </div>
    </div>

    <!-- Modal COMPRAR BOOSTER -->
    <div v-if="buyModal && boosterSeleccionado" class="modal-overlay" @click.self="cerrarCompra">
      <div class="modal modal-buy" role="dialog" aria-labelledby="buy-title">
        <h2 id="buy-title">Comprar Booster</h2>
        <p class="buy-name">{{ boosterSeleccionado.name }}</p>

        <div class="qty-row">
          <button type="button" class="qty-btn" @click="bajarCantidad" :disabled="cantidad <= 1">
            −
          </button>
          <span class="qty-value">{{ cantidad }}</span>
          <button type="button" class="qty-btn" @click="subirCantidad">+</button>
        </div>

        <p class="total-price">
          Precio Total:
          <strong v-if="boosterSeleccionado.currency === 'diamonds'">
            {{ precioTotal }} 💎
          </strong>
          <strong v-else> {{ precioTotal }} 🪙 </strong>
        </p>

        <p v-if="buyError" class="buy-error">{{ buyError }}</p>

        <div class="modal-buttons">
          <button type="button" class="btn-comprar" @click="confirmarCompra">COMPRAR</button>
          <button type="button" class="btn-cancelar" @click="cerrarCompra">CANCELAR</button>
        </div>
      </div>
    </div>

    <!-- Toast feedback -->
    <div v-if="toast" class="shop-toast" role="status">{{ toast }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import '../assets/css/shop.css'
import { useProgressStore } from '../stores/progress'
import { CatalogoBoosters } from '../domain/boosters/CatalogoBoosters'
import { MAX_DIAMANTES_POR_CAMBIO, MONEDAS_POR_DIAMANTE } from '../domain/campania/ReglasIntercambio'
import freeze from '../assets/img/freeze.png'
import sabotage from '../assets/img/sabotage 2.png'
import luck from '../assets/img/goodluck 2.png'
import shield from '../assets/img/shield 1.png'

type Currency = 'coins' | 'diamonds'

type Booster = {
  id: number
  name: string
  icon: string
  unitPrice: number
  currency: Currency
}

type ExchangeMode = 'coins-to-diamonds' | 'diamonds-to-coins'

const ICONOS: Record<string, string> = {
  freeze,
  sabotage,
  luck,
  shield,
}

const router = useRouter()
const progress = useProgressStore()
const { coins, diamonds } = storeToRefs(progress)

const boosters: Booster[] = CatalogoBoosters.listar().map((b) => ({
  id: b.id,
  name: b.nombre,
  icon: ICONOS[b.icono] ?? freeze,
  unitPrice: b.precio,
  currency: b.moneda === 'diamonds' ? 'diamonds' : 'coins',
}))

const exchangeModal = ref(false)
const exchangeMode = ref<ExchangeMode>('diamonds-to-coins')
const intercambiando = ref(false)
const monedasElegidas = ref(MONEDAS_POR_DIAMANTE)

const buyModal = ref(false)
const boosterSeleccionado = ref<Booster | null>(null)
const cantidad = ref(1)
const buyError = ref('')
const toast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const maxMonedas = computed(() => {
  const topeSaldo =
    exchangeMode.value === 'coins-to-diamonds'
      ? Math.floor(coins.value / MONEDAS_POR_DIAMANTE) * MONEDAS_POR_DIAMANTE
      : Math.max(0, diamonds.value) * MONEDAS_POR_DIAMANTE
  return Math.min(topeSaldo, MAX_DIAMANTES_POR_CAMBIO * MONEDAS_POR_DIAMANTE)
})

const monedasValidas = computed(() => {
  const tope = maxMonedas.value
  if (tope < MONEDAS_POR_DIAMANTE) return 0
  const pasos = Math.round(monedasElegidas.value / MONEDAS_POR_DIAMANTE) * MONEDAS_POR_DIAMANTE
  return Math.min(tope, Math.max(MONEDAS_POR_DIAMANTE, pasos))
})

const diamantesDelCambio = computed(() => monedasValidas.value / MONEDAS_POR_DIAMANTE)
const haciaMonedas = computed(() => exchangeMode.value === 'diamonds-to-coins')

const tituloIntercambio = computed(() =>
  haciaMonedas.value ? 'DIAMANTES POR MONEDAS' : 'MONEDAS POR DIAMANTES',
)

const minimoBarra = computed(() => (haciaMonedas.value ? 1 : MONEDAS_POR_DIAMANTE))
const maximoBarra = computed(() =>
  haciaMonedas.value ? maxMonedas.value / MONEDAS_POR_DIAMANTE : maxMonedas.value,
)
const pasoBarra = computed(() => (haciaMonedas.value ? 1 : MONEDAS_POR_DIAMANTE))
const valorBarra = computed(() => (haciaMonedas.value ? diamantesDelCambio.value : monedasValidas.value))

const etiquetaBarra = computed(() =>
  haciaMonedas.value ? 'Diamantes que vas a cambiar' : 'Monedas que vas a cambiar',
)

const entregaTexto = computed(() =>
  haciaMonedas.value
    ? `${textoDiamantes(diamantesDelCambio.value)} 💎`
    : `${monedasValidas.value} monedas 🪙`,
)

const recibeTexto = computed(() =>
  haciaMonedas.value
    ? `${monedasValidas.value} monedas 🪙`
    : `${textoDiamantes(diamantesDelCambio.value)} 💎`,
)

const avisoSinSaldo = computed(() =>
  exchangeMode.value === 'coins-to-diamonds'
    ? `Hacen falta ${MONEDAS_POR_DIAMANTE} monedas para obtener 1 diamante.`
    : 'Hace falta al menos 1 diamante para recibir monedas.',
)

function textoDiamantes(n: number): string {
  return `${n} ${n === 1 ? 'diamante' : 'diamantes'}`
}

const resumenIntercambio = computed(() => {
  const diamantes = textoDiamantes(diamantesDelCambio.value)
  if (exchangeMode.value === 'coins-to-diamonds') {
    return `Cambias ${monedasValidas.value} monedas y recibes ${diamantes}.`
  }
  return `Cambias ${diamantes} y recibes ${monedasValidas.value} monedas.`
})

watch(maxMonedas, (tope) => {
  if (monedasElegidas.value > tope) monedasElegidas.value = Math.max(0, tope)
})

const precioTotal = computed(() => {
  if (!boosterSeleccionado.value) return 0
  return boosterSeleccionado.value.unitPrice * cantidad.value
})

function showToast(msg: string) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2200)
}

function ajustarBarra(evento: Event) {
  const valor = Number((evento.target as HTMLInputElement).value)
  if (!Number.isFinite(valor)) {
    monedasElegidas.value = MONEDAS_POR_DIAMANTE
    return
  }
  monedasElegidas.value = haciaMonedas.value ? valor * MONEDAS_POR_DIAMANTE : valor
}

function abrirIntercambio(mode: ExchangeMode) {
  exchangeMode.value = mode
  monedasElegidas.value = MONEDAS_POR_DIAMANTE
  exchangeModal.value = true
}

function cerrarIntercambio() {
  exchangeModal.value = false
}

async function confirmarIntercambio() {
  if (intercambiando.value) return
  intercambiando.value = true
  try {
    const diamantes = diamantesDelCambio.value
    const monedas = monedasValidas.value
    if (diamantes < 1) return
    await progress.intercambiarEnServidor(exchangeMode.value, diamantes)
    showToast(
      exchangeMode.value === 'diamonds-to-coins'
        ? `Intercambio realizado: +${monedas} monedas`
        : `Intercambio realizado: +${textoDiamantes(diamantes)}`,
    )
  } catch (e) {
    showToast(e instanceof Error ? e.message : 'No se pudo intercambiar')
    cerrarIntercambio()
    return
  } finally {
    intercambiando.value = false
  }
  cerrarIntercambio()
}

function abrirCompra(item: Booster) {
  boosterSeleccionado.value = item
  cantidad.value = 1
  buyError.value = ''
  buyModal.value = true
}

function cerrarCompra() {
  buyModal.value = false
  buyError.value = ''
}

function bajarCantidad() {
  if (cantidad.value > 1) cantidad.value -= 1
  buyError.value = ''
}

function subirCantidad() {
  cantidad.value += 1
  buyError.value = ''
}

async function confirmarCompra() {
  const item = boosterSeleccionado.value
  if (!item) return

  try {
    await progress.comprarEnServidor(item.id, cantidad.value)
  } catch (e) {
    buyError.value = e instanceof Error ? e.message : 'No se pudo comprar'
    return
  }
  showToast(`Compraste ${cantidad.value}× ${item.name}`)
  cerrarCompra()
}
</script>

<style scoped>
/* Estilos extra de modales Figma (shop.css base se mantiene importado) */
.currency {
  border: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.currency:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(0, 200, 255, 0.35);
}

.price-tag {
  margin: 0 0 12px;
  color: #ffe9a0;
  font-weight: 700;
  font-size: 0.95rem;
}

.modal-exchange,
.modal-buy {
  width: min(420px, 92vw);
  background: #2a2e36;
  border: 2px solid rgba(90, 100, 110, 0.9);
  border-radius: 16px;
  padding: 22px 24px 20px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
}

.modal-exchange h2,
.modal-buy h2 {
  margin: 0 0 14px;
  font-size: 1.35rem;
  letter-spacing: 1px;
  color: #f0f4f8;
}

.exchange-rate {
  margin: 0 0 12px;
  color: #ffe9a0;
  font-weight: 700;
}

.exchange-label {
  display: block;
  margin: 0 0 6px;
  color: #dce4ec;
  font-size: 0.92rem;
}

.exchange-scale {
  display: flex;
  justify-content: space-between;
  color: #9eb0c0;
  font-size: 0.8rem;
}

.exchange-range {
  width: 100%;
  margin: 6px 0 10px;
  accent-color: #e8c86a;
  cursor: pointer;
}

.exchange-sides {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 4px 0 12px;
}

.exchange-side {
  margin: 0;
  padding: 10px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  text-align: center;
}

.exchange-side span {
  display: block;
  margin-bottom: 4px;
  color: #9eb0c0;
  font-size: 0.78rem;
  letter-spacing: 0.4px;
}

.exchange-side strong {
  color: #dce4ec;
  font-size: 0.98rem;
}

.exchange-side.recibe strong {
  color: #ffe9a0;
}

.exchange-question {
  margin: 0 0 16px;
  color: #dce4ec;
  font-size: 1rem;
  line-height: 1.4;
}

.buy-name {
  margin: 0 0 16px;
  color: #a8d4ff;
  font-weight: 700;
}

.qty-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 16px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #1a3a8a;
  color: #fff;
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
  line-height: 1;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-value {
  min-width: 2rem;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 800;
  color: #fff;
}

.total-price {
  margin: 0 0 12px;
  color: #e8eef4;
  font-size: 1.05rem;
}

.total-price strong {
  color: #7ad7ff;
}

.buy-error {
  margin: 0 0 10px;
  color: #ff7a7a;
  font-size: 0.9rem;
  font-weight: 700;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 8px;
}

.btn-si,
.btn-comprar {
  min-width: 100px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #1a3a8a;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.btn-no,
.btn-cancelar {
  min-width: 100px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #1a3a8a;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  opacity: 0.85;
}

.btn-si:hover,
.btn-comprar:hover,
.btn-no:hover,
.btn-cancelar:hover {
  filter: brightness(1.12);
}

.btn-si:disabled,
.btn-no:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: none;
}

.shop-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  padding: 12px 22px;
  border-radius: 12px;
  background: #1a1e16;
  border: 2px solid rgba(190, 160, 70, 0.85);
  color: #e8c86a;
  font-weight: 800;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}
</style>
