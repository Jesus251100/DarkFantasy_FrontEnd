<template>
  <div class="online">
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
            {{ entrada ? 'PREPARANDO LA PARTIDA' : conectado ? tituloBusqueda : 'RECONECTANDO' }}
          </p>
          <p class="carga-detalle">
            {{
              entrada
                ? 'Las runas sellan la mesa de juego…'
                : conectado
                  ? detalleBusqueda
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

    <section v-else-if="fase === 'apuesta'" class="pantalla-apuesta">
      <div class="apuesta-marco">
        <header class="apuesta-cabecera">
          <span class="apuesta-sello">✦ · ✧ · ✦</span>
          <p>ANTES DE EMPEZAR</p>
          <h1>Confirma tu apuesta</h1>
          <span class="apuesta-runa">La partida inicia cuando todos confirmen.</span>
        </header>
        <div class="apuesta-contenido">
          <div class="apuesta-control">
            <div class="apuesta-monto">
              <span>Tu apuesta</span>
              <strong>{{ montoGlobalApuesta.toLocaleString('es-CO') }} <small>🪙</small></strong>
              <span class="apuesta-saldo">Saldo disponible · {{ progress.coins.toLocaleString('es-CO') }} monedas</span>
            </div>
            <div class="apuesta-fichas" aria-label="Montos sugeridos">
              <button v-for="monto in montosSugeridos" :key="monto" type="button" :class="{ activa: montoGlobalApuesta === monto }" @click="montoGlobalApuesta = monto">{{ monto.toLocaleString('es-CO') }}</button>
            </div>
            <label class="apuesta-rango">
              <span>Apuesta <b>200 — 2.000</b></span>
              <input v-model.number="montoGlobalApuesta" type="range" min="200" max="2000" step="50" />
              <span class="rango-extremos"><small>200 · prudente</small><small>2.000 · audaz</small></span>
            </label>
            <div class="apuesta-resumen">
              <span class="resumen-icono">♜</span>
              <span>Pozo estimado si todos apuestan lo mismo</span>
              <strong>{{ (montoGlobalApuesta * jugadoresApuesta.length).toLocaleString('es-CO') }} 🪙</strong>
            </div>
            <p v-if="montoGlobalApuesta > progress.coins" class="error-apuesta">No tienes ese monto disponible. Ajusta la apuesta para confirmar.</p>
            <p v-if="errorApuesta" class="error-apuesta">{{ errorApuesta }}</p>
            <button type="button" class="confirmar-apuesta" :disabled="montoGlobalApuesta < 200 || montoGlobalApuesta > 2000 || montoGlobalApuesta > progress.coins" @click="confirmarApuesta(montoGlobalApuesta)">
              <span>{{ jugadoresApuesta.find(j => j.id === usuarioId)?.confirmado ? 'ACTUALIZAR MI APUESTA' : 'CONFIRMAR APUESTA' }}</span><b>✦</b>
            </button>
          </div>
          <aside class="apuesta-rivales">
            <h2>EN LA MESA <span>{{ jugadoresApuesta.length }}</span></h2>
            <ul>
              <li v-for="jugador in jugadoresApuesta" :key="jugador.id" :class="{ listo: jugador.confirmado }">
                <span class="rival-sello">{{ inicial(jugador.nombre) }}</span>
                <span class="rival-nombre">{{ jugador.id === usuarioId ? 'Tú' : jugador.nombre }}</span>
                <span class="rival-estado">{{ jugador.confirmado ? 'APUESTA SELLADA' : 'ELIGIENDO' }}</span>
                <span class="rival-check">{{ jugador.confirmado ? '✓' : '…' }}</span>
              </li>
            </ul>
            <div class="chat-apuesta">
              <ChatSala compacto :mensajes="chat" :usuario-id="usuarioId" :escribiendo-jugadores="escribiendoChat" @enviar="enviarTexto" @escribiendo="online.indicarEscribiendoChat" />
            </div>
          </aside>
        </div>
        <footer class="apuesta-pie"><span>El pozo se reparte entre los ganadores.</span></footer>
      </div>
    </section>

    <section
      v-else-if="enPartida"
      class="partida"
      :class="{ 'pantalla-saboteada': estoySaboteado, 'pantalla-congelada': estoyCongelado }"
    >
      <div v-if="estoySaboteado" class="efecto-pantalla efecto-sabotaje" aria-hidden="true"><span></span></div>
      <div v-if="estoyCongelado" class="efecto-pantalla efecto-escarcha" aria-hidden="true">
        <i
          v-for="copo in particulasHielo"
          :key="copo"
          :style="{ left: `${(copo * 37) % 100}%`, '--duracion-copo': `${3 + (copo % 5) * 0.65}s`, '--retardo-copo': `${-(copo * 0.43)}s` }"
        ></i>
      </div>
      <header class="recursos-partida" aria-label="Tus recursos">
        <span>🪙 {{ progress.coins }}</span>
        <span>◆ {{ progress.diamonds }}</span>
        <span>🏆 {{ puntosRanking }}</span>
      </header>
      <aside v-if="fase === 'jugando' && sala?.estado === 'playing'" class="panel-voz" :class="{ expandido: panelVozAbierto }">
        <button class="voz-resumen" type="button" :aria-expanded="panelVozAbierto" @click="panelVozAbierto = !panelVozAbierto">
          <span class="voz-icono" aria-hidden="true">♫</span>
          <span class="voz-titulo">VOZ <small>{{ estadoVozTexto }}</small></span>
          <span class="voz-led" :class="`voz-${estadoVoz}`" aria-hidden="true"></span>
        </button>
        <div v-if="panelVozAbierto" class="voz-detalle">
          <p>{{ canalVozTexto }}</p>
          <p v-if="sala?.modo === 'equipos' && !companeroVoz" class="voz-espera">Tu compañero es un bot y no puede usar el chat de voz.</p>
          <button v-else-if="estadoVoz === 'apagada' || estadoVoz === 'error'" type="button" class="voz-accion" @click="online.conectarVoz()">CONECTAR CON VOZ</button>
          <template v-else>
            <div class="voz-botones">
              <button type="button" class="voz-accion" :disabled="estadoVoz !== 'conectada'" @click="online.alternarMicrofono()">
                {{ microfonoSilenciado ? 'ACTIVAR MICRÓFONO' : 'SILENCIAR MICRÓFONO' }}
              </button>
              <button type="button" class="voz-salir" @click="online.desconectarVoz()">SALIR</button>
            </div>
            <button v-if="audioVozPendiente" type="button" class="voz-accion voz-habilitar-audio" @click="online.habilitarAudioVoz()">HABILITAR AUDIO DEL COMPAÑERO</button>
            <ul v-if="participantesVoz.length" class="voz-participantes">
              <li v-for="participante in participantesVoz" :key="participante.id" :class="{ hablando: participante.hablando }">
                <span class="voz-led" :class="{ hablando: participante.hablando }"></span>{{ participante.nombre }}{{ participante.hablando ? ' · hablando' : '' }}
              </li>
            </ul>
            <p v-else class="voz-espera">Esperando a {{ sala?.modo === 'equipos' ? nombreCompaneroVoz : 'los demás jugadores' }}…</p>
          </template>
          <p v-if="errorVoz" class="voz-error" role="status">{{ errorVoz }}</p>
        </div>
        <div ref="audioVozHost" class="voz-audio-host" aria-hidden="true"></div>
      </aside>
      <div class="fila-jugadores">
        <button
          v-for="j in jugadores"
          :key="j.id"
          type="button"
          class="ficha"
          :data-jugador="j.id"
          :class="{
            yo: j.id === usuarioId,
            aliado: sala?.modo === 'equipos' && j.equipo === equipoPropio,
            objetivo: puedeRecibir(j.id),
            'fuera-de-tiro': apuntando && !puedeRecibir(j.id),
            hielo: tieneEfecto(j.id, 'freeze'),
            sabotaje: tieneEfecto(j.id, 'sabotage'),
            suerte: tieneEfecto(j.id, 'luck'),
            escudo: tieneEfecto(j.id, 'shield'),
            'impacto-freeze': impactoDe(j.id) === 1,
            'impacto-sabotage': impactoDe(j.id) === 2,
            'impacto-luck': impactoDe(j.id) === 3,
            'impacto-shield': impactoDe(j.id) === 4,
            ganador: j.ganador,
          }"
          @click="elegirObjetivo(j.id)"
        >
          <span class="foto">
            <img v-if="retrato(j.nombre, j.avatarUrl)" :src="retrato(j.nombre, j.avatarUrl) || ''" :alt="j.nombre" />
            <span v-else>{{ inicial(j.nombre) }}</span>
            <span
              v-for="efecto in efectosDe(j.id)"
              :key="'capa-' + efecto.tipo"
              class="capa-efecto"
              :class="'capa-' + efecto.tipo"
              aria-hidden="true"
            ><img v-if="efecto.tipo === 'shield'" class="escudo-insignia" :src="iconoPorEfecto(efecto.tipo)" alt="" /></span>
            <span
              v-if="impactoDe(j.id) !== null"
              class="impacto"
              :class="'impacto-' + impactoDe(j.id)"
              aria-hidden="true"
            >
              <img :src="iconoPorBooster(impactoDe(j.id) ?? 0)" alt="" />
            </span>
          </span>
          <span class="fnombre">{{ j.nombre }}</span>
          <span class="fmeta">{{ etiquetaJugador(j) }}</span>
          <span v-if="efectosDe(j.id).length" class="efectos">
            <span
              v-for="efecto in efectosDe(j.id)"
              :key="'chip-' + efecto.tipo"
              class="efecto-chip"
              :class="'chip-' + efecto.tipo"
              :title="`Lanzado por ${efecto.lanzadoPorNombre}`"
            >
              <img :src="iconoPorEfecto(efecto.tipo)" alt="" />
              <b>{{ segundosEfecto(efecto) }}s</b>
            </span>
          </span>
        </button>
      </div>

      <p v-if="sala?.apuesta && !sala?.serie" class="apuesta-activa">Apuesta {{ sala.apuesta }} monedas</p>
      <section v-if="sala?.serie" class="marcador-equipos" aria-label="Marcador de la serie">
        <div class="lado-serie lado-carmesi">
          <strong>{{ sala.serie.nombres.equipo1 }}</strong>
          <span class="puntos-equipo">{{ sala.serie.equipo1 }}</span>
          <div class="rondas-equipo" :aria-label="`Rondas de ${sala.serie.nombres.equipo1}`">
            <span v-for="ronda in 3" :key="ronda" class="casilla-ronda" :class="claseCasillaRonda(1, ronda - 1)">{{ String(ronda).padStart(2, '0') }}</span>
          </div>
          <small>COMBO {{ sala.serie.combo.equipo1 }}</small>
        </div>
        <div class="centro-serie">
          <span>RONDA {{ sala.serie.ronda }} / 3</span>
          <b>VS</b>
          <span>{{ sala.serie.pozo.toLocaleString('es-CO') }} 🪙 EN JUEGO</span>
        </div>
        <div class="lado-serie lado-umbria">
          <strong>{{ sala.serie.nombres.equipo2 }}</strong>
          <span class="puntos-equipo">{{ sala.serie.equipo2 }}</span>
          <div class="rondas-equipo" :aria-label="`Rondas de ${sala.serie.nombres.equipo2}`">
            <span v-for="ronda in 3" :key="ronda" class="casilla-ronda" :class="claseCasillaRonda(2, ronda - 1)">{{ String(ronda).padStart(2, '0') }}</span>
          </div>
          <small>COMBO {{ sala.serie.combo.equipo2 }}</small>
        </div>
      </section>
      <p v-if="sala?.serie?.aviso" class="aviso-ronda" aria-live="polite">{{ sala.serie.aviso }}</p>
      <p v-if="eventoRitmo" class="evento-oleada" role="status">✦ {{ eventoRitmo }} ✦</p>
      <p v-if="sala?.serie && progresoMetodo >= 0.8 && sala.serie.fase === 'jugando'" class="aviso-casi" aria-live="polite">
        ✦ {{ Math.max(0, Math.ceil((1 - progresoMetodo) * cantidadCasillasMetodo)) }} marcas para completar el sello ✦
      </p>
      <div class="mesa">
        <div class="oraculo">
          <div :key="ultimaBola ?? 'vacia'" class="bola" :class="{ vacia: ultimaBola === null, oleada: !!eventoRitmo }">{{ ultimaBola ?? '—' }}</div>
          <p class="lbl">Última bola</p>
          <div class="recientes">
            <span v-for="(n, i) in oracleSlots" :key="i" class="mini">{{ n ?? '' }}</span>
          </div>
          <span v-if="tengoSuerte" class="trebol-oraculo" aria-label="Good Luck activo">☘</span>
        </div>

        <div class="carton-wrap" :class="{ congelado: estoyCongelado, sabotaje: estoySaboteado, suerte: tengoSuerte, escudo: tengoEscudo }">
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
            :casillas-bloqueadas="casillasSaboteadas"
            :numeros-falsos="numerosFalsos"
            @marcar="marcarCelda"
            @escribir="escribirNiebla"
            @enviar="enviarNiebla"
          />
        </div>

        <aside class="lista">
          <section v-if="cartonRival" class="carton-rival" :aria-label="'Cartón de ' + cartonRival.nombre">
            <p class="rival-titulo">Cartón de {{ cartonRival.nombre }}</p>
            <div class="rival-progreso" role="status">
              <span>Progreso</span>
              <strong>{{ progresoRival.porcentaje }}%</strong>
              <div class="rival-progreso-barra" role="progressbar" :aria-valuenow="progresoRival.porcentaje" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progreso de ${cartonRival.nombre}`"><i :style="{ width: `${progresoRival.porcentaje}%` }"></i></div>
              <small>{{ progresoRival.hechas }}/{{ progresoRival.total }} para {{ metodoNombre }}</small>
            </div>
            <p v-if="progresoRival.porcentaje >= 80" class="rival-peligro" aria-live="polite">{{ cartonRival.nombre }} está cerca de completar la figura</p>
            <div class="rival-letras" :style="{ gridTemplateColumns: `repeat(${sala?.size ?? 5}, 1fr)` }">
              <span v-for="(letra, i) in letrasBingo" :key="i">{{ letra }}</span>
            </div>
            <div class="rival-board" :style="{ gridTemplateColumns: `repeat(${sala?.size ?? 5}, 1fr)` }">
              <span
                v-for="(celda, indice) in celdasRival"
                :key="indice"
                class="rival-cell"
                :class="{ marcada: celda.marked, libre: celda.free, llamada: !celda.free && cantadas.includes(celda.number) }"
              >{{ celda.free ? 'FREE' : celda.number }}</span>
            </div>
          </section>
          <ChatSala compacto :mensajes="chat" :usuario-id="usuarioId" :escribiendo-jugadores="escribiendoChat" @enviar="enviarTexto" @escribiendo="online.indicarEscribiendoChat" />
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
            <div class="progreso-sello" role="progressbar" :aria-valuenow="Math.round(progresoMetodo * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progreso del método ${metodoNombre}`">
              <span><i :style="{ width: `${Math.round(progresoMetodo * 100)}%` }"></i></span>
              <small>{{ Math.round(progresoMetodo * 100) }}% DEL SELLO</small>
            </div>
          </div>
          <div class="boosters">
            <button
              v-for="b in boosters"
              :key="b.id"
              type="button"
              class="booster"
              :data-booster="b.id"
              :title="tituloBooster(b)"
              :class="{ activo: boosterActivo === b.id, vacio: cantidad(b.id) <= 0, bloqueado: localizadorBloqueado(b.id) }"
              :disabled="fase !== 'jugando' || sala?.serie?.fase === 'intermedio' || lanzando || localizadorBloqueado(b.id)"
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
          :disabled="fase !== 'jugando' || sala?.serie?.fase === 'intermedio'"
          :aria-label="cantoListo ? '¡Bingo! Método completado, canta ahora' : 'Cantar bingo'"
          @click="cantar"
        >
          {{ cantoListo ? '¡CANTA BINGO!' : '¡BINGO!' }}
        </button>
        <div class="barra-lado">
          <button type="button" class="accion suave abandonar" @click="abriendoAbandono = true">ABANDONAR</button>
        </div>
      </div>

      <div v-if="apuntando" class="pista">
        <span>
          Elige a otro jugador para <strong>{{ nombreBoosterActivo }}</strong>. Este ataque no cae sobre ti.
        </span>
        <button type="button" class="cancelar-objetivo" @click="cancelarSeleccion">CANCELAR</button>
      </div>
      <p v-if="aviso" class="aviso">{{ aviso }}</p>

      <div v-if="mostrarOfertaApuesta" class="intermedio-velo">
        <section class="intermedio-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-aumento-apuesta">
          <span class="intermedio-sello">RONDA {{ sala?.serie?.ronda }} CONCLUIDA</span>
          <h2 id="titulo-aumento-apuesta">¿SUBES LA APUESTA?</h2>
          <p>Tu equipo comparte el cartón. Puedes añadir monedas al pozo antes de que empiece la siguiente ronda.</p>
          <strong class="pozo-intermedio">Pozo actual · {{ (sala?.serie?.pozo ?? 0).toLocaleString('es-CO') }} 🪙</strong>
          <div class="apuesta-fichas">
            <button v-for="monto in montosSugeridos" :key="monto" type="button" :class="{ activa: aumentoSeleccionado === monto }" @click="aumentoSeleccionado = monto">+{{ monto.toLocaleString('es-CO') }}</button>
          </div>
          <small>Saldo · {{ progress.coins.toLocaleString('es-CO') }} · Apuesta total máxima · 6.000 · {{ segundosIntermedio }} s</small>
          <p v-if="errorAumentoApuesta" class="error-apuesta">{{ errorAumentoApuesta }}</p>
          <div class="acciones-modal">
            <button type="button" class="accion" :disabled="subiendoApuesta || aumentoSeleccionado > progress.coins || (sala?.apuesta ?? 0) + aumentoSeleccionado > 6000" @click="confirmarAumentoApuesta">{{ subiendoApuesta ? 'SELLANDO…' : `AUMENTAR +${aumentoSeleccionado.toLocaleString('es-CO')}` }}</button>
            <button type="button" class="accion suave" @click="pasarAumento">PASAR ESTA VEZ</button>
          </div>
        </section>
      </div>

      <Teleport to="body">
        <span
          v-for="bola in proyectiles"
          :key="bola.id"
          class="proyectil"
          :class="'tipo-' + bola.boosterId"
          :style="{ left: bola.x + 'px', top: bola.y + 'px' }"
          aria-hidden="true"
        >
          <span class="proyectil-cuerpo">
            <img :src="iconoPorBooster(bola.boosterId)" alt="" />
          </span>
        </span>
      </Teleport>
    </section>

    <section v-else-if="espera" class="hub room">
      <header class="top">
        <span>🪙 {{ progress.coins }}</span>
        <span>◆ {{ progress.diamonds }}</span>
        <span>🏆 {{ puntosRanking }}</span>
      </header>
      <div class="room-layout">
        <section class="room-invite">
          <p class="sobrelinea">{{ tituloSala }}</p>
          <h1>Esperando jugadores</h1>
          <div class="sala-carga" aria-hidden="true">
            <span class="sala-carga-aro"></span>
            <img src="@/assets/img/dragon.png" alt="" />
          </div>
          <p class="estado-sala">{{ textoEsperaSala }}</p>
          <p class="codigo">{{ espera.codigo }}</p>
          <button type="button" class="accion copiar-codigo" @click="copiarCodigoSala">
            {{ copiado ? 'COPIADO' : 'COPIAR CÓDIGO' }}
          </button>
        </section>
        <div class="room-side">
        <aside class="panel lista-room">
          <h2>JUGADORES <span>{{ espera.jugadores.length }}/{{ espera.cupo }}</span></h2>
          <ul>
            <li v-for="(j, index) in slotsSala" :key="j?.id ?? `slot-${index}`" :class="{ vacio: !j }">
              <template v-if="j">
              <span class="mini-foto">
                <img v-if="retrato(j.nombre, j.avatarUrl)" :src="retrato(j.nombre, j.avatarUrl) || ''" alt="" />
                <span v-else>{{ inicial(j.nombre) }}</span>
              </span>
              <span>{{ j.nombre }}</span>
              <small v-if="espera.modo === 'equipos'" class="puesto-equipo">{{ index % 2 === 0 ? 'LUNA CARMESÍ' : 'LEGIÓN UMBRÍA' }}</small>
              <span v-if="j.id === espera.anfitrionId" class="estado">anfitrión</span>
              </template>
              <template v-else><span class="slot-vacio">✧</span><span>Esperando jugador…</span></template>
            </li>
          </ul>
        </aside>
        <div class="room-actions">
          <p class="hint apuesta-visible">Apuesta acordada: <strong>{{ espera.apuesta.toLocaleString('es-CO') }} monedas</strong> por jugador.</p>
          <template v-if="soyAnfitrion">
            <div class="apuesta-sala-selector">
              <div class="selector-titulo"><span>APUESTA POR JUGADOR</span><strong>{{ montoSala.toLocaleString('es-CO') }} <small>🪙</small></strong></div>
              <div class="apuesta-fichas">
                <button v-for="monto in montosSugeridos" :key="monto" type="button" :class="{ activa: montoSala === monto }" @click="actualizarApuestaSala(monto)">{{ monto.toLocaleString('es-CO') }}</button>
              </div>
              <input v-model.number="montoSala" class="slider-apuesta" type="range" min="200" max="2000" step="50" @change="online.fijarApuestaSala(montoSala)" />
            </div>
          <p class="hint">Cada jugador necesita {{ espera.apuesta }} monedas.</p>
            <label v-if="espera.permiteBots" class="bots-toggle">
              <input type="checkbox" :checked="espera.completarConBots" @change="cambiarRellenoBots" />
              <span>{{ espera.modo === 'equipos' ? 'Rellenar con bots (opcional)' : 'Completar los puestos vacíos con bots' }}<small v-if="espera.modo === 'equipos'">Mínimo: una persona en cada equipo.</small></span>
            </label>
            <button type="button" class="accion" :disabled="espera.jugadores.length < minimoJugadoresSala || (espera.completarConBots && !espera.permiteBots) || (espera.completarConBots && espera.jugadores.length < espera.cupo && !equiposRepresentados) || espera.apuesta < 200 || espera.apuesta > 2000" @click="empezar(espera.completarConBots && espera.jugadores.length < espera.cupo ? 'bots' : 'sala')">
              {{ espera.completarConBots && espera.jugadores.length < espera.cupo ? 'INICIAR CON BOTS' : 'INICIAR PARTIDA' }}
            </button>
            <p class="hint">{{ pistaAnfitrion }}</p>
          </template>
          <p v-else class="hint">La sala inicia cuando el anfitrión esté listo.</p>
          <p v-if="errorSala" class="error">{{ textoErrorSala }}</p>
          <button type="button" class="accion suave" @click="volverSala">SALIR DE LA SALA</button>
        </div>
          <ChatSala compacto :mensajes="chat" :usuario-id="usuarioId" :escribiendo-jugadores="escribiendoChat" @enviar="enviarTexto" @escribiendo="online.indicarEscribiendoChat" />
        </div>
      </div>
    </section>

    <section v-else class="hub">
      <header class="top">
        <span>🪙 {{ progress.coins }}</span>
        <span class="conexion" :class="{ on: conectado }">{{ conectado ? 'en línea' : 'sin conexión' }}</span>
        <span>◆ {{ progress.diamonds }}</span>
        <span>🏆 {{ puntosRanking }}</span>
      </header>

      <div class="cuerpo">
        <ChatSala lleno :mensajes="chat" :usuario-id="usuarioId" :escribiendo-jugadores="escribiendoChat" @enviar="enviarTexto" @escribiendo="online.indicarEscribiendoChat" />

        <div class="centro">
          <div class="encabezado-online">
            <p class="sobrelinea">DARK FANTASY</p>
            <p class="titulo">MODO ONLINE</p>
          </div>
          <img src="@/assets/img/logo.png" alt="Dark Fantasy" class="logo" />
          <div class="acciones-online">
            <button type="button" class="accion accion-principal" @click="abrirMesa('jugar')">JUGAR PARTIDA</button>
            <button type="button" class="accion accion-secundaria" @click="abriendoUnion = true">UNIRSE A UNA SALA</button>
            <button type="button" class="accion accion-secundaria" @click="abrirMesa('crear')">CREAR SALA</button>
            <button type="button" class="accion suave accion-salir" @click="salir">SALIR</button>
          </div>
          <p v-if="errorConexion" class="error">{{ errorConexion }}</p>
        </div>

        <aside class="panel ranking">
          <h2>RANKING DE JUGADORES</h2>
          <p class="col">PUNTOS</p>
          <ol>
            <li v-for="(fila, i) in ranking" :key="fila.usuarioId">
              <span class="puesto">{{ i + 1 }}</span>
              <span class="mini-foto">
                <img v-if="retrato(fila.nombre, fila.avatarUrl)" :src="retrato(fila.nombre, fila.avatarUrl) || ''" alt="" />
                <span v-else>{{ inicial(fila.nombre) }}</span>
              </span>
              <span class="rnombre">{{ fila.nombre }}</span>
              <span class="puntos">{{ fila.puntos.toLocaleString('es-CO') }}</span>
            </li>
            <li v-if="ranking.length === 0" class="ranking-vacio">Aún no hay victorias online registradas.</li>
          </ol>
        </aside>
      </div>
    </section>

    <div v-if="eligiendo" class="modal-backdrop" @click.self="eligiendo = null">
      <div class="modal mesa-modal">
        <h2>{{ eligiendo === 'crear' ? 'CREAR SALA' : 'JUGAR PARTIDA' }}</h2>
        <p>Elige la mesa. El cupo queda fijo para esta partida.</p>
        <div class="opciones-mesa">
          <button type="button" :class="{ on: mesa.modo === 'mesa' && mesa.cupo === 4 }" @click="fijarMesa('mesa', 4)">MESA DE 4</button>
          <button type="button" :class="{ on: mesa.modo === 'mesa' && mesa.cupo === 6 }" @click="fijarMesa('mesa', 6)">MESA DE 6</button>
          <button type="button" :class="{ on: mesa.modo === 'mesa' && mesa.cupo === 8 }" @click="fijarMesa('mesa', 8)">MESA DE 8</button>
          <button type="button" class="ancho" :class="{ on: mesa.modo === 'pvp' }" @click="fijarMesa('pvp', 2)">DUELO · 2 JUGADORES</button>
          <button type="button" class="ancho" :class="{ on: mesa.modo === 'equipos' }" @click="fijarMesa('equipos', 4)">BATALLA DE EQUIPOS · 2 VS 2</button>
        </div>
        <div v-if="mesa.modo === 'equipos'" class="reglas-equipos-modal">
          <span>Cartón compartido</span><span>3 rondas</span><span>Booster y ruleta</span>
        </div>
        <div v-if="eligiendo === 'crear'" class="apuesta-selector-modal">
          <div class="selector-titulo"><span>APUESTA POR JUGADOR</span><strong>{{ montoApuesta.toLocaleString('es-CO') }} <small>🪙</small></strong></div>
          <div class="apuesta-fichas">
            <button v-for="monto in montosSugeridos" :key="monto" type="button" :class="{ activa: montoApuesta === monto }" @click="montoApuesta = monto">{{ monto.toLocaleString('es-CO') }}</button>
          </div>
          <input v-model.number="montoApuesta" class="slider-apuesta" type="range" min="200" max="2000" step="50" />
          <small>La sala inicia si cada jugador cubre su apuesta. Tu saldo: {{ progress.coins.toLocaleString('es-CO') }} 🪙</small>
        </div>
        <label v-if="eligiendo === 'crear' && mesa.modo !== 'pvp'" class="escaneo-sala">
          <input v-model="escaneoSala" type="checkbox" />
          <span>Escaneo de sala</span>
        </label>
        <p v-if="eligiendo === 'crear' && mesa.modo !== 'pvp'" class="hint">El escaneo global puede activarse durante la partida.</p>
        <p v-if="eligiendo === 'crear' && mesa.modo === 'pvp'" class="hint">Duelo 1 vs 1 con jugadores reales. Sin bots ni Localizador.</p>
        <div v-else class="apuesta-despues">✧ La apuesta se elige al encontrar rivales, antes de la ruleta ✧</div>
        <p class="hint">{{ pistaMesa }}</p>
        <div class="acciones-modal">
          <button type="button" class="accion" @click="confirmarMesa">{{ eligiendo === 'crear' ? 'CREAR' : 'BUSCAR' }}</button>
          <button type="button" class="accion suave" @click="eligiendo = null">CANCELAR</button>
        </div>
      </div>
    </div>

    <div v-if="abriendoUnion" class="modal-backdrop" @click.self="abriendoUnion = false">
      <form class="modal union" @submit.prevent="unirse">
        <h2>UNIRSE</h2>
        <p>Ingresa el código de 4 letras.</p>
        <input v-model="codigo" maxlength="4" pattern="[A-Za-z]{4}" autocomplete="off" placeholder="CÓDIGO" @input="codigo = codigo.replace(/[^a-z]/gi, '').toUpperCase()" />
        <p v-if="errorSala" class="error">{{ textoErrorSala }}</p>
        <div class="acciones-modal">
          <button type="submit" class="accion">ENTRAR</button>
          <button type="button" class="accion suave" @click="abriendoUnion = false">CANCELAR</button>
        </div>
      </form>
    </div>

    <div v-if="fase === 'terminado'" class="modal-backdrop">
      <div class="modal" :class="{ gane: esGanador }">
        <h2>{{ tituloFin }}</h2>
        <p v-if="resumen?.anfitrionAbandono">El anfitrión abandonó la sala. La partida terminó y se devolvieron las apuestas.</p>
        <p v-else-if="sala?.modo === 'equipos' && sala.serie?.equipoGanador">
          Ganó {{ sala.serie.equipoGanador === 1 ? sala.serie.nombres.equipo1 : sala.serie.nombres.equipo2 }} · {{ sala.serie.equipo1 }} a {{ sala.serie.equipo2 }}
        </p>
        <p v-else-if="sala?.modo === 'equipos'">La serie quedó empatada.</p>
        <p v-else-if="ganador">Ganador: <strong>{{ ganador.nombre }}</strong></p>
        <p v-else>Nadie completó el patrón.</p>
        <p v-if="sala?.modo === 'pvp'" class="premio">Figura del duelo: {{ metodoNombre }}</p>
        <p class="premio">{{ esGanador ? '+75 XP · +250 monedas · +1 diamante' : '+25 XP · +75 monedas por participar' }}</p>
        <p v-if="resumen?.pozo" class="premio">
          {{ resumen.pozoPagado ? (esGanador ? `Tu parte del pozo: +${(resumen.pozoPorGanador?.[usuarioId] ?? resumen.pozo).toLocaleString('es-CO')} monedas.` : 'El pozo fue para el equipo ganador.') : 'El pozo se devolvió porque ganó un bot o no hubo ganador humano.' }}
        </p>
        <div class="acciones-modal">
          <button type="button" class="accion" @click="jugarOtraVez">JUGAR</button>
          <button type="button" class="accion suave" @click="volverAlLobbyOnline">SALIR</button>
        </div>
      </div>
    </div>

    <div v-if="abriendoAbandono" class="modal-backdrop" @click.self="abriendoAbandono = false">
      <div class="modal">
        <h2>¿Abandonar la partida?</h2>
        <p>Perderás hasta 50 XP, 10 monedas y 25 puntos de ranking. Si solo perdiste la conexión, podrás volver durante el tiempo de reconexión sin penalización.</p>
        <div class="acciones-modal">
          <button type="button" class="accion" @click="confirmarAbandono">ABANDONAR Y ACEPTAR PENALIZACIÓN</button>
          <button type="button" class="accion suave" @click="abriendoAbandono = false">SEGUIR JUGANDO</button>
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

    <div v-if="radar" class="radar-velo" aria-live="polite">
      <div class="radar-disco">
        <img :src="localizadorIcon" alt="" />
        <span class="radar-barrido"></span>
      </div>
      <p class="radar-leyenda">{{ radar.nombre }} · {{ radar.hechas }} de {{ radar.total }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import { useAudioStore } from '../stores/audio'
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
import type {
  EfectoActivoOnline,
  TipoEfectoBoosterOnline,
  VueloBoosterOnline,
} from '../domain/online/tipos'
import freezeIcon from '@/assets/img/freeze.png'
import shieldIcon from '@/assets/img/shield 1.png'
import luckIcon from '@/assets/img/goodluck 2.png'
import sabotageIcon from '@/assets/img/sabotage 2.png'
import localizadorIcon from '@/assets/img/localizador.png'
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

interface Impacto {
  boosterId: number
  hasta: number
}

const BOOSTERS = [
  { id: 3, nombre: 'Good Luck', icono: luckIcon },
  { id: 4, nombre: 'Shield', icono: shieldIcon },
  { id: 1, nombre: 'Freeze', icono: freezeIcon },
  { id: 2, nombre: 'Sabotage', icono: sabotageIcon },
  { id: 5, nombre: 'Localizador', icono: localizadorIcon },
] as const

const ICONO_BOOSTER: Record<number, string> = {
  1: freezeIcon,
  2: sabotageIcon,
  3: luckIcon,
  4: shieldIcon,
  5: localizadorIcon,
}

const ICONO_EFECTO: Record<TipoEfectoBoosterOnline, string> = {
  freeze: freezeIcon,
  sabotage: sabotageIcon,
  luck: luckIcon,
  shield: shieldIcon,
}

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
const audioSettings = useAudioStore()
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
  cartonRival,
  celdasRival,
  metodosVictoria,
  metodoVictoria,
  esGanador,
  indicesGanadores,
  ganador,
  resumen,
  espera,
  radar,
  ranking,
  puntosRanking,
  chat,
  escribiendoChat,
  errorSala,
  jugadoresApuesta,
  errorApuesta,
  errorAumentoApuesta,
  eventoRitmo,
  efectos,
  estadoVoz,
  microfonoSilenciado,
  participantesVoz,
  audioVozHost,
  audioVozPendiente,
  errorVoz,
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

const boosters = computed(() => sala.value?.modo === 'pvp' ? BOOSTERS.filter((booster) => booster.id !== 5) : BOOSTERS)
const codigo = ref('')
const abriendoUnion = ref(false)
type MesaElegidaVista = { modo: 'mesa' | 'pvp' | 'equipos'; cupo: 2 | 4 | 6 | 8; apuesta: number }

const eligiendo = ref<'jugar' | 'crear' | null>(null)
const mesa = ref<MesaElegidaVista>({ modo: 'mesa', cupo: 4, apuesta: 200 })
const escaneoSala = ref(true)
const montoApuesta = ref(200)
const montoGlobalApuesta = ref(500)
const montosSugeridos = [200, 500, 1000, 1500, 2000]
const montoSala = ref(200)
const aumentoSeleccionado = ref(500)
const ocultarOfertaApuesta = ref(false)
const subiendoApuesta = ref(false)
const tituloBusqueda = ref('BUSCANDO RIVAL')
const detalleBusqueda = ref('El oráculo busca un rival en las sombras…')
const abriendoAbandono = ref(false)
const copiado = ref(false)
const entrada = ref(false)
const boosterActivo = ref<number | null>(null)
const proyectiles = ref<Proyectil[]>([])
const impactos = ref<Record<string, Impacto>>({})
const particulasHielo = Array.from({ length: 24 }, (_, index) => index)
const lanzando = ref(false)
let proyectilSeq = 0
let relojEfectos: ReturnType<typeof setInterval> | null = null
let cierreCarga: ReturnType<typeof setTimeout> | null = null
let lanzandoTimer: ReturnType<typeof setTimeout> | null = null
let contextoSfx: AudioContext | null = null

const jugadores = computed(() => sala.value?.jugadores ?? [])
const equipoPropio = computed(() => sala.value?.jugadores.find((jugador) => jugador.id === usuarioId)?.equipo ?? null)
const companeroVoz = computed(() => jugadores.value.find((jugador) => jugador.id !== usuarioId && !jugador.esBot && jugador.equipo === equipoPropio.value))
const nombreCompaneroVoz = computed(() => companeroVoz.value?.nombre ?? 'tu compañero')
const canalVozTexto = computed(() => sala.value?.modo === 'equipos'
  ? `Canal privado con ${nombreCompaneroVoz.value}. El equipo rival no puede escucharlos.`
  : 'Canal de voz de esta partida.')
const estadoVozTexto = computed(() => ({ apagada: 'apagada', conectando: 'conectando…', conectada: microfonoSilenciado.value ? 'micrófono apagado' : 'en línea', reconectando: 'reconectando…', error: 'sin conexión' })[estadoVoz.value])
const panelVozAbierto = ref(false)
const equiposRepresentados = computed(() => espera.value?.modo !== 'equipos' || (espera.value?.jugadores.length ?? 0) >= 2)
const minimoJugadoresSala = computed(() => {
  const actual = espera.value
  if (!actual) return 1
  if (actual.modo === 'pvp') return actual.completarConBots ? 1 : 2
  if (actual.modo === 'equipos') return 2
  return Math.ceil(actual.cupo / 2)
})
const slotsSala = computed(() => Array.from({ length: espera.value?.cupo ?? 4 }, (_, index) => espera.value?.jugadores[index] ?? null))
const enPartida = computed(() => fase.value === 'jugando' || fase.value === 'terminado')
const mostrarCarga = computed(() => fase.value === 'cola' || entrada.value)
const metodoNombre = computed(() =>
  metodoVictoria.value ? nombreMetodo(metodoVictoria.value) : 'Elige el método',
)
const cantoListo = computed(() => {
  const modo = metodoVictoria.value
  if (fase.value !== 'jugando' || !modo) return false
  const figuras = patronDesdeModo(modo).indices(sala.value?.size ?? 5)
  return figuras.some(
    (figura) => figura.length > 0 && figura.every((indice) => tuCarton.value[indice]?.marked === true),
  )
})
const progresoMetodo = computed(() => {
  const modo = metodoVictoria.value
  if (!modo) return 0
  return progresoDeFigura(tuCarton.value, patronDesdeModo(modo).indices(sala.value?.size ?? 5))
})
const progresoRival = computed(() => {
  const modo = metodoVictoria.value
  const celdas = celdasRival.value
  if (!modo || !celdas.length) return { hechas: 0, total: 0, porcentaje: 0 }
  const figuras = patronDesdeModo(modo).indices(sala.value?.size ?? 5)
  let mejor = { hechas: 0, total: 0, ratio: 0 }
  for (const figura of figuras) {
    const utiles = figura.filter((indice) => celdas[indice] && !celdas[indice]?.free)
    if (!utiles.length) continue
    const hechas = utiles.filter((indice) => celdas[indice]?.marked).length
    const ratio = hechas / utiles.length
    if (ratio > mejor.ratio) mejor = { hechas, total: utiles.length, ratio }
  }
  return { ...mejor, porcentaje: Math.round(mejor.ratio * 100) }
})
const cantidadCasillasMetodo = computed(() => {
  const modo = metodoVictoria.value
  if (!modo) return 1
  const figuras = patronDesdeModo(modo).indices(sala.value?.size ?? 5)
  return Math.max(1, ...figuras.map((figura) => figura.length))
})
const mostrarOfertaApuesta = computed(() => {
  const serie = sala.value?.serie
  return sala.value?.modo === 'equipos'
    && serie?.fase === 'intermedio'
    && serie.ronda < 3
    && !serie.aumentaron.includes(usuarioId)
    && !ocultarOfertaApuesta.value
})
const segundosIntermedio = computed(() => {
  const vence = sala.value?.serie?.venceIntermedio
  return vence ? Math.max(0, Math.ceil((vence - ahora.value) / 1000)) : 0
})

function tocarSello() {
  if (audioSettings.sfx <= 0 || typeof window.AudioContext !== 'function') return
  try {
    contextoSfx ??= new AudioContext()
    if (contextoSfx.state === 'suspended') void contextoSfx.resume().catch(() => undefined)
    const inicio = contextoSfx.currentTime
    const volumen = Math.min(1, audioSettings.sfx / 100) * 0.045
    for (const [indice, frecuencia] of [660, 880].entries()) {
      const tono = contextoSfx.createOscillator()
      const ganancia = contextoSfx.createGain()
      tono.type = 'sine'
      tono.frequency.setValueAtTime(frecuencia, inicio + indice * 0.12)
      ganancia.gain.setValueAtTime(0.0001, inicio + indice * 0.12)
      ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + indice * 0.12 + 0.025)
      ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + indice * 0.12 + 0.2)
      tono.connect(ganancia)
      ganancia.connect(contextoSfx.destination)
      tono.start(inicio + indice * 0.12)
      tono.stop(inicio + indice * 0.12 + 0.21)
    }
  } catch {
    // El juego sigue sin efectos si el navegador no dispone de audio web.
  }
}
const fondoRuleta = computed(() => {
  const nivel = sala.value?.fondoNivel ?? 1
  return FONDOS_NIVELES[nivel - 1] ?? FONDOS_NIVELES[0]
})
const tituloFin = computed(() => {
  if (resumen.value?.anfitrionAbandono) return 'SALA CERRADA'
  if (sala.value?.modo === 'equipos') return esGanador.value ? '¡GANÓ TU EQUIPO!' : 'Fin de la serie'
  return esGanador.value ? '¡BINGO! GANASTE' : 'Fin de la partida'
})

