<template>
  <div class="tabla">
    <div class="header">
      <span>Logro</span>

      <span>Progreso</span>

      <span>Recompensa</span>

      <span>Estado</span>
    </div>

    <AchievementRow v-for="item in achievements" :key="item.id" :achievement="item" />

    <p v-if="!achievements.length" class="vacio">Cargando logros...</p>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import AchievementRow from './AchievementRow.vue'
import { ListarLogros } from '../application/ListarLogros'
import { ApiCampaniaCliente } from '../infrastructure/ApiCampaniaCliente'
import { useProgressStore } from '../stores/progress'

interface FilaLogro {
  id: string
  nombre: string
  imagen: string
  progreso: string
  oro: number
  diamantes: number
  estado: string
  desbloqueado: boolean
}

const progress = useProgressStore()
const listar = new ListarLogros(new ApiCampaniaCliente())

const achievements = ref<FilaLogro[]>([])

onMounted(async () => {
  await progress.asegurarHidratado()
  const logros = await listar.ejecutar([...progress.completed])
  achievements.value = logros.map((logro) => ({
    id: logro.codigo,
    nombre: logro.nombre,
    imagen: logro.imagen,
    progreso: logro.desbloqueado ? '1/1' : '0/1',
    oro: logro.monedas,
    diamantes: logro.diamantes,
    estado: logro.desbloqueado ? 'Completado' : 'Bloqueado',
    desbloqueado: logro.desbloqueado,
  }))
})
</script>

<style scoped>
.tabla {
  width: 100%;
  max-width: 900px;

  background: rgba(5, 25, 70, 0.55);

  backdrop-filter: blur(8px);

  border: 3px solid #00c3ff;

  border-radius: 20px;

  overflow: hidden;
}

.header {
  display: grid;

  grid-template-columns: 2fr 2fr 1.5fr 1.5fr;

  background: #00b8ff;

  padding: 15px;

  font-weight: bold;
}

@media (max-width: 640px) {
  .tabla {
    font-size: 0.82rem;
  }

  .header {
    padding: 10px;
  }
}

.vacio {
  margin: 0;
  padding: 24px;
  color: rgba(230, 240, 255, 0.85);
}
</style>
