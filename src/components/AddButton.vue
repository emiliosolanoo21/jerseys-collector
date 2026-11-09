<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { hideChrome } from '@/lib/ui'
import { newGarment } from '@/lib/sheets'
import type { GarmentStatus } from '@/types'

/** Acción principal de la pantalla: abajo a la derecha, al alcance del pulgar. */
defineProps<{ status: GarmentStatus; label: string }>()
</script>

<template>
  <button v-show="!hideChrome" class="primary fab" @click="newGarment(status)">
    <Plus :size="20" aria-hidden="true" /> {{ label }}
  </button>
</template>

<style scoped>
.fab {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right));
  bottom: calc(82px + var(--nav-lift) + env(safe-area-inset-bottom));
  z-index: 9;
  min-height: 48px;
  padding: 10px 18px;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.28);
}
@media (min-width: 900px) { .fab { bottom: 28px; right: 28px; } }
@media (orientation: landscape) and (max-height: 540px) {
  .fab { bottom: calc(14px + env(safe-area-inset-bottom)); }
}
</style>
