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
  /* Tokens de tamaño: se ajustan según el alto disponible para que las 10
     filas quepan en pantalla. Las consume AchievementRow (herencia). */
  --fila-pad-y: 10px;
  --fila-pad-x: 14px;
  --img-w: 72px;
  --img-h: 46px;
  --h3-size: 1rem;
  --estado-size: 18px;
  --recomp-size: 17px;
  --recomp-gap: 16px;
  --head-pad-y: 10px;
  --head-pad-x: 14px;
  --head-size: 0.92rem;

  width: 100%;
  max-width: 900px;

  background: rgba(5, 25, 70, 0.55);

  backdrop-filter: blur(8px);

  border: 3px solid #00c3ff;

  border-radius: 20px;

  /* Sin overflow hidden: las filas no pueden quedar recortadas */
  overflow: hidden;
}

.header {
  display: grid;

  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1.5fr);

  align-items: center;

  background: #00b8ff;

  padding: var(--head-pad-y) var(--head-pad-x);

  font-weight: bold;
  font-size: var(--head-size);
}

/* Pantallas de poca altura: se compacta para que las 10 filas quepan */
@media (max-height: 940px) {
  .tabla {
    --fila-pad-y: 8px;
    --fila-pad-x: 12px;
    --img-w: 64px;
    --img-h: 40px;
    --h3-size: 0.95rem;
    --estado-size: 16px;
    --recomp-size: 15px;
    --recomp-gap: 12px;
    --head-pad-y: 8px;
    --head-pad-x: 12px;
  }
}

/* Pantallas muy bajas (portátiles de 768px): compactación adicional */
@media (max-height: 830px) {
  .tabla {
    --fila-pad-y: 6px;
    --fila-pad-x: 10px;
    --img-w: 56px;
    --img-h: 36px;
    --h3-size: 0.9rem;
    --estado-size: 14px;
    --recomp-size: 14px;
    --recomp-gap: 10px;
    --head-pad-y: 6px;
    --head-pad-x: 10px;
    --head-size: 0.85rem;
  }
}

/* Móvil: se oculta la columna "Progreso" (solo dice 1/1 o 0/1) */
@media (max-width: 640px) {
  .tabla {
    --fila-pad-y: 4px;
    --fila-pad-x: 8px;
    --img-w: 38px;
    --img-h: 26px;
    --h3-size: 0.78rem;
    --estado-size: 12px;
    --recomp-size: 11px;
    --recomp-gap: 5px;
    --head-pad-y: 6px;
    --head-pad-x: 10px;
    --head-size: 0.8rem;

    font-size: 0.82rem;
    border-width: 2px;
  }

  .header {
    grid-template-columns: minmax(0, 2.4fr) minmax(0, 1.4fr) minmax(0, 1.2fr);
  }

  .header span:nth-child(2) {
    display: none;
  }
}

.vacio {
  margin: 0;
  padding: 24px;
  color: rgba(230, 240, 255, 0.85);
}
</style>
