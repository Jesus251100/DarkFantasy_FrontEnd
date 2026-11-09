<template>
  <div class="tabla">
    <div class="lista-logros">
      <AchievementRow v-for="item in achievements" :key="item.id" :achievement="item" />
      <p v-if="!achievements.length" class="vacio">Cargando logros...</p>
    </div>
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
    progreso: `${logro.progresoActual}/${logro.objetivo ?? 1}`,
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
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(0, 195, 255, .48);
  border-radius: 13px;
  background: rgba(5, 15, 32, .74);
}

.lista-logros {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(5, minmax(0, 1fr));
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 7px;
  box-sizing: border-box;
}

.lista-logros :deep(.fila) {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1px 5px;
  min-width: 0;
  min-height: 0;
  padding: 4px 6px;
  border: 1px solid rgba(108, 177, 215, .26);
  border-radius: 9px;
  background: rgba(5, 18, 38, .78);
  box-sizing: border-box;
}

.lista-logros :deep(.logro) { grid-column: 1 / 3; grid-row: 1; gap: 5px; }
.lista-logros :deep(.logro > div) { min-width: 0; overflow: hidden; }
.lista-logros :deep(.logro img) { width: 26px; height: 26px; margin: 0; }
.lista-logros :deep(.fila h3) { color: #f2e4c2; font-size: clamp(.62rem, .85vw, .82rem); line-height: 1.12; }
.lista-logros :deep(.progreso) { grid-column: 2; grid-row: 2; align-self: center; color: #b8c8d7; font-size: .62rem; }
.lista-logros :deep(.recompensa) { grid-column: 3; grid-row: 1; justify-content: flex-end; gap: 3px; color: #e9d49e; font-size: .6rem; white-space: nowrap; }
.lista-logros :deep(.estado) { grid-column: 3; grid-row: 2; align-self: center; color: #aeb9c6; font-size: .56rem; text-align: right; white-space: nowrap; }
.lista-logros :deep(.estado.activo) { color: #8dff9c; }
.lista-logros :deep(.fila.bloqueado) { opacity: .86; }
.vacio { grid-column: 1 / -1; align-self: center; margin: 0; text-align: center; }

@media (max-width: 760px) {
  .lista-logros { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(9, minmax(0, 1fr)); gap: 4px; padding: 5px; }
  .lista-logros :deep(.fila) { grid-template-columns: 24px minmax(0, 1fr) auto; gap: 1px 4px; padding: 3px 4px; }
  .lista-logros :deep(.logro img) { width: 21px; height: 21px; }
  .lista-logros :deep(.fila h3) { font-size: clamp(.52rem, 2.5vw, .72rem); }
  .lista-logros :deep(.progreso), .lista-logros :deep(.estado), .lista-logros :deep(.recompensa) { font-size: .52rem; }
  .lista-logros :deep(.recompensa) { gap: 2px; }
}

@media (max-width: 380px) {
  .lista-logros { gap: 3px; padding: 3px; }
  .lista-logros :deep(.fila) { grid-template-columns: 19px minmax(0, 1fr) auto; gap: 1px 3px; padding: 2px 3px; }
  .lista-logros :deep(.logro img) { width: 17px; height: 17px; }
  .lista-logros :deep(.fila h3) { font-size: .49rem; }
  .lista-logros :deep(.progreso), .lista-logros :deep(.estado), .lista-logros :deep(.recompensa) { font-size: .43rem; }
}

@media (max-height: 520px) {
  .lista-logros { gap: 3px; padding: 3px; }
  .lista-logros :deep(.fila) { padding: 2px 3px; }
  .lista-logros :deep(.logro img) { width: 17px; height: 17px; }
  .lista-logros :deep(.fila h3), .lista-logros :deep(.recompensa), .lista-logros :deep(.estado), .lista-logros :deep(.progreso) { font-size: .47rem; }
}
</style>
