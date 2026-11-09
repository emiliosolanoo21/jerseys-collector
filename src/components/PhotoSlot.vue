<script setup lang="ts">
import { ref } from 'vue'
import { Camera, X } from 'lucide-vue-next'
import GarmentPhoto from './GarmentPhoto.vue'

/** Casilla del formulario para una foto (frente o espalda): cámara o galería. */
defineProps<{ label: string; path: string | null; preview: string | null; busy?: boolean }>()
const emit = defineEmits<{ pick: [file: File]; clear: [] }>()

const input = ref<HTMLInputElement | null>(null)

function onChange(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (file) emit('pick', file)
  // Permite elegir de nuevo el mismo archivo
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div class="slot">
    <input ref="input" type="file" accept="image/*" class="sr-only" tabindex="-1" aria-hidden="true" @change="onChange" />
    <button type="button" class="tile" :class="{ filled: preview || path }" :disabled="busy" :aria-label="`${preview || path ? 'Cambiar' : 'Agregar'} foto: ${label}`" @click="input?.click()">
      <img v-if="preview" :src="preview" alt="" />
      <GarmentPhoto v-else-if="path" :path="path" alt="" />
      <span v-else class="empty-tile">
        <Camera :size="26" aria-hidden="true" />
        <span class="small">{{ busy ? 'Procesando…' : 'Agregar foto' }}</span>
      </span>
    </button>
    <span class="tag">{{ label }}</span>
    <button v-if="preview || path" type="button" class="clear" :aria-label="`Quitar foto: ${label}`" @click="emit('clear')"><X :size="18" /></button>
  </div>
</template>

<style scoped>
.slot { position: relative; min-width: 0; }
.tile { width: 100%; aspect-ratio: 4 / 5; padding: 0; overflow: hidden; border-radius: 12px; border: 1.5px dashed var(--border); background: var(--surface-2); color: var(--text-2); }
.tile.filled { border-style: solid; }
.tile img { display: block; width: 100%; height: 100%; object-fit: cover; }
.empty-tile { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.tag { position: absolute; left: 8px; bottom: 8px; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: var(--surface); color: var(--text); pointer-events: none; }
.clear { position: absolute; top: 2px; right: 2px; width: 44px; min-height: 44px; padding: 0; background: transparent; border: 0; color: #fff; filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.8)); }
@media (hover: hover) { .clear:hover:not(:disabled) { background: transparent; } }
</style>
