<template>
  <router-view />
  <ReloadBlockedOverlay />
  <RouteLoadingOverlay :show="cargandoRuta" :progress="progresoRuta" :datos="datosCarga" />
</template>

<script setup lang="ts">
import ReloadBlockedOverlay from './components/ReloadBlockedOverlay.vue'
import RouteLoadingOverlay from './components/RouteLoadingOverlay.vue'
import { useRouteTransition } from './composables/useRouteTransition'

const { cargandoRuta, progresoRuta, datosCarga } = useRouteTransition()
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  /* Red de seguridad: si una vista se pasa por poco, el contenido sigue siendo
     alcanzable en lugar de quedar recortado. Las vistas se compactan para que
     no aparezca barra de scroll. */
  overflow-y: auto;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
}

/* El ancho declarado incluye padding y borde: evita desbordes horizontales */
*,
*::before,
*::after {
  box-sizing: border-box;
}

button,
input {
  font-family: inherit;
}
</style>