const soyAnfitrion = computed(() => espera.value?.anfitrionId === usuarioId)
const tituloSala = computed(() => {
  const salaEspera = espera.value
  if (!salaEspera) return 'SALA PRIVADA'
  if (salaEspera.modo === 'pvp') return 'DUELO PRIVADO · 1 VS 1'
  return salaEspera.modo === 'equipos' ? 'BATALLA DE EQUIPOS · 2 VS 2' : `MESA DE ${salaEspera.cupo}`
})
const textoEsperaSala = computed(() => {
  const salaEspera = espera.value
  const cantidad = salaEspera?.jugadores.length ?? 0
  const cupo = salaEspera?.cupo ?? 4
  if (salaEspera?.modo === 'pvp') return cantidad === 2 ? 'Duelo listo para iniciar.' : 'Esperando al segundo jugador.'
  if (cantidad >= cupo) return 'Sala completa'
  const minimo = Math.ceil(cupo / 2)
  if (cantidad < minimo) return `Faltan ${minimo - cantidad} jugadores reales.`
  if (cantidad >= cupo) return 'Sala completa. Ya pueden iniciar.'
  return 'Ya pueden iniciar con los jugadores presentes.'
})
const pistaAnfitrion = computed(() => {
  const salaEspera = espera.value
  const cantidad = salaEspera?.jugadores.length ?? 0
  const cupo = salaEspera?.cupo ?? 4
  if (salaEspera?.modo === 'pvp') return cantidad < 2 ? 'Necesitas otro jugador real.' : 'Dos jugadores reales. Ya pueden empezar.'
  const minimo = Math.ceil(cupo / 2)
  if (cantidad < minimo) return `Se necesitan ${minimo} jugadores reales.`
  if (cantidad >= cupo) return 'La mesa está llena. Ya pueden empezar.'
  return 'Puedes iniciar con los jugadores presentes.'
})
const textoErrorSala = computed(() => {
  if (errorSala.value === 'Esa sala no existe.') {
    return 'No se encontró esa sala. Comprueba el código y que el anfitrión siga esperando.'
  }
  return errorSala.value
})
const apuntando = computed(() => boosterActivo.value !== null)
const nombreBoosterActivo = computed(
  () => BOOSTERS.find((b) => b.id === boosterActivo.value)?.nombre ?? '',
)

