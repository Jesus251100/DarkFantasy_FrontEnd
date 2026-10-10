<template>
  <div class="inventory">
    <div class="top-bar">
      <button type="button" class="back-btn" @click="router.push('/lobby')" aria-label="Volver"><span class="back-ico" aria-hidden="true">‹</span></button>

      <h1>Inventario de Boosters</h1>

      <button type="button" class="shop-btn" @click="router.push('/store')">
        🛒 Tienda
      </button>
    </div>

    <div class="separator"></div>

    <div class="cards-container">
      <article v-for="booster in boosters" :key="booster.id" class="card">
        <img :src="booster.icon" :alt="booster.name" class="icon" />
        <h2>{{ booster.name }}</h2>
        <p>{{ booster.description }}</p>
        <span class="quantity">Cantidad: {{ progress.boosterCount(booster.id) }}</span>
      </article>
    </div>
  </div>
</template>

<script lang="ts" setup>
import '../assets/css/inventory.css'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress'
import { CatalogoBoosters } from '../domain/boosters/CatalogoBoosters'

import freeze from '../assets/img/freeze.png'
import sabotage from '../assets/img/sabotage 2.png'
import luck from '../assets/img/goodluck 2.png'
import shield from '../assets/img/shield 1.png'

const ICONOS: Record<string, string> = {
  freeze,
  sabotage,
  luck,
  shield,
}

const router = useRouter()
const progress = useProgressStore()

const boosters = CatalogoBoosters.listar().map((b) => ({
  id: b.id,
  name: b.nombre,
  icon: ICONOS[b.icono] ?? freeze,
  description: b.descripcion,
}))
</script>
