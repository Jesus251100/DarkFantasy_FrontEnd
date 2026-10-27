<template>
  <aside class="chat-sala" :class="{ compacto, lleno }">
    <h2>Chat de jugadores</h2>
    <ul ref="lista">
      <li v-for="m in mensajes" :key="m.id">
        <strong>{{ m.nombre }}:</strong> {{ m.texto }}
      </li>
      <li v-if="mensajes.length === 0" class="vacio">Todavía no hay mensajes.</li>
    </ul>
    <form @submit.prevent="mandar">
      <input v-model="borrador" maxlength="80" placeholder="Escribe un mensaje" />
      <button type="submit">ENVIAR</button>
    </form>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

interface Mensaje {
  id: string
  nombre: string
  texto: string
}

const props = defineProps<{
  mensajes: Mensaje[]
  compacto?: boolean
  lleno?: boolean
}>()

const emit = defineEmits<{
  enviar: [texto: string]
}>()

const borrador = ref('')
const lista = ref<HTMLUListElement | null>(null)

watch(
  () => props.mensajes.length,
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
</script>

<style scoped>
.chat-sala {
  background: rgba(8, 16, 32, 0.72);
  border: 1px solid rgba(120, 160, 220, 0.35);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-height: 260px;
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
  background: transparent;
  border: 0;
  padding: 8px 0 0;
  min-height: 140px;
}

h2 {
  margin: 0;
  text-align: center;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f0d78c;
  font-size: 0.95rem;
}

ul {
  list-style: none;
  margin: 10px 0;
  padding: 0;
  overflow: auto;
  flex: 1;
  min-height: 72px;
}

li {
  display: block;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.92rem;
  color: #e7eef8;
  overflow-wrap: anywhere;
}

.vacio {
  color: #b7c6dc;
  text-align: center;
}

form {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid #35548a;
  background: rgba(6, 12, 24, 0.8);
  color: #f4f7ff;
  padding: 10px 12px;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 10px 12px;
  background: linear-gradient(180deg, #2a63d6, #17398a);
  color: white;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
}
</style>