const ahora = ref(Date.now())

function efectosDe(id: string): EfectoActivoOnline[] {
  return (efectos.value[id] ?? []).filter((efecto) => efecto.hasta > ahora.value)
}

function tieneEfecto(id: string, tipo: TipoEfectoBoosterOnline): boolean {
  return efectosDe(id).some((efecto) => efecto.tipo === tipo)
}

function segundosEfecto(efecto: EfectoActivoOnline): number {
  return Math.max(0, Math.ceil((efecto.hasta - ahora.value) / 1000))
}

function impactoDe(id: string): number | null {
  const impacto = impactos.value[id]
  if (!impacto || impacto.hasta <= ahora.value) return null
  return impacto.boosterId
}

function iconoPorBooster(boosterId: number): string {
  return ICONO_BOOSTER[boosterId] ?? freezeIcon
}

function iconoPorEfecto(tipo: TipoEfectoBoosterOnline): string {
  return ICONO_EFECTO[tipo]
}

const estoyCongelado = computed(() => tieneEfecto(usuarioId, 'freeze'))
const estoySaboteado = computed(() => tieneEfecto(usuarioId, 'sabotage'))
const tengoSuerte = computed(() => tieneEfecto(usuarioId, 'luck'))
const tengoEscudo = computed(() => tieneEfecto(usuarioId, 'shield'))
const efectoSabotaje = computed(() => efectosDe(usuarioId).find((efecto) => efecto.tipo === 'sabotage'))
const casillasSaboteadas = computed(() => efectoSabotaje.value?.casillasBloqueadas ?? [])
const numerosFalsos = computed(() => efectoSabotaje.value?.numerosFalsos ?? {})

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
  return progress.boosterCount(id)
}

