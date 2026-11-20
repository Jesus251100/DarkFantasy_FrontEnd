import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Socket } from 'socket.io-client'
import { crearSocketOnline } from '../api/socket'
import { checkWin } from '../game/bingo'
import { useProgressStore } from '../stores/progress'
import type { BingoCell } from '../domain/bingo/tipos'
import type {
  EfectoActivoOnline,
  FaseOnline,
  FilaRankingOnline,
  MensajeChatOnline,
  RechazoBoosterOnline,
  ResumenOnline,
  RadarVisible,
  SalaEsperaOnline,
  VistaSalaOnline,
  VueloBoosterOnline,
} from '../domain/online/tipos'

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
  const rivalMarcas = ref<Set<number>>(new Set())
  const ultimaBola = ref<number | null>(null)
  const ganadorId = ref<string | null>(null)
  const resumen = ref<ResumenOnline | null>(null)
  const aviso = ref<string | null>(null)
  const alerta = ref<string | null>(null)
  const showRuleta = ref(false)
  const errorConexion = ref<string | null>(null)
  const espera = ref<SalaEsperaOnline | null>(null)
  const radar = ref<RadarVisible | null>(null)
  let radarTimer: ReturnType<typeof setTimeout> | null = null

  function mostrarRadar(contacto: RadarVisible) {
    radar.value = contacto
    if (radarTimer) clearTimeout(radarTimer)
    radarTimer = setTimeout(() => {
      radar.value = null
      radarTimer = null
    }, 5000)
  }
  const ranking = ref<FilaRankingOnline[]>([])
  const puntosRanking = ref(0)
  const chat = ref<MensajeChatOnline[]>([])
  const errorSala = ref<string | null>(null)
  const apuestaPendiente = ref(false)
  const salaApuestaId = ref<string | null>(null)
  const jugadoresApuesta = ref<{ id: string; nombre: string; confirmado: boolean }[]>([])
  const errorApuesta = ref<string | null>(null)
  const errorAumentoApuesta = ref<string | null>(null)
  const eventoRitmo = ref<string | null>(null)
  const efectos = ref<Record<string, EfectoActivoOnline[]>>({})
  /** Quien ya volvió al lobby online no debe reentrar a la partida por un evento tardío. */
  let quiereHub = false
  let contextoChat = ''

  function cargarHistorialChat(contexto: string) {
    if (!contexto || contexto === contextoChat) return
    contextoChat = contexto
    socket.emit('chat:history', { contexto })
  }

  function claveMarcas(salaId: string): string {
    return `df-online-marcas:${salaId}`
  }

  function persistirMarcas() {
    const salaId = sala.value?.salaId
    if (!salaId) return
    try {
      sessionStorage.setItem(claveMarcas(salaId), JSON.stringify([...marcas.value]))
    } catch {
      /* La partida sigue funcionando aunque el navegador no permita guardar. */
    }
  }

  function restaurarMarcas(vista: VistaSalaOnline): Set<number> {
    try {
      const guardadas: unknown = JSON.parse(sessionStorage.getItem(claveMarcas(vista.salaId)) ?? '[]')
      if (!Array.isArray(guardadas)) return new Set()
      const cantadas = new Set(vista.calledList)
      return new Set(guardadas.filter((indice): indice is number => {
        if (typeof indice !== 'number' || !Number.isInteger(indice) || indice < 0 || indice >= vista.tuCarton.length) return false
        const celda = vista.tuCarton[indice]
        return !!celda && !celda.free && cantadas.has(celda.number)
      }))
    } catch {
      return new Set()
    }
  }

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

  function sincronizarEfectos(vista: VistaSalaOnline) {
    const base = Date.now()
    const mapa: Record<string, EfectoActivoOnline[]> = {}
    for (const jugador of vista.jugadores ?? []) {
      const activos = (jugador.efectos ?? []).filter((efecto) => efecto.restanteMs > 0)
      if (activos.length === 0) continue
      mapa[jugador.id] = activos.map((efecto) => ({
        tipo: efecto.tipo,
        hasta: base + efecto.restanteMs,
        lanzadoPorNombre: efecto.lanzadoPorNombre,
        casillasBloqueadas: efecto.casillasBloqueadas,
        numerosFalsos: efecto.numerosFalsos,
      }))
    }
    efectos.value = mapa
  }

  function aplicarEfectoVuelo(vuelo: VueloBoosterOnline) {
    if (!vuelo.aplicado) return
    const previos = efectos.value[vuelo.objetivoId] ?? []
    const sinRepetir = previos.filter((efecto) => efecto.tipo !== vuelo.tipo)
    efectos.value = {
      ...efectos.value,
      [vuelo.objetivoId]: [
        ...sinRepetir,
        {
          tipo: vuelo.tipo,
          hasta: Date.now() + vuelo.restanteMs,
          lanzadoPorNombre: vuelo.deNombre,
          casillasBloqueadas: vuelo.casillasBloqueadas,
          numerosFalsos: vuelo.numerosFalsos,
        },
      ],
    }
  }

  function aplicarVista(vista: VistaSalaOnline) {
    if (quiereHub) return
    if (!vista?.salaId || !Array.isArray(vista.calledList)) return
    const salaNueva = sala.value?.salaId !== vista.salaId
    const estabaEsperando = sala.value?.estado === 'waiting'
    const rondaAnterior = sala.value?.serie?.ronda ?? 0
    const rondaNueva = vista.serie?.ronda ?? 0
    const cambiaRonda = !salaNueva && rondaNueva > rondaAnterior
    sala.value = vista
    eventoRitmo.value = vista.serie?.evento ?? null
    sincronizarEfectos(vista)
    const pool = vista.metodosVictoria?.length ? vista.metodosVictoria : vista.winModes
    if (salaNueva) {
      marcas.value = vista.modo === 'equipos'
        ? new Set(vista.tuCarton.flatMap((celda, indice) => celda.marked && !celda.free ? [indice] : []))
        : restaurarMarcas(vista)
      showRuleta.value = vista.estado === 'playing' && (pool?.length ?? 0) > 0
    }
    if (!salaNueva && estabaEsperando && vista.estado === 'playing') {
      showRuleta.value = (pool?.length ?? 0) > 0
    }
    if (cambiaRonda) {
      marcas.value = new Set(vista.tuCarton.flatMap((celda, indice) => celda.marked && !celda.free ? [indice] : []))
      persistirMarcas()
      cantadas.value = [...vista.calledList]
      ultimaBola.value = vista.lastDrawn
      showRuleta.value = vista.modo === 'equipos' && (pool?.length ?? 0) > 0
    } else if (vista.modo === 'equipos' && sala.value?.estado === 'playing') {
      marcas.value = new Set(vista.tuCarton.flatMap((celda, indice) => celda.marked && !celda.free ? [indice] : []))
    }
    rivalMarcas.value = new Set(
      (vista.cartonRival?.celdas ?? []).flatMap((celda, indice) => (celda.marked && !celda.free ? [indice] : [])),
    )
    if (!cambiaRonda && vista.calledList.length >= cantadas.value.length) {
      cantadas.value = [...vista.calledList]
    }
    if (!cambiaRonda && vista.lastDrawn !== null) ultimaBola.value = vista.lastDrawn
    if (vista.estado === 'finished') {
      ganadorId.value = vista.ganador
      showRuleta.value = false
      fase.value = 'terminado'
      return
    }
    fase.value = apuestaPendiente.value ? 'apuesta' : 'jugando'
  }

  socket.on('connect', () => {
    conectado.value = true
    errorConexion.value = null
    contextoChat = ''
    cargarHistorialChat('lobby-online')
  })
  socket.on('disconnect', () => {
    conectado.value = false
  })
  socket.on('connect_error', (err: Error) => {
    conectado.value = false
    errorConexion.value =
      !err.message || err.message === 'websocket error'
        ? 'No se pudo conectar al servidor de partidas.'
        : err.message
  })

  socket.on('queue:joined', () => {
    fase.value = 'cola'
  })
  socket.on('queue:left', () => {
    if (fase.value === 'cola') fase.value = 'idle'
  })
  socket.on('match:found', (payload: { salaId?: string }) => {
    if (quiereHub) return
    espera.value = null
    fase.value = apuestaPendiente.value ? 'apuesta' : 'jugando'
    cargarHistorialChat(payload?.salaId ? `partida:${payload.salaId}` : '')
  })
  socket.on('room:state', (vista: VistaSalaOnline) => {
    if ('codigo' in vista) {
      cargarHistorialChat(`sala:${vista.codigo}`)
    } else {
      aplicarVista(vista)
      cargarHistorialChat(`partida:${vista.salaId}`)
    }
  })
  socket.on('betting:open', (payload: { salaId?: string; jugadores?: { id: string; nombre: string; confirmado: boolean }[] }) => {
    if (quiereHub) return
    apuestaPendiente.value = true
    salaApuestaId.value = payload.salaId ?? sala.value?.salaId ?? null
    errorApuesta.value = null
    jugadoresApuesta.value = payload.jugadores ?? []
    fase.value = 'apuesta'
    if (sala.value?.salaId) cargarHistorialChat(`partida:${sala.value.salaId}`)
  })
  socket.on('betting:state', (payload: { jugadores?: { id: string; nombre: string; confirmado: boolean }[] }) => {
    jugadoresApuesta.value = payload.jugadores ?? []
  })
  socket.on('betting:error', (payload: { mensaje?: string }) => {
    errorApuesta.value = payload?.mensaje ?? 'No se pudo registrar la apuesta. Elige otro monto.'
    mostrarAviso(errorApuesta.value)
  })
  socket.on('betting:closed', (payload: { apuestas?: Record<string, number> }) => {
    apuestaPendiente.value = false
    errorApuesta.value = null
    const monto = payload?.apuestas?.[usuarioId]
    if (sala.value && monto) sala.value = { ...sala.value, apuesta: monto }
    salaApuestaId.value = null
    fase.value = 'jugando'
  })
  socket.on('betting:cancelled', (payload: { mensaje?: string }) => {
    apuestaPendiente.value = false
    salaApuestaId.value = null
    jugadoresApuesta.value = []
    fase.value = 'idle'
    sala.value = null
    showRuleta.value = false
    mostrarAviso(payload?.mensaje ?? 'La preparación de la partida se canceló.')
  })
  socket.on('ball:called', (payload: { numero: number; evento?: string | null }) => {
    if (quiereHub) return
    ultimaBola.value = payload.numero
    if (!cantadas.value.includes(payload.numero)) cantadas.value.push(payload.numero)
    eventoRitmo.value = payload.evento ?? null
  })
  socket.on('game:over', (vista: VistaSalaOnline) => {
    if (quiereHub) return
    aplicarVista(vista)
    ganadorId.value = vista.ganador
    fase.value = 'terminado'
    void progress.hidratarDesdeApi().catch(() => {})
  })
  socket.on('game:summary', (r: ResumenOnline) => {
    resumen.value = r
  })
  socket.on('team:bet:error', (payload: { mensaje?: string }) => {
    errorAumentoApuesta.value = payload?.mensaje ?? 'No se pudo aumentar la apuesta.'
    mostrarAviso(errorAumentoApuesta.value)
  })
  socket.on('claim:rejected', (p: { mensaje: string }) => mostrarAviso(p.mensaje))
  socket.on('queue:warning', (p: { mensaje: string }) => mostrarAlerta(p.mensaje))
  socket.on('game:connection-paused', (p: { nombre?: string }) => {
    mostrarAlerta(`${p?.nombre ?? 'Un jugador'} perdió conexión. La partida se pausó mientras vuelve.`)
  })
  socket.on('game:connection-resumed', (p: { nombre?: string }) => {
    mostrarAviso(`${p?.nombre ?? 'El jugador'} volvió a la partida.`)
  })
  socket.on('game:afk-warning', (p: { segundos?: number }) => {
    mostrarAlerta(`Sigues inactivo. Realiza una acción en los próximos ${p?.segundos ?? 60} segundos para conservar tu lugar.`)
  })
  socket.on('game:afk-resumed', () => mostrarAviso('Actividad reanudada; conservas tu lugar en la partida.'))
  socket.on('game:afk-player', (p: { nombre?: string }) => {
    mostrarAviso(`${p?.nombre ?? 'Un jugador'} salió por inactividad.`)
  })
  socket.on('game:afk-removed', (p: { nombre?: string }) => {
    sala.value = null
    fase.value = 'idle'
    mostrarAlerta(`${p?.nombre ?? 'Tu jugador'} salió de la partida por inactividad.`)
  })
  socket.on('room:state', (vista: SalaEsperaOnline) => {
    if (!vista || !('codigo' in vista)) return
    espera.value = vista
    errorSala.value = null
  })
  socket.on('room:closed', () => {
    espera.value = null
  })
  socket.on('room:error', (p: { mensaje: string }) => {
    errorSala.value = p.mensaje
    mostrarAviso(p.mensaje)
  })
  socket.on('ranking:lista', (filas: FilaRankingOnline[]) => {
    ranking.value = filas
  })
  socket.on('ranking:perfil', (payload: { puntos?: number }) => {
    puntosRanking.value = Math.max(0, Math.floor(Number(payload?.puntos ?? 0)))
  })
  socket.on('profile:refresh', () => {
    void progress.hidratarDesdeApi().catch(() => {})
    pedirRanking()
  })
  socket.on('ranking:error', (payload: { mensaje?: string }) => {
    ranking.value = []
    mostrarAviso(payload?.mensaje ?? 'No se pudo cargar el ranking.')
  })
  socket.on('chat:message', (mensaje: MensajeChatOnline) => {
    chat.value = [...chat.value, mensaje].slice(-40)
  })
  socket.on('chat:history', (payload: { contexto?: string; mensajes?: MensajeChatOnline[] }) => {
    if (payload?.contexto !== contextoChat) return
    chat.value = Array.isArray(payload.mensajes) ? payload.mensajes.slice(-100) : []
  })
  socket.on('chat:error', (payload: { mensaje?: string }) => mostrarAviso(payload?.mensaje ?? 'No se pudo enviar el mensaje.'))
  socket.on('booster:lanzado', (vuelo: VueloBoosterOnline) => {
    aplicarEfectoVuelo(vuelo)
    window.dispatchEvent(new CustomEvent('df-booster-vuelo', { detail: vuelo }))
  })
  socket.on('booster:rechazo', (payload: RechazoBoosterOnline) => {
    mostrarAviso(payload?.mensaje ?? 'No se pudo lanzar el booster.')
    window.dispatchEvent(new CustomEvent('df-booster-rechazo', { detail: payload }))
  })
  socket.on('radar:evento', (contacto: RadarVisible) => {
    if (quiereHub || !contacto?.nombre) return
    mostrarRadar(contacto)
  })
  socket.on('radar:resultado', (contacto: RadarVisible & { stockRestante?: number; espera?: number }) => {
    if (quiereHub || !contacto?.nombre) return
    if (sala.value && typeof contacto.espera === 'number') {
      sala.value = { ...sala.value, localizadorEspera: contacto.espera }
    }
    if (typeof contacto.stockRestante === 'number') {
      progress.actualizarStockBooster(5, contacto.stockRestante)
    }
    mostrarRadar(contacto)
  })
  socket.on('radar:aviso', (payload: { mensaje?: string }) => {
    if (quiereHub) return
    mostrarAviso(payload?.mensaje || 'Alguien acaba de escanear.')
  })
  socket.on('pvp:marcas', (payload: { jugadorId?: string; marcas?: number[] }) => {
    if (!payload || payload.jugadorId !== sala.value?.cartonRival?.id) return
    const lista = Array.isArray(payload.marcas) ? payload.marcas : []
    rivalMarcas.value = new Set(lista.filter((indice) => Number.isInteger(indice) && indice >= 0))
  })

  function conectar() {
    if (!socket.connected) socket.connect()
  }

  function buscar(mesa?: { modo: 'mesa' | 'pvp' | 'equipos'; cupo: 2 | 4 | 6 | 8 }) {
    quiereHub = false
    errorConexion.value = null
    espera.value = null
    chat.value = []
    apuestaPendiente.value = false
    salaApuestaId.value = null
    conectar()
    fase.value = 'cola'
    const entrar = () => socket.emit('queue:join', mesa ?? { modo: 'mesa', cupo: 4 })
    if (socket.connected) entrar()
    else socket.once('connect', entrar)
  }

  function pedirRanking() {
    const pedir = () => socket.emit('ranking:pedir')
    if (socket.connected) pedir()
    else socket.once('connect', pedir)
  }

  function enviarChat(texto: string) {
    const limpio = texto.trim().slice(0, 80)
    if (!limpio) return
    const mandar = () => socket.emit('chat:send', { texto: limpio })
    conectar()
    if (socket.connected) mandar()
    else socket.once('connect', mandar)
  }

  function confirmarApuesta(monto: number) {
    errorApuesta.value = null
    socket.emit('betting:confirm', { salaId: salaApuestaId.value ?? sala.value?.salaId, monto })
  }

  function aumentarApuesta(monto: number) {
    errorAumentoApuesta.value = null
    socket.emit('team:bet:raise', { monto })
  }

  function crearSala(mesa?: { modo: 'mesa' | 'pvp' | 'equipos'; cupo: 2 | 4 | 6 | 8; apuesta?: number; radar?: boolean }) {
    quiereHub = false
    errorSala.value = null
    chat.value = []
    const crear = () => socket.emit('room:create', mesa ?? { modo: 'mesa', cupo: 4, radar: false })
    conectar()
    if (socket.connected) crear()
    else socket.once('connect', crear)
  }

  function unirseSala(codigo: string) {
    quiereHub = false
    errorSala.value = null
    chat.value = []
    const codigoLimpio = codigo.trim().toUpperCase()
    if (!codigoLimpio) return
    const unirse = () => {
      if (espera.value?.codigo === codigoLimpio || sala.value) return
      socket.emit('room:join', { codigo: codigoLimpio })
    }
    conectar()
    if (socket.connected) unirse()
    else socket.once('connect', unirse)
  }

  function abandonarPartida(): Promise<void> {
    if (!socket.connected) return Promise.resolve()
    return new Promise((resolve) => {
      socket.timeout(5000).emit('game:leave', (error: Error | null) => {
        void error
        resolve()
      })
    })
  }

  /** Sale de la partida y se queda en el lobby de Modo online, con una conexión nueva. */
  function volverAlLobby(): Promise<void> {
    quiereHub = true
    return abandonarPartida().then(() => {
      reiniciar()
      socket.disconnect()
      socket.connect()
    })
  }

  function salirSala() {
    socket.emit('room:leave')
    espera.value = null
  }

  function empezarSala(modo: 'sala' | 'bots') {
    socket.emit('room:start', { modo })
  }

  function fijarApuesta(monto: 20 | 100) {
    socket.emit('room:apuesta', { monto })
  }

  function configurarBotsSala(habilitado: boolean) {
    socket.emit('room:bots', { habilitado })
  }

  function fijarApuestaSala(monto: number) {
    socket.emit('room:apuesta', { monto })
  }

  function lanzarBooster(boosterId: number, objetivoId: string) {
    socket.emit('booster:lanzar', { boosterId, objetivoId })
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
    persistirMarcas()
    publicarMarca(indice, !yaMarcada)
  }

  function quitarMarca(indice: number) {
    if (!marcas.value.has(indice)) return
    const siguiente = new Set(marcas.value)
    siguiente.delete(indice)
    marcas.value = siguiente
    persistirMarcas()
    publicarMarca(indice, false)
  }

  function publicarMarca(indice: number, activa: boolean) {
    if (!sala.value || sala.value.estado !== 'playing') return
    socket.emit('pvp:marcar', { indice, activa })
  }

  function onMetodoElegido() {
    showRuleta.value = false
  }

  function reiniciar() {
    if (sala.value?.salaId) {
      try {
        sessionStorage.removeItem(claveMarcas(sala.value.salaId))
      } catch {
        /* Ignorar si el almacenamiento de sesión está bloqueado. */
      }
    }
    sala.value = null
    cantadas.value = []
    marcas.value = new Set()
    rivalMarcas.value = new Set()
    ultimaBola.value = null
    ganadorId.value = null
    resumen.value = null
    aviso.value = null
    alerta.value = null
    showRuleta.value = false
    espera.value = null
    radar.value = null
    if (radarTimer) clearTimeout(radarTimer)
    radarTimer = null
    apuestaPendiente.value = false
    salaApuestaId.value = null
    jugadoresApuesta.value = []
    errorApuesta.value = null
    efectos.value = {}
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

  const cartonRival = computed(() => sala.value?.cartonRival ?? null)

  const celdasRival = computed<BingoCell[]>(() =>
    (cartonRival.value?.celdas ?? []).map((celda, indice) => ({
      ...celda,
      marked: celda.free || rivalMarcas.value.has(indice),
    })),
  )

  const metodosVictoria = computed(() => {
    const actual = sala.value
    if (!actual) return []
    if (actual.metodosVictoria?.length) return actual.metodosVictoria
    return actual.winModes ?? []
  })
  const metodoVictoria = computed(() => sala.value?.winModes[0] ?? null)

  const esGanador = computed(() => {
    if (sala.value?.modo === 'equipos') {
      const equipo = sala.value.serie?.equipoGanador
      const mio = sala.value.jugadores.find((jugador) => jugador.id === usuarioId)?.equipo
      return !!equipo && equipo === mio
    }
    return !!ganadorId.value && ganadorId.value === usuarioId
  })

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
    pedirRanking()
  })

  onUnmounted(() => {
    if (avisoTimer) clearTimeout(avisoTimer)
    if (alertaTimer) clearTimeout(alertaTimer)
    if (radarTimer) clearTimeout(radarTimer)
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
    cartonRival,
    celdasRival,
    metodosVictoria,
    metodoVictoria,
    esGanador,
    indicesGanadores,
    ganador,
    espera,
    radar,
    ranking,
    puntosRanking,
    chat,
    errorSala,
    apuestaPendiente,
    jugadoresApuesta,
    errorApuesta,
    errorAumentoApuesta,
    eventoRitmo,
    efectos,
    buscar,
    pedirRanking,
    enviarChat,
    confirmarApuesta,
    aumentarApuesta,
    crearSala,
    unirseSala,
    salirSala,
    empezarSala,
    fijarApuesta,
    configurarBotsSala,
    fijarApuestaSala,
    lanzarBooster,
    mostrarAviso,
    cancelar,
    cantar,
    marcarCelda,
    quitarMarca,
    onMetodoElegido,
    reiniciar,
    abandonarPartida,
    volverAlLobby,
    desconectar,
    conectar,
  }
}
