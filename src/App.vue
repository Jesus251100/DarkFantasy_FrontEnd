<template>
  <router-view />
  <ReloadBlockedOverlay />
</template>

<script setup lang="ts">
import ReloadBlockedOverlay from './components/ReloadBlockedOverlay.vue'
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: Georgia, 'Palatino Linotype', 'Times New Roman', serif;
}
button,
input {
  font-family: inherit;
}
</style>
