<script setup lang="ts">
import { useGarments } from '@/stores/garments'
import GarmentList from '@/components/GarmentList.vue'
import AddButton from '@/components/AddButton.vue'

const store = useGarments()
</script>

<template>
  <main class="page">
    <header class="page-header"><h1>Lista de deseos</h1></header>
    <GarmentList
      :items="store.wishes"
      list-key="deseos"
      empty-title="¿Cuál te falta?"
      empty-text="Anota las camisolas que quieres conseguir. Cuando tengas una, tócala y elige «Ya la tengo»."
    />
    <AddButton status="wish" label="Agregar deseo" />
  </main>
</template>