function esAtaque(id: number): boolean {
  return id === 1 || id === 2
}

function esDefensa(id: number): boolean {
  return id === 3 || id === 4
}

function puedeRecibir(idJugador: string): boolean {
  const boosterId = boosterActivo.value
  if (boosterId === null) return false
  if (esAtaque(boosterId)) {
    const objetivo = jugadores.value.find((jugador) => jugador.id === idJugador)
    return idJugador !== usuarioId && !(sala.value?.modo === 'equipos' && objetivo?.equipo === equipoPropio.value)
  }
  return idJugador === usuarioId
}

function marcarCelda(i: number) {
  if (bloqueaCarton() || nieblaIndices.value.includes(i)) return
  if (estoyCongelado.value) {
    online.mostrarAviso('Estás congelado.')
    return
  }
  if (casillasSaboteadas.value.includes(i)) {
    online.mostrarAviso('El sabotaje bloqueó esta casilla temporalmente.')
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

function etiquetaMesa(elegida: MesaElegidaVista): string {
  if (elegida.modo === 'pvp') return 'duelo PvP'
  return elegida.modo === 'equipos' ? 'batalla de equipos · 2 vs 2' : `mesa de ${elegida.cupo}`
}

function claseCasillaRonda(equipo: 1 | 2, indice: number): string {
  const serie = sala.value?.serie
  if (!serie) return ''
  if (indice < serie.ganadoresRonda.length) {
    const ganador = serie.ganadoresRonda[indice]
    return ganador === null ? 'ronda-empate' : ganador === equipo ? 'ronda-ganada' : 'ronda-perdida'
  }
  return indice === serie.ronda - 1 && serie.fase === 'jugando' ? 'ronda-activa' : 'ronda-pendiente'
}

function etiquetaJugador(jugador: { id: string; esBot: boolean; equipo?: 1 | 2 }): string {
  const lado = jugador.equipo ? `equipo ${jugador.equipo}` : ''
  if (jugador.id === usuarioId) return lado ? `tú · ${lado}` : 'tú'
  if (lado) return lado
  return jugador.esBot ? 'rival' : 'jugador'
}

const pistaMesa = computed(() => {
  if (mesa.value.modo === 'pvp') return 'Duelo 1 vs 1. Se requieren dos jugadores reales; no usa bots ni Localizador.'
  return eligiendo.value === 'crear'
    ? 'Las salas privadas solo admiten jugadores reales.'
    : 'Elige el aforo. La apuesta se confirma antes de jugar.'
})

function abrirMesa(destino: 'jugar' | 'crear') {
  mesa.value = { modo: 'mesa', cupo: 4, apuesta: 200 }
  escaneoSala.value = true
  montoApuesta.value = 200
  montoSala.value = 200
  eligiendo.value = destino
}

function fijarMesa(modo: MesaElegidaVista['modo'], cupo: MesaElegidaVista['cupo']) {
  mesa.value = { ...mesa.value, modo, cupo }
}

function confirmarMesa() {
  const destino = eligiendo.value
  const elegida = { ...mesa.value, apuesta: montoApuesta.value }
  if (destino === 'crear' && (!Number.isInteger(elegida.apuesta) || elegida.apuesta < 200 || elegida.apuesta > 2000 || progress.coins < elegida.apuesta)) {
    online.mostrarAviso('Elige una apuesta válida que puedas pagar con tu saldo actual.')
    return
  }
  eligiendo.value = null
  if (destino === 'crear') {
    copiado.value = false
    online.crearSala({ ...elegida, radar: escaneoSala.value })
    return
  }
  tituloBusqueda.value = 'BUSCANDO PARTIDA'
  detalleBusqueda.value = `Buscando ${etiquetaMesa(elegida)}…`
  boosterActivo.value = null
  online.buscar({ modo: elegida.modo, cupo: elegida.cupo })
}

function confirmarAumentoApuesta() {
  if (subiendoApuesta.value || aumentoSeleccionado.value > progress.coins) return
  subiendoApuesta.value = true
  online.aumentarApuesta(aumentoSeleccionado.value)
  window.setTimeout(() => { subiendoApuesta.value = false }, 1800)
}

function pasarAumento() {
  ocultarOfertaApuesta.value = true
}

function cancelarBusqueda() {
  entrada.value = false
  online.cancelar()
}

async function copiarCodigoSala() {
  if (!espera.value?.codigo) return
  await navigator.clipboard.writeText(espera.value.codigo)
  copiado.value = true
}

function unirse() {
  online.unirseSala(codigo.value)
}

watch(espera, (salaEspera) => {
  if (!salaEspera) return
  montoSala.value = salaEspera.apuesta || 200
  abriendoUnion.value = false
  codigo.value = ''
})

watch(() => sala.value?.serie?.ronda, () => {
  ocultarOfertaApuesta.value = false
  subiendoApuesta.value = false
})

watch(eventoRitmo, (nuevo, anterior) => {
  if (nuevo && nuevo !== anterior) tocarSello()
})
watch(() => equipoPropio.value === 1 ? sala.value?.serie?.combo.equipo1 : sala.value?.serie?.combo.equipo2, (nuevo, anterior = 0) => {
  if (typeof nuevo === 'number' && nuevo > anterior && nuevo > 0 && nuevo % 3 === 0) tocarSello()
})

function empezar(modo: 'sala' | 'bots') {
  online.empezarSala(modo)
}

function cambiarRellenoBots(event: Event) {
  const habilitado = (event.target as HTMLInputElement).checked
  online.configurarBotsSala(habilitado)
}

function actualizarApuestaSala(monto: number) {
  montoSala.value = monto
  online.fijarApuestaSala(monto)
}

function ponerApuesta(monto: 20 | 100) {
  online.fijarApuesta(monto)
}

function volverSala() {
  online.salirSala()
}

function cantar() {
  if (bloqueaCarton()) return
  online.cantar()
}

function jugarOtraVez() {
  const cupoGuardado = Number(sala.value?.cupo)
  const modoGuardado = sala.value?.modo === 'pvp' || sala.value?.modo === 'equipos' ? sala.value.modo : 'mesa'
  const previa: MesaElegidaVista = {
    modo: modoGuardado,
    cupo: modoGuardado === 'pvp' ? 2 : modoGuardado === 'equipos' ? 4 : cupoGuardado === 6 || cupoGuardado === 8 ? cupoGuardado : 4,
    apuesta: 200,
  }
  impactos.value = {}
  boosterActivo.value = null
  lanzando.value = false
  tituloBusqueda.value = 'BUSCANDO PARTIDA'
  detalleBusqueda.value = `Buscando ${etiquetaMesa(previa)}…`
  online.reiniciar()
  online.buscar(previa)
}

async function salir() {
  await online.abandonarPartida()
  online.desconectar()
  void router.push('/lobby')
}

async function volverAlLobbyOnline() {
  abriendoAbandono.value = false
  await online.volverAlLobby()
  await progress.hidratarDesdeApi().catch(() => {})
  if (router.currentRoute.value.path !== '/online') void router.push('/online')
}

async function confirmarAbandono() {
  await volverAlLobbyOnline()
}

function enviarTexto(texto: string) {
  online.enviarChat(texto)
}

function localizadorBloqueado(id: number): boolean {
  if (id !== 5) return false
  return !!sala.value?.radarProgramado || (sala.value?.localizadorEspera ?? 0) > 0
}

function tituloBooster(booster: { id: number; nombre: string }): string {
  if (booster.id !== 5) return booster.nombre
  if (sala.value?.radarProgramado) return 'El escaneo de la sala está activo'
  const esperaLocalizador = sala.value?.localizadorEspera ?? 0
  if (esperaLocalizador > 0) {
    const palabra = esperaLocalizador === 1 ? 'partida' : 'partidas'
    return `Te faltan ${esperaLocalizador} ${palabra}`
  }
  return 'Localizador'
}

function confirmarApuesta(monto: number) {
  online.confirmarApuesta(monto)
}

function pulsarBooster(id: number) {
  if (fase.value !== 'jugando' || lanzando.value || localizadorBloqueado(id)) return
  if (cantidad(id) <= 0) {
    online.mostrarAviso('No te quedan unidades de este booster.')
    return
  }
  if (id === 5) {
    boosterActivo.value = null
    disparar(5, usuarioId)
    return
  }
  if (esDefensa(id)) {
    boosterActivo.value = null
    disparar(id, usuarioId)
    return
  }
  boosterActivo.value = boosterActivo.value === id ? null : id
}

function cancelarSeleccion() {
  boosterActivo.value = null
}

function elegirObjetivo(id: string) {
  const boosterId = boosterActivo.value
  if (boosterId === null) return
  if (!puedeRecibir(id)) {
    if (esAtaque(boosterId) && id === usuarioId) {
      online.mostrarAviso('El hielo y el sabotaje solo se lanzan a los demás.')
    }
    return
  }
  boosterActivo.value = null
  disparar(boosterId, id)
}

function disparar(boosterId: number, objetivoId: string) {
  if (fase.value !== 'jugando' || cantidad(boosterId) <= 0 || lanzando.value) return
  lanzando.value = true
  online.lanzarBooster(boosterId, objetivoId)
  if (lanzandoTimer) clearTimeout(lanzandoTimer)
  lanzandoTimer = window.setTimeout(() => {
    lanzando.value = false
    void progress.hidratarDesdeApi().catch(() => {})
    lanzandoTimer = null
  }, 3000)
}

function centroDe(elemento: HTMLElement): { x: number; y: number } {
  const caja = elemento.getBoundingClientRect()
  return { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 }
}

const VUELO_MS = 1100

function origenDelVuelo(vuelo: VueloBoosterOnline): HTMLElement | null {
  if (vuelo.deId === usuarioId) {
    const boton = document.querySelector(`[data-booster="${vuelo.boosterId}"]`)
    if (boton instanceof HTMLElement) return boton
  }
  const retrato = document.querySelector(`[data-jugador="${vuelo.deId}"]`)
  if (retrato instanceof HTMLElement) return retrato
  const boton = document.querySelector(`[data-booster="${vuelo.boosterId}"]`)
  return boton instanceof HTMLElement ? boton : null
}

function animarVuelo(vuelo: VueloBoosterOnline) {
  const origen = origenDelVuelo(vuelo)
  const destino = document.querySelector(`[data-jugador="${vuelo.objetivoId}"]`)
  if (!(origen instanceof HTMLElement) || !(destino instanceof HTMLElement)) {
    marcarImpacto(vuelo)
    return
  }

  const desde = centroDe(origen)
  const hacia = centroDe(destino)
  const id = ++proyectilSeq
  proyectiles.value = [
    ...proyectiles.value,
    { id, boosterId: vuelo.boosterId, x: desde.x, y: desde.y },
  ]
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      proyectiles.value = proyectiles.value.map((bola) =>
        bola.id === id ? { ...bola, x: hacia.x, y: hacia.y } : bola,
      )
    })
  })
  window.setTimeout(() => {
    proyectiles.value = proyectiles.value.filter((bola) => bola.id !== id)
    marcarImpacto(vuelo)
  }, VUELO_MS)
}

