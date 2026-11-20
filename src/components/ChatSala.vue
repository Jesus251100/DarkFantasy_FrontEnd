<template>
  <aside class="chat-sala" :class="{ compacto, lleno }">
    <header class="chat-cabecera">
      <span class="chat-orbe">✧</span>
      <div><h2>Voces de la mesa</h2><small><i></i> CANAL COMPARTIDO</small></div>
      <b class="chat-total">{{ mensajes.length }}</b>
    </header>
    <ul ref="lista">
      <li v-for="m in mensajes" :key="m.id" class="chat-mensaje" :class="{ propio: m.usuarioId === usuarioId }">
        <span class="chat-avatar">{{ (m.nombre || '?').slice(0, 1).toUpperCase() }}</span>
        <span class="chat-burbuja"><span class="chat-autor"><strong>{{ m.usuarioId === usuarioId ? 'Tú' : m.nombre }}</strong><time>{{ hora(m.creadoEn) }}</time></span><span class="chat-texto">{{ m.texto }}</span></span>
      </li>
      <li v-if="mensajes.length === 0" class="vacio"><span>✧</span><span>El silencio rodea la mesa.<br />Abre la conversación.</span></li>
    </ul>
    <form @submit.prevent="mandar">
      <input v-model="borrador" maxlength="80" placeholder="Susurra a los jugadores…" aria-label="Escribe un mensaje" />
      <button type="submit" :disabled="!borrador.trim()" aria-label="Enviar mensaje"><span>➤</span></button>
    </form>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

interface Mensaje {
  id: string
  usuarioId: string
  nombre: string
  texto: string
  creadoEn: string
}

const props = defineProps<{
  mensajes: Mensaje[]
  usuarioId: string
  compacto?: boolean
  lleno?: boolean
}>()

const emit = defineEmits<{
  enviar: [texto: string]
}>()

const borrador = ref('')
const lista = ref<HTMLUListElement | null>(null)

watch(
  () => props.mensajes[props.mensajes.length - 1]?.id,
  async () => {
    await nextTick()
    if (lista.value) lista.value.scrollTop = lista.value.scrollHeight
  },
)

function mandar() {
  const texto = borrador.value.trim()
  if (!texto) return
  emit('enviar', texto)
  borrador.value = ''
}

function hora(valor: string): string {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '' : fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.chat-sala {
  --chat-gold: #d5b36b;
  background: linear-gradient(150deg, rgba(14, 19, 31, .96), rgba(5, 9, 17, .94));
  border: 1px solid rgba(192, 157, 91, .25);
  border-radius: 15px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-height: 300px;
  text-align: left;
  box-sizing: border-box;
}

.chat-sala.lleno {
  height: 100%;
  max-height: none;
}

.chat-sala.compacto {
  max-height: none;
  flex: 1;
  background: rgba(3, 6, 12, .32);
  border: 1px solid rgba(192, 157, 91, .18);
  padding: 10px;
  min-height: 150px;
  border-radius: 12px;
}

.chat-cabecera {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 2px 2px 9px;
  border-bottom: 1px solid rgba(213, 179, 107, .16);
}

.chat-orbe {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border: 1px solid rgba(213, 179, 107, .38);
  border-radius: 50%;
  color: #efcf84;
  background: radial-gradient(circle, rgba(213, 179, 107, .18), transparent 72%);
}

.chat-cabecera h2 {
  margin: 0;
  text-align: left;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #ead8af;
  font: 700 .7rem/1.2 Georgia, serif;
}

.chat-cabecera small {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  color: #9e988b;
  font-size: .5rem;
  letter-spacing: .12em;
}

.chat-cabecera small i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #a9bf83;
  box-shadow: 0 0 7px rgba(169, 191, 131, .8);
}

.chat-total {
  display: grid;
  place-items: center;
  min-width: 21px;
  height: 21px;
  margin-left: auto;
  border: 1px solid rgba(213, 179, 107, .2);
  border-radius: 20px;
  color: #c9b889;
  font-size: .6rem;
}

ul {
  list-style: none;
  margin: 8px 0;
  padding: 0;
  overflow: auto;
  flex: 1;
  min-height: 55px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  scrollbar-color: rgba(213, 179, 107, .35) transparent;
}

.chat-mensaje {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  color: #e7e0d3;
  font-size: .78rem;
  overflow-wrap: anywhere;
}

.chat-mensaje.propio { flex-direction: row-reverse; }
.chat-avatar {
  flex: 0 0 23px;
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  border: 1px solid rgba(167, 101, 107, .38);
  border-radius: 50%;
  color: #e6c5b4;
  background: rgba(92, 48, 57, .5);
  font: 700 .65rem Georgia, serif;
}
.chat-mensaje.propio .chat-avatar { border-color: rgba(213, 179, 107, .4); color: #f2dfa8; background: rgba(105, 79, 35, .42); }
.chat-burbuja { max-width: 86%; display: grid; gap: 3px; padding: 6px 8px; border: 1px solid rgba(176, 163, 140, .12); border-radius: 9px 9px 9px 2px; background: rgba(26, 30, 39, .82); }
.chat-mensaje.propio .chat-burbuja { border-color: rgba(213, 179, 107, .18); border-radius: 9px 9px 2px 9px; background: rgba(74, 58, 31, .38); }
.chat-autor { display: flex; align-items: center; gap: 8px; color: #d1b979; font-size: .62rem; }
.chat-autor time { color: #868176; font-size: .55rem; }
.chat-texto { line-height: 1.35; white-space: pre-wrap; }
.vacio {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #968f82;
  text-align: center;
  font-size: .68rem;
}
.vacio span:first-child { color: var(--chat-gold); font-size: 1rem; }
.vacio span:last-child { line-height: 1.5; }

form {
  display: flex;
  gap: 7px;
  padding-top: 7px;
  border-top: 1px solid rgba(213, 179, 107, .12);
}
input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(170, 148, 103, .23);
  background: rgba(4, 7, 12, .72);
  color: #eee5d5;
  padding: 8px 10px;
  font-size: .72rem;
  outline: none;
}
input:focus { border-color: rgba(213, 179, 107, .58); box-shadow: 0 0 0 2px rgba(213, 179, 107, .08); }

button {
  border: 0;
  display: grid;
  place-items: center;
  width: 35px;
  flex: 0 0 35px;
  border-radius: 8px;
  background: linear-gradient(150deg, #926b36, #57401f);
  color: #fff2d3;
  font-weight: 800;
  cursor: pointer;
}
button:disabled { opacity: .42; cursor: default; }
</style>
