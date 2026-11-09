<script setup lang="ts">
import { useGarments } from '@/stores/garments'
import GarmentList from '@/components/GarmentList.vue'

const store = useGarments()
</script>

<template>
  <main class="page">
    <header class="page-header"><h1>Favoritos</h1></header>
    <GarmentList
      :items="store.favorites"
      list-key="favoritos"
      empty-title="Aún no tienes favoritas"
      empty-text="Toca la estrella de cualquier prenda y aparecerá aquí."
    />
  </main>
</template>