function marcarImpacto(vuelo: VueloBoosterOnline) {
  const boosterId = vuelo.bloqueadoPorEscudo ? 4 : vuelo.boosterId
  impactos.value = {
    ...impactos.value,
    [vuelo.objetivoId]: { boosterId, hasta: Date.now() + 1600 },
  }
}

function alVuelo(evento: Event) {
  const vuelo = (evento as CustomEvent<VueloBoosterOnline>).detail
  if (!vuelo) return

  if (vuelo.deId === usuarioId) {
    if (typeof vuelo.stockRestante === 'number') {
      progress.actualizarStockBooster(vuelo.boosterId, vuelo.stockRestante)
    } else {
      void progress.hidratarDesdeApi().catch(() => {})
    }
    lanzando.value = false
    if (lanzandoTimer) {
      clearTimeout(lanzandoTimer)
      lanzandoTimer = null
    }
  }

  if (vuelo.bloqueadoPorEscudo) {
    const nombre = vuelo.objetivoNombre ?? 'El objetivo'
    if (vuelo.objetivoId === usuarioId) {
      online.mostrarAviso('Tu escudo bloqueó el ataque.')
    } else if (vuelo.deId === usuarioId) {
      online.mostrarAviso(`El escudo de ${nombre} bloqueó el ataque.`)
    }
  }

  animarVuelo(vuelo)
}

function alRechazo() {
  lanzando.value = false
  if (lanzandoTimer) {
    clearTimeout(lanzandoTimer)
    lanzandoTimer = null
  }
}

function alTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && boosterActivo.value !== null) {
    cancelarSeleccion()
  }
}

onMounted(() => {
  const salaInvitada = String(route.query.sala ?? '').trim().toUpperCase()
  if (/^[A-Z]{4}$/.test(salaInvitada)) {
    codigo.value = salaInvitada
    abriendoUnion.value = true
    online.unirseSala(salaInvitada)
  }
  window.addEventListener('df-booster-vuelo', alVuelo)
  window.addEventListener('df-booster-rechazo', alRechazo)
  window.addEventListener('keydown', alTecla)
  relojEfectos = setInterval(() => {
    ahora.value = Date.now()
  }, 400)
})

