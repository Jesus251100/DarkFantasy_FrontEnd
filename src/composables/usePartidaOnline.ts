import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Socket } from 'socket.io-client'
import { crearSocketOnline } from '../api/socket'
import { checkWin } from '../game/bingo'
import { useProgressStore } from '../stores/progress'
import type { BingoCell } from '../domain/bingo/tipos'
import type { FaseOnline, ResumenOnline, VistaSalaOnline } from '../domain/online/tipos'

/**
 * Adaptador Vue del modo online. La autoridad del juego vive en el backend
 * (socket.io); aquí solo se refleja el estado y se envían intenciones.
 */
export function usePartidaOnline(usuarioId: string) {
  const socket: Socket = crearSocketOnline()
  const progress = useProgressStore()

  const conectado = ref(false)
  const fase = ref<FaseOnline>('idle')
  const sala = ref<VistaSalaOnline | null>(null)
  const cantadas = ref<number[]>([])
  const marcas = ref<Set<number>>(new Set())
  const ultimaBola = ref<number | null>(null)
  const ganadorId = ref<string | null>(null)
  const resumen = ref<ResumenOnline | null>(null)
  const aviso = ref<string | null>(null)
  const alerta = ref<string | null>(null)
  const showRuleta = ref(false)
  const errorConexion = ref<string | null>(null)

  let avisoTimer: ReturnType<typeof setTimeout> | null = null
  let alertaTimer: ReturnType<typeof setTimeout> | null = null

  function mostrarAviso(texto: string) {
    aviso.value = texto
    if (avisoTimer) clearTimeout(avisoTimer)
    avisoTimer = setTimeout(() => {
      aviso.value = null
    }, 2600)
  }

  function mostrarAlerta(texto: string) {
    alerta.value = texto
    if (alertaTimer) clearTimeout(alertaTimer)
    alertaTimer = setTimeout(() => {
      alerta.value = null
    }, 8000)
  }

  function aplicarVista(vista: VistaSalaOnline) {
    const salaNueva = sala.value?.salaId !== vista.salaId
    sala.value = vista
    if (salaNueva) {
      marcas.value = new Set()
      showRuleta.value = vista.estado === 'playing'
    }
    if (vista.calledList.length >= cantadas.value.length) {
      cantadas.value = [...vista.calledList]
    }
    if (vista.lastDrawn !== null) ultimaBola.value = vista.lastDrawn
    if (vista.estado === 'playing') fase.value = 'jugando'
    if (vista.estado === 'finished') {
      ganadorId.value = vista.ganador
      showRuleta.value = false
      fase.value = 'terminado'
    }
  }

  socket.on('connect', () => {
    conectado.value = true
    errorConexion.value = null
  })
  socket.on('disconnect', () => {
    conectado.value = false
  })
  socket.on('connect_error', (err: Error) => {
    conectado.value = false
    errorConexion.value = err.message || 'No se pudo conectar al servidor de partidas.'
  })

  socket.on('queue:joined', () => {
    fase.value = 'cola'
  })
  socket.on('queue:left', () => {
    if (fase.value === 'cola') fase.value = 'idle'
  })
  socket.on('match:found', () => {
    fase.value = 'jugando'
  })
  socket.on('room:state', (vista: VistaSalaOnline) => aplicarVista(vista))
  socket.on('ball:called', (payload: { numero: number }) => {
    ultimaBola.value = payload.numero
    if (!cantadas.value.includes(payload.numero)) cantadas.value.push(payload.numero)
  })
  socket.on('game:over', (vista: VistaSalaOnline) => {
    aplicarVista(vista)
    ganadorId.value = vista.ganador
    fase.value = 'terminado'
    void progress.hidratarDesdeApi().catch(() => {})
  })
  socket.on('game:summary', (r: ResumenOnline) => {
    resumen.value = r
  })
  socket.on('claim:rejected', (p: { mensaje: string }) => mostrarAviso(p.mensaje))
  socket.on('queue:warning', (p: { mensaje: string }) => mostrarAlerta(p.mensaje))

  function conectar() {
    if (!socket.connected) socket.connect()
  }

  function buscar() {
    errorConexion.value = null
    conectar()
    fase.value = 'cola'
    if (socket.connected) socket.emit('queue:join')
    else socket.once('connect', () => socket.emit('queue:join'))
  }

  function cancelar() {
    socket.emit('queue:leave')
    fase.value = 'idle'
  }

  function cantar() {
    socket.emit('game:claim')
  }

  function marcarCelda(indice: number) {
    const celda = sala.value?.tuCarton[indice]
    if (!celda || celda.free) return
    const yaMarcada = marcas.value.has(indice)
    if (!yaMarcada && !setCantadas.value.has(celda.number)) return
    const siguiente = new Set(marcas.value)
    if (yaMarcada) siguiente.delete(indice)
    else siguiente.add(indice)
    marcas.value = siguiente
  }

  function onMetodoElegido() {
    showRuleta.value = false
  }

  function reiniciar() {
    sala.value = null
    cantadas.value = []
    marcas.value = new Set()
    ultimaBola.value = null
    ganadorId.value = null
    resumen.value = null
    aviso.value = null
    alerta.value = null
    showRuleta.value = false
    fase.value = 'idle'
  }

  function desconectar() {
    socket.emit('queue:leave')
    socket.disconnect()
  }

  const llamadasRecientes = computed(() => cantadas.value.slice(-3))
  const oracleSlots = computed(() => {
    const slots: (number | null)[] = [null, null, null]
    const recientes = llamadasRecientes.value
    const start = slots.length - recientes.length
    recientes.forEach((n, i) => {
      slots[start + i] = n
    })
    return slots
  })

  const setCantadas = computed(() => new Set(cantadas.value))

  const tuCarton = computed<BingoCell[]>(() =>
    (sala.value?.tuCarton ?? []).map((c, i) => ({
      ...c,
      marked: c.free || marcas.value.has(i),
    })),
  )

  const metodosVictoria = computed(() => sala.value?.metodosVictoria ?? [])
  const metodoVictoria = computed(() => sala.value?.winModes[0] ?? null)

  const esGanador = computed(() => !!ganadorId.value && ganadorId.value === usuarioId)

  const indicesGanadores = computed<number[]>(() => {
    if (!sala.value || !esGanador.value) return []
    const res = checkWin(sala.value.tuCarton, sala.value.size, sala.value.winModes, setCantadas.value)
    return res.won ? res.winningIndices : []
  })

  const ganador = computed(
    () => sala.value?.jugadores.find((j) => j.id === ganadorId.value) ?? null,
  )

  onMounted(() => {
    conectar()
  })

  onUnmounted(() => {
    if (avisoTimer) clearTimeout(avisoTimer)
    if (alertaTimer) clearTimeout(alertaTimer)
    socket.emit('queue:leave')
    socket.removeAllListeners()
    socket.disconnect()
  })

  return {
    conectado,
    fase,
    sala,
    cantadas,
    marcas,
    ultimaBola,
    ganadorId,
    resumen,
    aviso,
    alerta,
    showRuleta,
    errorConexion,
    llamadasRecientes,
    oracleSlots,
    tuCarton,
    metodosVictoria,
    metodoVictoria,
    esGanador,
    indicesGanadores,
    ganador,
    buscar,
    cancelar,
    cantar,
    marcarCelda,
    onMetodoElegido,
    reiniciar,
    desconectar,
    conectar,
  }
}
