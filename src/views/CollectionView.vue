<script setup lang="ts">
import { computed } from 'vue'
import { useGarments } from '@/stores/garments'
import BrandMark from '@/components/BrandMark.vue'
import GarmentList from '@/components/GarmentList.vue'
import AddButton from '@/components/AddButton.vue'

const store = useGarments()

const summary = computed(() => {
  const total = store.owned.length
  const jerseys = store.owned.filter((g) => g.garment_type === 'camisola').length
  const limited = store.owned.filter((g) => g.limited_edition).length
  const parts = [`${total} ${total === 1 ? 'prenda' : 'prendas'}`, `${jerseys} ${jerseys === 1 ? 'camisola' : 'camisolas'}`]
  if (limited) parts.push(`${limited} ${limited === 1 ? 'edición limitada' : 'ediciones limitadas'}`)
  return parts.join(' · ')
})
</script>

<template>
  <main class="page">
    <header class="brandbar">
      <BrandMark :size="44" class="phone-only" />
      <div class="grow">
        <p class="wordmark name">Vestuario</p>
        <h1>Mi colección</h1>
      </div>
    </header>
    <p v-if="store.owned.length" class="small muted">{{ summary }}</p>

    <GarmentList
      :items="store.owned"
      list-key="coleccion"
      empty-title="Tu vestuario está vacío"
      empty-text="Agrega tu primera camisola con fotos de frente y espalda. Toca «Agregar» para empezar."
    />
    <AddButton status="owned" label="Agregar" />
  </main>
</template>

<style scoped>
.brandbar { display: flex; align-items: center; gap: 12px; }
.name { font-size: 0.78rem; }
@media (min-width: 900px) { .phone-only { display: none; } }
</style>