onUnmounted(() => {
  window.removeEventListener('df-booster-vuelo', alVuelo)
  window.removeEventListener('df-booster-rechazo', alRechazo)
  window.removeEventListener('keydown', alTecla)
  if (relojEfectos) clearInterval(relojEfectos)
  if (lanzandoTimer) clearTimeout(lanzandoTimer)
  if (contextoSfx) void contextoSfx.close().catch(() => undefined)
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

/* Durante una partida, el escenario ocupa el viewport completo. El overflow
   global de App.vue permite scroll por defecto y hacía que el documento se
   desplazara aunque el chat ya tuviera su propia lista desplazable. */
.online:has(.partida) {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

/* App.vue declara overflow-y:auto en html/body/#app. Anularlo solo mientras
   existe una partida evita que esos ancestros conserven la barra del documento. */
:global(html:has(.online .partida)),
:global(body:has(.online .partida)),
:global(#app:has(.online .partida)) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* El hub online también queda anclado al viewport. Si el contenedor no tiene
   altura definida, el chat (`.lleno`) crece con cada mensaje y termina
   expandiendo toda la página en lugar de desplazar solo su lista. */
@media (min-width: 701px) {
  .online:has(.hub) {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  :global(html:has(.online .hub)),
  :global(body:has(.online .hub)),
  :global(#app:has(.online .hub)) {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
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

.hub {
  display: flex;
  flex-direction: column;
  padding: clamp(18px, 3vh, 34px) clamp(16px, 3vw, 48px) 24px;
  gap: 12px;
}

.hub.room {
  width: 100%;
  height: 100dvh;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  padding: max(8px, env(safe-area-inset-top)) clamp(10px, 2vw, 28px) max(8px, env(safe-area-inset-bottom));
  gap: 8px;
}

.room-layout {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  align-items: stretch;
  gap: clamp(12px, 2vw, 28px);
  width: min(1180px, 100%);
  min-height: 0;
  flex: 1;
  margin: 0 auto;
}

.room-invite,
.room-side {
  min-height: 0;
  border: 1px solid var(--noche-borde);
  border-radius: 16px;
  background: radial-gradient(ellipse at 50% 8%, rgba(104, 74, 31, .18), transparent 62%), rgba(7, 12, 22, .88);
  box-shadow: inset 0 0 28px rgba(206, 167, 84, .035);
}

.room-invite {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(5px, 1.2vh, 12px);
  padding: 14px;
}
.room-invite h1 { margin: 0; text-align: center; color: #e8e0c8; font-size: clamp(1.1rem, 2.2vw, 1.8rem); }
.room-invite .sala-carga { width: clamp(68px, 13vh, 118px); height: clamp(68px, 13vh, 118px); }
.room-invite .sala-carga img { width: 62%; height: 62%; }
.room-invite .codigo { margin: 0; font-size: clamp(2rem, 6vh, 3.6rem); letter-spacing: .2em; }
.room-invite .estado-sala { font-size: .86rem; }
.room-invite .copiar-codigo { min-height: 40px; }

.room-side {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, .9fr);
  grid-template-rows: auto auto minmax(80px, 1fr);
  align-content: center;
  gap: 8px 12px;
  padding: clamp(10px, 1.5vw, 18px);
}
.room-side .lista-room { grid-row: 1 / 4; min-height: 0; overflow: hidden; }
.room-side .lista-room ul { min-height: 0; margin-block: 5px; overflow: auto; }
.room-side .lista-room li { min-height: 40px; padding: 3px 0; font-size: .82rem; }
.room-side .lista-room h2 { display: flex; justify-content: space-between; margin: 0; font-size: .92rem; }
.room-side .bot-option { width: auto; padding: 9px 10px; font-size: .78rem; }
.room-side .bot-option small { font-size: .7rem; }
.room-actions { display: grid; align-content: center; gap: 7px; }
.bots-toggle { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border: 1px solid rgba(219, 190, 119, .28); border-radius: 10px; background: rgba(7, 12, 22, .58); color: #e8dfc9; font-size: .75rem; line-height: 1.25; }
.bots-toggle input { accent-color: #d8bd7a; width: 17px; height: 17px; flex: 0 0 auto; }
.apuesta-selector-modal { display: grid; gap: 10px; padding: 14px; border: 1px solid rgba(201, 168, 103, .3); border-radius: 12px; background: radial-gradient(ellipse at 85% 0%, rgba(156, 109, 49, .14), transparent 55%), rgba(3, 7, 13, .56); color: #e8dfc9; font-size: .7rem; }
.apuesta-sala-selector { display: grid; gap: 8px; padding: 10px; border: 1px solid rgba(201, 168, 103, .24); border-radius: 10px; background: radial-gradient(ellipse at 90% 0%, rgba(156, 109, 49, .12), transparent 55%), rgba(3, 7, 13, .43); color: #e8dfc9; font-size: .65rem; }
.selector-titulo { display: flex; align-items: center; justify-content: space-between; color: #c9bb9c; letter-spacing: .12em; font-size: .63rem; }
.selector-titulo strong { color: #f0d99e; font: 700 1.15rem Georgia, serif; letter-spacing: 0; }
.selector-titulo small { font: inherit; }
.apuesta-fichas { display: flex; gap: 6px; flex-wrap: wrap; }
.apuesta-fichas button { flex: 1; min-width: 48px; padding: 7px 5px; border: 1px solid rgba(183, 155, 99, .22); border-radius: 7px; color: #c8bfae; background: rgba(17, 18, 22, .76); font: 700 .62rem Georgia, serif; cursor: pointer; transition: .2s ease; }
.apuesta-fichas button:hover, .apuesta-fichas button.activa { border-color: rgba(224, 188, 112, .72); color: #ffedc0; background: linear-gradient(145deg, rgba(132, 92, 40, .55), rgba(52, 40, 24, .74)); box-shadow: inset 0 0 12px rgba(219, 176, 92, .08), 0 0 12px rgba(219, 176, 92, .08); }
.slider-apuesta, .apuesta-rango input { width: 100%; accent-color: #c69b51; cursor: pointer; }
.apuesta-despues { padding: 12px; border: 1px solid rgba(201, 168, 103, .22); border-radius: 10px; color: #d5c39c; background: rgba(5, 9, 15, .64); text-align: center; font: .76rem Georgia, serif; }
.pantalla-apuesta { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: clamp(12px, 3vw, 34px); overflow: auto; color: #eee6d6; background: radial-gradient(ellipse at 50% 0%, rgba(100, 68, 39, .2), transparent 42%), radial-gradient(ellipse at 5% 80%, rgba(82, 31, 46, .19), transparent 45%), rgba(3, 5, 9, .97); }
.pantalla-apuesta::before, .pantalla-apuesta::after { position: fixed; inset: 16px; content: ''; border: 1px solid rgba(195, 158, 91, .14); pointer-events: none; }
.pantalla-apuesta::after { inset: 22px; border-color: rgba(195, 158, 91, .07); }
.apuesta-marco { width: min(1040px, 100%); max-height: calc(100dvh - 52px); overflow: auto; padding: clamp(18px, 3vw, 34px); border: 1px solid rgba(202, 165, 97, .32); border-radius: 18px; background: linear-gradient(145deg, rgba(19, 20, 24, .97), rgba(7, 9, 14, .98) 62%); box-shadow: 0 24px 90px rgba(0, 0, 0, .64), inset 0 0 55px rgba(150, 105, 43, .045); }
.apuesta-cabecera { display: grid; justify-items: center; gap: 6px; text-align: center; }
.apuesta-sello { color: #d4b36d; letter-spacing: .45em; font-size: .9rem; text-shadow: 0 0 18px rgba(224, 187, 109, .48); }
.apuesta-cabecera p { margin: 2px 0 0; color: #a99c82; letter-spacing: .2em; font-size: .62rem; }
.apuesta-cabecera h1 { margin: 3px 0; color: #f0e4c8; font: 500 clamp(1.8rem, 4vw, 2.75rem)/.96 Georgia, 'Times New Roman', serif; letter-spacing: .035em; text-shadow: 0 3px 24px rgba(212, 179, 109, .18); }
.apuesta-cabecera h1 em { color: #d9b878; font-weight: 500; }
.apuesta-runa { color: #9c9588; font: italic .79rem Georgia, serif; }
.apuesta-contenido { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr); gap: clamp(17px, 3vw, 32px); margin-top: 23px; }
.apuesta-control { display: grid; align-content: start; gap: 15px; padding: clamp(14px, 2.4vw, 23px); border: 1px solid rgba(190, 152, 83, .19); border-radius: 14px; background: radial-gradient(ellipse at 50% 0%, rgba(128, 90, 41, .11), transparent 56%), rgba(4, 7, 12, .66); }
.apuesta-monto { display: grid; justify-items: center; gap: 3px; }
.apuesta-monto > span:first-child { color: #a99f8d; text-transform: uppercase; letter-spacing: .18em; font-size: .63rem; }
.apuesta-monto strong { color: #f5dfaa; font: 600 clamp(2rem, 5vw, 3.2rem)/1 Georgia, serif; text-shadow: 0 0 24px rgba(210, 170, 94, .18); }
.apuesta-monto strong small { color: #d0ac63; font: 1.7rem Georgia, serif; }
.apuesta-saldo { color: #918c81; font-size: .67rem; }
.apuesta-rango { display: grid; gap: 8px; color: #b6aa93; font-size: .58rem; letter-spacing: .13em; }
.apuesta-rango > span:first-child { display: flex; justify-content: space-between; }
.apuesta-rango b { color: #d4b46e; font-weight: 600; }
.apuesta-rango input { height: 5px; }
.rango-extremos { display: flex; justify-content: space-between; color: #817c73; letter-spacing: .02em; }
.apuesta-resumen { display: grid; grid-template-columns: 32px 1fr auto; align-items: center; gap: 8px; padding: 10px; border: 1px solid rgba(210, 175, 104, .16); border-radius: 9px; background: rgba(86, 62, 30, .18); color: #b6aa93; font-size: .69rem; }
.resumen-icono { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid rgba(211, 174, 98, .32); border-radius: 50%; color: #e1c47f; font-size: 1rem; }
.apuesta-resumen strong { color: #f0d594; font: 700 .85rem Georgia, serif; white-space: nowrap; }
.error-apuesta { margin: -7px 0 0; color: #e09b9a; font-size: .72rem; }
.confirmar-apuesta { display: flex; justify-content: center; align-items: center; gap: 12px; min-height: 46px; border: 1px solid rgba(232, 198, 125, .58); border-radius: 9px; color: #f7e9c9; background: linear-gradient(135deg, #806132, #48341e 65%, #36291b); box-shadow: inset 0 1px rgba(255, 239, 201, .11), 0 7px 20px rgba(0, 0, 0, .3); font: 700 .7rem Georgia, serif; letter-spacing: .14em; cursor: pointer; transition: .2s ease; }
.confirmar-apuesta:hover:not(:disabled) { transform: translateY(-1px); border-color: #f0d28d; box-shadow: 0 0 22px rgba(208, 170, 95, .18); }
.confirmar-apuesta b { color: #e2c27b; }
.confirmar-apuesta:disabled { opacity: .4; cursor: not-allowed; }
.apuesta-rivales { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.apuesta-rivales h2 { display: flex; align-items: center; gap: 8px; margin: 0; color: #c9b995; font: 600 .7rem Georgia, serif; letter-spacing: .18em; }
.apuesta-rivales h2 span { display: grid; place-items: center; width: 21px; height: 21px; border: 1px solid rgba(201, 168, 103, .25); border-radius: 50%; color: #e3c47e; font-size: .62rem; }
.apuesta-rivales > ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.apuesta-rivales > ul li { display: grid; grid-template-columns: 30px 1fr auto 20px; align-items: center; gap: 8px; min-height: 39px; padding: 5px 8px; border: 1px solid rgba(166, 151, 125, .13); border-radius: 8px; background: rgba(20, 21, 25, .62); }
.apuesta-rivales > ul li.listo { border-color: rgba(160, 177, 117, .3); background: rgba(62, 73, 43, .17); }
.rival-sello { display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid rgba(194, 152, 83, .28); border-radius: 50%; color: #ddc58e; background: rgba(102, 72, 36, .22); font: .75rem Georgia, serif; }
.rival-nombre { overflow: hidden; color: #e3dac8; text-overflow: ellipsis; white-space: nowrap; font-size: .74rem; }
.rival-estado { color: #928b7e; font-size: .49rem; letter-spacing: .09em; }
.listo .rival-estado { color: #b1c18a; }
.rival-check { color: #a39a87; text-align: center; }
.listo .rival-check { color: #c5d79a; }
.chat-apuesta { flex: 1; min-height: 140px; min-width: 0; overflow: hidden; }
.chat-apuesta :deep(.chat-sala.compacto) { width: 100%; height: 100%; min-height: 0; max-height: none; flex: 1; }
.apuesta-pie { display: flex; justify-content: space-between; gap: 10px; margin-top: 13px; padding-top: 11px; border-top: 1px solid rgba(199, 162, 94, .13); color: #847e72; font-size: .59rem; }
@media (max-width: 760px) { .pantalla-apuesta { padding: 8px; align-items: start; } .pantalla-apuesta::before { inset: 5px; } .pantalla-apuesta::after { inset: 10px; } .apuesta-marco { max-height: calc(100dvh - 18px); padding: 16px 13px; } .apuesta-contenido { grid-template-columns: 1fr; gap: 14px; margin-top: 15px; } .apuesta-control { gap: 12px; } .apuesta-rivales { gap: 7px; } .apuesta-rivales > ul { grid-template-columns: repeat(2, minmax(0, 1fr)); } .apuesta-rivales > ul li { grid-template-columns: 27px 1fr 18px; } .rival-estado { display: none; } .chat-apuesta { min-height: 130px; } .apuesta-pie { flex-direction: column; text-align: center; } }
@media (max-height: 690px) and (min-width: 761px) { .apuesta-marco { padding-top: 15px; padding-bottom: 15px; } .apuesta-contenido { margin-top: 12px; } .apuesta-cabecera h1 { font-size: 1.9rem; } .apuesta-control { gap: 9px; padding: 14px; } .chat-apuesta { min-height: 110px; } }
.room-actions .accion { min-width: 0; width: 100%; padding: 10px 8px; font-size: .74rem; }
.room-actions .accion:disabled { opacity: .45; cursor: default; }
.room-actions .hint { margin: 0; font-size: .72rem; line-height: 1.35; }
.room-side :deep(.chat-sala.compacto) { min-height: 0; height: 100%; max-height: none; flex: 1; }
.room-side :deep(.chat-sala form) { padding-top: 4px; }
.room-side :deep(.chat-sala input) { min-height: 32px; }

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
  overflow: hidden;
}

/* El chat ocupa su celda de la cuadrícula sin forzar el alto de la fila:
   la única zona desplazable es su lista de mensajes (`.chat-sala ul`). */
.cuerpo :deep(.chat-sala.lleno) {
  height: 100%;
  min-height: 0;
  max-height: none;
  overflow: hidden;
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

.lista-room li.vacio { opacity: .62; }
.slot-vacio { width: 36px; text-align: center; color: #f0d78c; font-size: 1.3rem; }
.sala-carga { position: relative; width: 112px; height: 112px; display: grid; place-items: center; margin: 2px auto; }
.sala-carga-aro { position: absolute; inset: 2px; border: 1px solid rgba(191, 157, 83, .58); border-top-color: #efd58b; border-radius: 50%; animation: sello-gira 8s linear infinite; }
.sala-carga img { width: 68px; height: 68px; object-fit: contain; filter: drop-shadow(0 0 14px rgba(191, 157, 83, .36)); animation: dragon-respira 2.8s ease-in-out infinite; }
.estado-sala { margin: 0; color: #d4c59e; font-size: .9rem; }
.bot-option {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  width: min(440px, 100%);
  box-sizing: border-box;
  padding: 13px 16px;
  text-align: left;
  color: #e8e0c8;
  background: rgba(10, 18, 34, .78);
  border: 1px solid var(--noche-borde);
  border-radius: 12px;
}
.bot-option input { accent-color: #bf9d53; margin-top: 3px; }
.bot-option span { display: grid; gap: 4px; }
.bot-option small { color: #b7c6dc; line-height: 1.35; }
.abandonar { min-height: 42px; padding: 8px 12px; border-color: rgba(179, 72, 72, .6); color: #f0c6c6; }

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
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 100dvh;
  height: 100dvh;
  box-sizing: border-box;
  padding: 12px 16px 16px;
  gap: 10px;
  position: relative;
  overflow: hidden;
}
.efecto-pantalla { position: absolute; inset: 0; z-index: 8; pointer-events: none; overflow: hidden; }
.efecto-sabotaje { background: linear-gradient(90deg, rgba(90, 6, 12, .18), transparent 16% 84%, rgba(90, 6, 12, .2)); animation: pantalla-pulso-rojo 1.8s ease-in-out infinite; }
.efecto-sabotaje::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent 0 5px, rgba(242, 57, 63, .12) 6px 7px, transparent 8px 12px); mix-blend-mode: screen; animation: pantalla-scan 1.4s linear infinite; }
.efecto-sabotaje::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 43%, rgba(255, 49, 58, .2) 48%, transparent 53%); animation: glitch-barrido 3.5s steps(1) infinite; }
.efecto-sabotaje span { position: absolute; inset: 0; background: radial-gradient(ellipse, transparent 50%, rgba(142, 10, 18, .32)); }
.efecto-escarcha { background: radial-gradient(ellipse, transparent 57%, rgba(142, 208, 245, .16)); box-shadow: inset 0 0 46px rgba(147, 213, 255, .46); }
.efecto-escarcha::before { content: ''; position: absolute; inset: 0; border: 16px solid rgba(198, 237, 255, .16); filter: blur(9px); box-shadow: inset 0 0 35px rgba(198, 237, 255, .32); }
.efecto-escarcha i { position: absolute; top: -8%; width: 4px; height: 4px; border-radius: 50%; background: #effaff; opacity: .78; box-shadow: 0 0 9px 2px rgba(199, 237, 255, .75); animation: copo-caida var(--duracion-copo) linear infinite; animation-delay: var(--retardo-copo); }
@keyframes pantalla-pulso-rojo { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
@keyframes pantalla-scan { to { transform: translateY(18px); } }
@keyframes glitch-barrido { 0%,82%,100% { opacity: 0; transform: translateY(-60%); } 84% { opacity: .8; } 88% { opacity: .4; transform: translateY(55%); } 90% { opacity: 0; } }
@keyframes copo-caida { to { transform: translate3d(18px, 110dvh, 0) rotate(180deg); } }

.recursos-partida {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: clamp(12px, 2vw, 24px);
  min-height: 28px;
  padding-right: 4px;
  color: #f0d78c;
  font-size: .92rem;
}

.fila-jugadores {
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
}

.serie {
  display: flex;
  justify-content: center;
  gap: 22px;
  margin: 2px 0 8px;
  color: #f0d78c;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
}

.marcador-equipos {
  width: min(100%, 900px);
  justify-self: center;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(8px, 2vw, 20px);
  padding: 9px clamp(8px, 2vw, 20px);
  border: 1px solid rgba(194, 153, 78, .58);
  border-radius: 14px;
  background: linear-gradient(110deg, rgba(62, 16, 18, .92), rgba(11, 7, 12, .96) 47%, rgba(23, 13, 29, .94));
  box-shadow: inset 0 0 24px rgba(218, 166, 67, .08), 0 7px 24px rgba(0, 0, 0, .32);
}
.partida:has(.marcador-equipos) { grid-template-rows: auto auto auto minmax(0, 1fr) auto; }
.partida:has(.marcador-equipos) .aviso-ronda { display: none; }
.lado-serie { min-width: 0; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 3px 8px; }
.lado-serie strong { overflow: hidden; color: #f4dfb4; font: 700 clamp(.68rem, 1.8vw, .95rem) Georgia, serif; letter-spacing: .06em; text-overflow: ellipsis; white-space: nowrap; text-transform: uppercase; }
.lado-carmesi strong { color: #f0b7a5; }
.lado-umbria strong { color: #d4c3f1; }
.puntos-equipo { grid-column: 2; grid-row: 1 / 3; color: #ffdc82; font-size: clamp(1.2rem, 3vw, 1.7rem); font-weight: 900; text-shadow: 0 0 14px rgba(255, 204, 93, .34); }
.rondas-equipo { display: flex; gap: 5px; }
.casilla-ronda { width: clamp(26px, 4vw, 38px); height: 21px; display: grid; place-items: center; border: 1px solid rgba(220, 215, 207, .3); border-radius: 5px; background: rgba(70, 68, 68, .58); color: #b7b1a9; font-size: .57rem; font-weight: 800; }
.lado-umbria .rondas-equipo { justify-content: flex-end; }
.ronda-activa { background: #77716b; border-color: #d8cdb8; color: #fff4dd; box-shadow: 0 0 12px rgba(220, 214, 197, .25); animation: pulso-ronda .95s ease-in-out infinite alternate; }
.ronda-ganada { background: linear-gradient(150deg, #f3d477, #a97722); border-color: #ffe697; color: #281607; box-shadow: 0 0 12px rgba(255, 207, 83, .4); }
.ronda-perdida { background: #100f12; border-color: #090809; color: #766f6b; }
.ronda-empate { background: #403d3a; border-color: #a29a8a; color: #e6dece; }
.ronda-pendiente { opacity: .45; }
.lado-serie small { color: #c6b78f; font-size: .53rem; letter-spacing: .13em; }
.centro-serie { min-width: 104px; display: grid; justify-items: center; gap: 2px; color: #d7c59e; font-size: .57rem; letter-spacing: .1em; text-align: center; }
.centro-serie b { color: #f2d17d; font: 800 1rem Georgia, serif; }
@keyframes pulso-ronda { to { filter: brightness(1.35); } }
.evento-oleada, .aviso-casi { position: absolute; left: 50%; z-index: 9; margin: 0; transform: translateX(-50%); border: 1px solid rgba(236, 194, 99, .68); border-radius: 999px; padding: 7px 15px; background: rgba(33, 17, 13, .94); color: #ffe19a; font-size: .78rem; text-align: center; box-shadow: 0 0 18px rgba(239, 168, 58, .22); }
.evento-oleada { top: 118px; animation: oleada-latido .8s ease-in-out infinite alternate; }
.aviso-casi { top: 158px; border-color: rgba(255, 220, 133, .4); background: rgba(34, 23, 13, .9); }
@keyframes oleada-latido { to { filter: brightness(1.35); box-shadow: 0 0 28px rgba(239, 168, 58, .52); } }
.intermedio-velo { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; background: rgba(5, 3, 6, .72); backdrop-filter: blur(5px); }
.intermedio-panel { width: min(92vw, 520px); display: grid; justify-items: center; gap: 12px; padding: clamp(20px, 4vw, 32px); border: 1px solid #d4ac5e; border-radius: 18px; background: radial-gradient(ellipse at top, #482017, #170b0d 66%, #0b070b); color: #f1e3c7; text-align: center; box-shadow: 0 18px 58px #000c, 0 0 36px rgba(226, 170, 64, .22); }
.intermedio-panel h2 { margin: 0; color: #ffdc85; font: 700 clamp(1.2rem, 4vw, 1.8rem) Georgia, serif; letter-spacing: .1em; }
.intermedio-panel p { margin: 0; max-width: 48ch; color: #d8c7aa; line-height: 1.5; }
.intermedio-sello { color: #dfbd73; font-size: .65rem; letter-spacing: .22em; }
.pozo-intermedio { color: #ffe5a0; }
.intermedio-panel small { color: #bcae91; }
.intermedio-panel .apuesta-fichas { justify-content: center; }
.intermedio-panel .acciones-modal { width: 100%; }
.reglas-equipos-modal { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
.reglas-equipos-modal span { padding: 7px 10px; border: 1px solid rgba(211, 171, 83, .34); border-radius: 999px; background: rgba(32, 15, 18, .7); color: #dfc88f; font-size: .7rem; }
.puesto-equipo { color: #d6bc79; font-size: .58rem; letter-spacing: .08em; }

.aviso-ronda {
  margin: 0 0 8px;
  text-align: center;
  color: #ffe9a8;
}

.apuesta-activa {
  margin: 0 0 8px;
  text-align: center;
  color: #f0d78c;
}

.apuesta-sala {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.opciones-apuesta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
.ficha.aliado .foto { border-color: #db9d53; box-shadow: 0 0 14px rgba(235, 161, 62, .22); }

.ficha.objetivo {
  cursor: pointer;
}

.ficha.fuera-de-tiro {
  opacity: 0.45;
  cursor: default;
}

.ficha.objetivo .foto {
  box-shadow: 0 0 0 3px #7ad7ff, 0 0 18px #7ad7ff;
  animation: objetivo-pulsa 1.15s ease-in-out infinite;
}

.ficha.hielo .foto {
  box-shadow: 0 0 0 3px #9ad7ff;
  filter: saturate(0.4);
  overflow: visible;
}
.ficha.hielo .foto::after { content: ''; position: absolute; z-index: 2; inset: 1px; pointer-events: none; border: 2px solid rgba(224, 248, 255, .92); border-radius: 7px; box-shadow: inset 0 0 12px rgba(180, 231, 255, .85), 0 0 10px rgba(180, 231, 255, .65); transform: rotate(45deg) scale(.8); animation: cubo-hielo-pulsa 2s ease-in-out infinite; }
.ficha.hielo .foto img { border-radius: 50%; }

.ficha.sabotaje .foto {
  box-shadow: 0 0 0 3px #e23b3b;
}

.ficha.suerte .foto,
.ficha.escudo .foto {
  box-shadow: 0 0 0 3px #f0d78c;
}
.ficha.escudo .foto { overflow: visible; }
.escudo-insignia { position: absolute; inset: 18%; z-index: 3; width: 64%; height: 64%; object-fit: contain; filter: drop-shadow(0 0 5px #d8f6ff); animation: escudo-glyph 1.5s ease-in-out infinite; }
.ficha.escudo .foto::after { content: ''; position: absolute; inset: -5px; border: 1px solid rgba(177, 232, 255, .85); border-radius: 9px; transform: rotate(45deg); box-shadow: 0 0 12px rgba(121, 212, 255, .65); pointer-events: none; }

.foto {
  position: relative;
}

.capa-efecto {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
}

.capa-freeze {
  background:
    radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.75), transparent 30%),
    linear-gradient(160deg, rgba(154, 215, 255, 0.42), rgba(55, 120, 200, 0.18));
  box-shadow: inset 0 0 18px rgba(154, 215, 255, 0.95);
  animation: escarcha-brilla 1.8s ease-in-out infinite;
}

.capa-freeze::before,
.capa-freeze::after {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  border: 1px solid rgba(220, 245, 255, 0.85);
  transform: rotate(35deg) scaleX(0.42);
}

.capa-freeze::after {
  transform: rotate(-35deg) scaleX(0.42);
}

.capa-sabotage {
  background: repeating-linear-gradient(
    0deg,
    rgba(226, 59, 59, 0.42) 0 2px,
    transparent 2px 5px
  );
  box-shadow: inset 0 0 16px rgba(226, 59, 59, 0.85);
  mix-blend-mode: screen;
  animation: interferencia 0.18s steps(2) infinite;
}

.capa-luck {
  background: radial-gradient(
    circle at 50% 38%,
    rgba(255, 236, 160, 0.62),
    rgba(240, 200, 90, 0.16) 58%,
    transparent 76%
  );
  box-shadow: inset 0 0 18px rgba(240, 215, 140, 0.95);
  animation: oro-brilla 1.6s ease-in-out infinite;
}

.capa-shield {
  border: 3px solid rgba(140, 220, 255, 0.9);
  background: radial-gradient(
    circle,
    transparent 52%,
    rgba(120, 200, 255, 0.2) 68%,
    rgba(120, 200, 255, 0.38)
  );
  box-shadow: inset 0 0 12px rgba(120, 200, 255, 0.75), 0 0 14px rgba(120, 200, 255, 0.55);
  animation: escudo-pulsa 1.4s ease-in-out infinite;
}

.impacto {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
}

.impacto img {
  width: 62%;
  height: 62%;
  object-fit: contain;
}

.impacto-1 {
  animation: impacto-hielo 0.95s ease-out forwards;
}

.impacto-2 {
  animation: impacto-sabotaje 0.75s steps(2) 2;
}

.impacto-3 {
  animation: impacto-suerte 0.95s ease-out forwards;
}

.impacto-4 {
  animation: impacto-escudo 0.95s ease-out forwards;
}

.ficha.impacto-freeze .foto {
  animation: foto-hielo 0.95s ease-out;
}

.ficha.impacto-sabotage .foto {
  animation: foto-sabotaje 0.75s steps(2) 2;
}

.ficha.impacto-luck .foto {
  animation: foto-suerte 0.95s ease-out;
}

.ficha.impacto-shield .foto {
  animation: foto-escudo 0.95s ease-out;
}

.efectos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
  margin-top: 2px;
}

.efecto-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px 1px 2px;
  border-radius: 999px;
  font-size: 0.62rem;
  line-height: 1.2;
  background: rgba(6, 14, 28, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.efecto-chip img {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.efecto-chip b {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.chip-freeze {
  border-color: #9ad7ff;
  color: #d6f0ff;
  box-shadow: 0 0 8px rgba(154, 215, 255, 0.5);
}

.chip-sabotage {
  border-color: #e23b3b;
  color: #ffd5d5;
  box-shadow: 0 0 8px rgba(226, 59, 59, 0.5);
}

.chip-luck {
  border-color: #f0d78c;
  color: #fff0c0;
  box-shadow: 0 0 8px rgba(240, 215, 140, 0.55);
}

.chip-shield {
  border-color: #8cdcff;
  color: #dff5ff;
  box-shadow: 0 0 8px rgba(140, 220, 255, 0.55);
}

@keyframes objetivo-pulsa {
  0%, 100% { box-shadow: 0 0 0 3px #7ad7ff, 0 0 12px #7ad7ff; }
  50% { box-shadow: 0 0 0 5px rgba(122, 215, 255, 0.55), 0 0 24px #7ad7ff; }
}

@keyframes escarcha-brilla {
  0%, 100% { opacity: 0.75; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.25); }
}

@keyframes interferencia {
  0% { opacity: 0.55; transform: translateX(-1px); }
  50% { opacity: 0.9; transform: translateX(1px); }
  100% { opacity: 0.6; transform: translateX(-1px); }
}

@keyframes oro-brilla {
  0%, 100% { opacity: 0.7; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.3); }
}

@keyframes escudo-pulsa {
  0%, 100% { transform: scale(0.94); opacity: 0.75; }
  50% { transform: scale(1); opacity: 1; }
}

@keyframes impacto-hielo {
  0% { opacity: 0; transform: scale(0.4) rotate(-12deg); filter: blur(2px); }
  35% { opacity: 1; transform: scale(1.15) rotate(0deg); filter: blur(0); }
  100% { opacity: 0; transform: scale(1.6) rotate(10deg); }
}

@keyframes impacto-sabotaje {
  0% { opacity: 0.9; transform: translateX(-4px) scale(0.9); }
  50% { opacity: 0.35; transform: translateX(4px) scale(1.05); }
  100% { opacity: 0.9; transform: translateX(-4px) scale(0.9); }
}

@keyframes impacto-suerte {
  0% { opacity: 0; transform: scale(0.5) rotate(-20deg); }
  40% { opacity: 1; transform: scale(1.2) rotate(8deg); }
  100% { opacity: 0; transform: scale(1.7) rotate(20deg); }
}

@keyframes impacto-escudo {
  0% { opacity: 0; transform: scale(0.4); }
  35% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.8); }
}

@keyframes foto-hielo {
  0%, 100% { filter: saturate(1); transform: translateX(0); }
  25% { filter: saturate(0.2) brightness(1.4); transform: translateX(-2px); }
  60% { filter: saturate(0.4) brightness(1.1); transform: translateX(2px); }
}

@keyframes foto-sabotaje {
  0%, 100% { transform: translateX(0); filter: hue-rotate(0deg); }
  50% { transform: translateX(3px); filter: hue-rotate(-25deg) saturate(1.6); }
}

@keyframes foto-suerte {
  0%, 100% { filter: brightness(1); transform: scale(1); }
  45% { filter: brightness(1.35) sepia(0.25); transform: scale(1.04); }
}

@keyframes foto-escudo {
  0%, 100% { filter: brightness(1); transform: scale(1); }
  45% { filter: brightness(1.2) saturate(1.2); transform: scale(1.05); }
}
@keyframes cubo-hielo-pulsa { 0%,100% { opacity: .7; transform: rotate(45deg) scale(.76); } 50% { opacity: 1; transform: rotate(45deg) scale(.9); } }
@keyframes escudo-glyph { 0%,100% { transform: scale(.86); opacity: .84; } 50% { transform: scale(1.06); opacity: 1; } }
@keyframes suerte-borde { 0%,100% { filter: drop-shadow(0 0 2px rgba(90, 240, 110, .35)); } 50% { filter: drop-shadow(0 0 8px rgba(90, 240, 110, .8)); } }
@keyframes trebol-flota { 0%,100% { transform: translateY(2px) rotate(-8deg); } 50% { transform: translateY(-6px) rotate(8deg); } }

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

.progreso-sello { width: min(100%, 150px); display: grid; justify-items: center; gap: 3px; margin-top: 5px; }
.progreso-sello > span { width: 100%; height: 5px; overflow: hidden; border: 1px solid rgba(211, 171, 83, .45); border-radius: 999px; background: rgba(12, 8, 10, .92); }
.progreso-sello i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8c2629, #f2cf70); box-shadow: 0 0 8px rgba(245, 195, 78, .55); transition: width .35s ease; }
.progreso-sello small { color: #bea77a; font-size: .48rem; letter-spacing: .12em; }
.bola { transition: color .2s, box-shadow .2s; }
.bola:not(.vacia) { animation: bola-llega .42s cubic-bezier(.18,.8,.32,1.18); }
.bola.oleada:not(.vacia) { border-color: #f6d77d; box-shadow: 0 0 28px rgba(246, 190, 64, .56), inset 0 0 18px rgba(255, 226, 142, .18); }
@keyframes bola-llega { 0% { transform: scale(.72) rotate(-12deg); filter: brightness(1.8); } 70% { transform: scale(1.08) rotate(3deg); } 100% { transform: scale(1); filter: brightness(1); } }

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
  outline: 2px solid #8dff9c;
  box-shadow: 0 0 0 4px rgba(70, 205, 93, .18), 0 0 26px rgba(93, 255, 109, .55), inset 0 0 20px rgba(45, 158, 63, .18);
  animation: suerte-borde 1.8s ease-in-out infinite;
}
.trebol-oraculo { display: block; color: #9dff9c; font-size: 2rem; line-height: .8; text-shadow: 0 0 8px #48e760, 0 0 22px rgba(70, 232, 92, .9); animation: trebol-flota 1.8s ease-in-out infinite; }

.carton-wrap.escudo :deep(.board) {
  outline: 2px solid #8cdcff;
  box-shadow: 0 0 18px rgba(140, 220, 255, 0.45);
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

.carton-rival {
  margin-bottom: 12px;
}

.rival-titulo {
  margin: 0 0 8px;
  color: #f0d78c;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
}

.rival-progreso { display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; margin: 0 0 8px; color: #d9d1bc; font-size: .72rem; }
.rival-progreso strong { color: #e5c773; }
.rival-progreso-barra { grid-column: 1 / -1; height: 6px; overflow: hidden; border-radius: 99px; background: rgba(255,255,255,.1); }
.rival-progreso-barra i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #94743a, #e5c773); transition: width .25s ease; }
.rival-progreso small { grid-column: 1 / -1; color: #aaa49a; }
.rival-peligro { margin: 0 0 8px; color: #ff9e9e; font-size: .72rem; }

.rival-letras,
.rival-board {
  display: grid;
  gap: 4px;
}

.rival-letras {
  margin-bottom: 4px;
  color: #d5e6f2;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.rival-cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 6px;
  border: 1px solid rgba(169, 142, 194, 0.28);
  background: rgba(26, 22, 36, 0.92);
  color: #e1dbe8;
  font-size: 0.72rem;
  font-weight: 700;
}

.rival-cell.llamada {
  box-shadow: inset 0 0 0 1px rgba(183, 161, 210, 0.4);
}

.rival-cell.marcada,
.rival-cell.libre {
  background: linear-gradient(180deg, #3a2f10, #243018);
  color: #ffe9a8;
  border-color: #e8c86a;
}

.lista :deep(.chat-sala) {
  flex: 0 1 230px;
  width: 100%;
  min-height: 0;
  height: clamp(150px, 22vh, 230px);
  max-height: 230px;
  background: transparent;
  border: 0;
  padding: 4px;
}
.lista {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.lista :deep(.chat-sala.compacto) {
  flex: 0 0 clamp(150px, 22vh, 230px);
  min-height: 0;
  height: clamp(150px, 22vh, 230px);
  overflow: hidden;
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
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 1px solid #3d5f93;
  background: rgba(10, 22, 44, 0.85);
  color: #f0d78c;
  position: relative;
  cursor: pointer;
}

.booster img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.booster span {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 0.8rem;
}

.booster.bloqueado {
  opacity: 0.45;
  cursor: not-allowed;
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

.pista {
  position: fixed;
  left: 50%;
  bottom: 118px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(92vw, 640px);
  padding: 10px 16px;
  background: rgba(8, 18, 34, 0.94);
  border: 1px solid #7ad7ff;
  border-radius: 12px;
  color: #dff4ff;
  font-size: 0.9rem;
  z-index: 10050;
  box-shadow: 0 0 22px rgba(122, 215, 255, 0.35);
}

.pista strong {
  color: #f0d78c;
}

.cancelar-objetivo {
  flex: 0 0 auto;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #a05050;
  background: #4a1f1f;
  color: #ffd7d7;
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}

.cancelar-objetivo:hover {
  filter: brightness(1.15);
}

.proyectil {
  position: fixed;
  z-index: 10055;
  width: 74px;
  height: 74px;
  margin-left: -37px;
  margin-top: -37px;
  pointer-events: none;
  border-radius: 50%;
  transition: left 1.1s cubic-bezier(0.2, 0.72, 0.2, 1), top 1.1s cubic-bezier(0.2, 0.72, 0.2, 1);
}

.proyectil-cuerpo {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(8, 12, 24, 0.94) 0 46%, transparent 70%);
  animation: proyectil-arco 1.1s ease-in-out;
}

.proyectil-cuerpo::before,
.proyectil-cuerpo::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.proyectil-cuerpo::before {
  inset: -14px;
  border: 2px solid transparent;
  animation: anillo-vuelo 1.1s ease-out;
}

.proyectil-cuerpo::after {
  inset: 8px;
  filter: blur(8px);
  opacity: 0.85;
}

.proyectil img {
  position: relative;
  z-index: 1;
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.proyectil.tipo-1 .proyectil-cuerpo::before { border-color: #9ad7ff; }
.proyectil.tipo-1 .proyectil-cuerpo::after { background: #9ad7ff; }
.proyectil.tipo-1 img { filter: drop-shadow(0 0 12px #9ad7ff); }

.proyectil.tipo-2 .proyectil-cuerpo::before { border-color: #e23b3b; }
.proyectil.tipo-2 .proyectil-cuerpo::after { background: #e23b3b; }
.proyectil.tipo-2 img { filter: drop-shadow(0 0 12px #e23b3b); }

.proyectil.tipo-3 .proyectil-cuerpo::before { border-color: #f0d78c; }
.proyectil.tipo-3 .proyectil-cuerpo::after { background: #7dff8a; }
.proyectil.tipo-3 img { filter: drop-shadow(0 0 12px #f0d78c); }

.proyectil.tipo-4 .proyectil-cuerpo::before { border-color: #8cdcff; }
.proyectil.tipo-4 .proyectil-cuerpo::after { background: #8cdcff; }
.proyectil.tipo-4 img { filter: drop-shadow(0 0 12px #8cdcff); }

@keyframes proyectil-arco {
  0% { transform: translateY(0) scale(0.72) rotate(-18deg); }
  45% { transform: translateY(-78px) scale(1.18) rotate(8deg); }
  100% { transform: translateY(0) scale(1) rotate(0deg); }
}

@keyframes anillo-vuelo {
  0% { transform: scale(0.55); opacity: 0.2; }
  40% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.35); opacity: 0.35; }
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

.opciones-mesa {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 14px 0 8px;
}
.opciones-mesa button {
  min-height: 42px;
  border: 1px solid rgba(142, 176, 232, .45);
  border-radius: 10px;
  background: rgba(8, 14, 26, .8);
  color: #e8e0c8;
  letter-spacing: .04em;
  cursor: pointer;
}
.opciones-mesa button.ancho { grid-column: 1 / -1; }
.opciones-mesa button.on {
  border-color: #f0d78c;
  color: #f0d78c;
  box-shadow: inset 0 0 12px rgba(240, 215, 140, .16);
}
.mesa-modal .hint { margin: 0 0 14px; }

.escaneo-sala {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 8px;
  color: #f0d78c;
  letter-spacing: .04em;
  cursor: pointer;
}

.escaneo-sala input {
  width: 18px;
  height: 18px;
  accent-color: #c9a227;
}

.radar-velo {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: rgba(4, 8, 16, 0.38);
  pointer-events: none;
}

.radar-disco {
  position: relative;
  width: min(58vh, 440px);
  aspect-ratio: 1;
}

.radar-disco img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(80, 255, 140, 0.28));
}

.radar-barrido {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0 70%, rgba(90, 255, 140, 0.55) 86%, transparent 100%);
  mix-blend-mode: screen;
  animation: radar-giro 2s linear infinite;
}

.radar-leyenda {
  margin: 0;
  padding: 8px 16px;
  border: 1px solid rgba(240, 215, 140, 0.45);
  border-radius: 999px;
  background: rgba(8, 12, 20, 0.72);
  color: #f0d78c;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.95rem;
}

@keyframes radar-giro {
  to { transform: rotate(360deg); }
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
  .hub.room { height: 100dvh; min-height: 0; padding: max(6px, env(safe-area-inset-top)) 8px max(6px, env(safe-area-inset-bottom)); gap: 4px; }
  .room .top { min-height: 30px; }
  .room-layout { grid-template-columns: minmax(110px, .78fr) minmax(0, 1.22fr); gap: 7px; }
  .room-invite { gap: 5px; padding: 8px 6px; }
  .room-invite h1 { font-size: clamp(.9rem, 3.2vw, 1.25rem); }
  .room-invite .sobrelinea { font-size: .55rem; letter-spacing: .16em; }
  .room-invite .sala-carga { width: clamp(42px, 10vh, 68px); height: clamp(42px, 10vh, 68px); margin: 0; }
  .room-invite .codigo { font-size: clamp(1.35rem, 7vw, 2rem); letter-spacing: .14em; }
  .room-invite .estado-sala { font-size: .68rem; }
  .room-invite .copiar-codigo { min-height: 32px; padding: 7px; font-size: .66rem; }
  .room-side { grid-template-columns: minmax(0, 1fr) minmax(0, .9fr); grid-template-rows: auto auto minmax(54px, 1fr); gap: 5px; padding: 7px; }
  .room-side .lista-room li { min-height: 30px; font-size: .68rem; }
  .room-side .mini-foto { width: 25px; height: 25px; }
  .room-side .lista-room h2 { font-size: .72rem; }
  .room-side .bot-option { gap: 5px; padding: 6px; font-size: .63rem; }
  .room-side .bot-option small { font-size: .58rem; }
  .room-actions .accion { font-size: .62rem; padding: 7px 5px; }
  .room-side :deep(.chat-sala) { font-size: .65rem; }
  .room-side :deep(.chat-sala ul) { margin: 2px 0; }
  .room-side :deep(.chat-sala input) { min-height: 26px; font-size: .7rem; }
  .top { font-size: 0.84rem; }
  .cuerpo { flex: 1 0 auto; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .centro { grid-row: 1; padding: 22px 16px; gap: 10px; }
  .logo { width: min(220px, 58vw); }
  .subtitulo-online { max-width: 28ch; line-height: 1.45; }
  .panel { min-height: 220px; }
  .chat-sala { min-height: 220px; }
  /* En pantallas estrechas el hub se apila y la página sí se desplaza, pero
     el chat mantiene su propia altura para que no crezca con los mensajes. */
  .cuerpo :deep(.chat-sala.lleno) { height: 260px; min-height: 220px; max-height: 260px; }
  .ranking { max-height: 260px; }
  .codigo { font-size: clamp(2rem, 12vw, 3.2rem); letter-spacing: 0.22em; }
  .partida { min-height: 0; height: 100dvh; grid-template-rows: auto auto minmax(0, 1fr) auto; padding: max(8px, env(safe-area-inset-top)) 10px max(8px, env(safe-area-inset-bottom)); gap: 6px; }
  .partida:has(.marcador-equipos) { height: 100dvh; min-height: 0; overflow: hidden; grid-template-rows: auto auto auto minmax(0, 1fr) auto; padding: max(5px, env(safe-area-inset-top)) 8px max(7px, env(safe-area-inset-bottom)); gap: 4px; }
  .online:has(.marcador-equipos) { --board-h-reserve: 430px; --board-w: min(440px, calc(100vw - 108px), calc(100dvh - var(--board-h-reserve))); }
  .marcador-equipos { gap: 5px; padding: 5px; border-radius: 10px; }
  .lado-serie { gap: 2px 4px; }
  .lado-serie strong { font-size: .58rem; letter-spacing: .02em; }
  .lado-serie small { font-size: .43rem; }
  .centro-serie { min-width: 58px; font-size: .45rem; letter-spacing: .03em; }
  .centro-serie b { font-size: .8rem; }
  .casilla-ronda { width: 24px; height: 17px; font-size: .48rem; }
  .evento-oleada { top: 153px; max-width: 90vw; font-size: .65rem; }
  .aviso-casi { top: 184px; font-size: .62rem; }
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
  .partida:has(.marcador-equipos) .mesa { display: grid; grid-template-columns: 64px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) 88px; gap: 5px; min-height: 0; overflow: hidden; }
  .partida:has(.marcador-equipos) .oraculo { grid-column: 1; grid-row: 1; min-width: 0; padding: 4px 0; }
  .partida:has(.marcador-equipos) .bola { width: 56px; height: 56px; font-size: 1.45rem; }
  .partida:has(.marcador-equipos) .recientes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; }
  .partida:has(.marcador-equipos) .mini { width: 24px; height: 22px; font-size: .64rem; }
  .partida:has(.marcador-equipos) .carton-wrap { grid-column: 2; grid-row: 1; width: min(100%, var(--board-w)); justify-self: center; align-self: center; }
  .partida:has(.marcador-equipos) .lista { grid-column: 1 / -1; grid-row: 2; min-height: 0; overflow: hidden; }
  .partida:has(.marcador-equipos) .lista :deep(.chat-sala) { height: 84px; min-height: 0; max-height: 84px; padding: 0 5px; }
  .partida:has(.marcador-equipos) .lista :deep(.chat-sala ul) { min-height: 0; max-height: none; overflow-y: auto; }
  .partida:has(.marcador-equipos) .lista :deep(.chat-sala form) { margin-top: 2px; }
  .partida:has(.marcador-equipos) .ficha { gap: 2px; }
  .partida:has(.marcador-equipos) .fmeta { font-size: .55rem; }
  .partida:has(.marcador-equipos) .barra { gap: 4px; }
  .partida:has(.marcador-equipos) .boosters { gap: 5px; }
  .partida:has(.marcador-equipos) .booster { width: 42px; height: 42px; }
  .partida:has(.marcador-equipos) .booster img { width: 28px; height: 28px; }
  .partida:has(.marcador-equipos) .bingo { min-height: 42px; padding: 7px 13px; }
  .partida:has(.marcador-equipos) .metodo-esquina { display: none; }
  .intermedio-panel { max-height: calc(100dvh - 24px); overflow-y: auto; }
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

.panel-voz {
  position: fixed;
  z-index: 24;
  top: max(58px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  width: min(272px, calc(100vw - 24px));
  border: 1px solid rgba(208, 174, 103, .45);
  border-radius: 11px;
  background: linear-gradient(145deg, rgba(25, 19, 25, .97), rgba(9, 10, 15, .97));
  box-shadow: 0 10px 32px rgba(0, 0, 0, .55), inset 0 0 18px rgba(177, 135, 62, .08);
  color: #e6dcc8;
  font-family: Georgia, 'Times New Roman', serif;
}
.voz-resumen { display: flex; width: 100%; align-items: center; gap: 9px; padding: 9px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.voz-icono { display: grid; width: 29px; height: 29px; place-items: center; border: 1px solid rgba(213, 178, 103, .42); border-radius: 50%; color: #e4c982; font-size: 1.1rem; }
.voz-titulo { display: flex; flex: 1; align-items: baseline; justify-content: space-between; gap: 8px; color: #e8d39e; font-size: .73rem; letter-spacing: .12em; }
.voz-titulo small { color: #aaa195; font-size: .65rem; letter-spacing: .04em; text-transform: none; }
.voz-led { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; background: #69645b; box-shadow: 0 0 0 3px rgba(255,255,255,.04); }
.voz-led.voz-conectada, .voz-led.hablando { background: #75c99a; box-shadow: 0 0 9px rgba(117, 201, 154, .8); }
.voz-led.voz-conectando, .voz-led.voz-reconectando { background: #d8ad59; animation: voz-pulso 1s ease-in-out infinite alternate; }
.voz-led.voz-error { background: #d46e68; }
.voz-detalle { padding: 0 11px 11px; }
.voz-detalle > p { margin: 0 0 8px; color: #b9afa0; font: .69rem/1.4 Georgia, serif; }
.voz-accion, .voz-salir { min-height: 31px; padding: 6px 9px; border: 1px solid rgba(213, 178, 103, .42); border-radius: 6px; background: rgba(104, 75, 35, .24); color: #ead49e; cursor: pointer; font: 700 .62rem Georgia, serif; letter-spacing: .06em; }
.voz-accion:disabled { cursor: wait; opacity: .52; }
.voz-botones { display: flex; gap: 6px; }
.voz-botones .voz-accion { flex: 1; }
.voz-habilitar-audio { width: 100%; margin-top: 7px; }
.voz-salir { border-color: rgba(173, 104, 89, .42); background: rgba(80, 37, 35, .25); color: #ddb5a7; }
.voz-participantes { display: grid; gap: 5px; margin: 8px 0 0; padding: 0; list-style: none; }
.voz-participantes li { display: flex; align-items: center; gap: 7px; color: #aaa195; font: .68rem Georgia, serif; }
.voz-participantes li.hablando { color: #e3d39c; }
.voz-participantes .voz-led { width: 6px; height: 6px; flex-basis: 6px; }
.voz-detalle .voz-espera { margin: 8px 0 0; color: #8e877e; font-size: .65rem; }
.voz-detalle .voz-error { margin: 8px 0 0; color: #e89b8e; }
.voz-audio-host { position: fixed; width: 0; height: 0; overflow: hidden; pointer-events: none; }
@keyframes voz-pulso { to { opacity: .45; box-shadow: 0 0 3px rgba(216, 173, 89, .35); } }

@media (max-width: 700px) {
  .panel-voz { top: max(48px, env(safe-area-inset-top)); right: max(7px, env(safe-area-inset-right)); width: min(245px, calc(100vw - 14px)); }
  .voz-resumen { padding: 7px 9px; }
  .voz-icono { width: 26px; height: 26px; }
}
</style>
