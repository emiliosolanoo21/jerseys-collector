<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImageOff, Shirt } from 'lucide-vue-next'
import { photoUrl, type PhotoVariant } from '@/lib/photos'

/** Foto de una prenda, o un marcador si todavía no tiene (o no se pudo cargar). */
const props = withDefaults(defineProps<{ path: string | null; alt: string; variant?: PhotoVariant; fit?: 'cover' | 'contain' }>(), {
  variant: 'thumb',
  fit: 'cover',
})

const url = ref<string | null>(null)
const failed = ref(false)

watch(
  () => [props.path, props.variant] as const,
  async ([path, variant]) => {
    url.value = null
    failed.value = false
    if (!path) return
    try {
      const resolved = await photoUrl(path, variant)
      if (props.path === path && props.variant === variant) url.value = resolved
    } catch (e) {
      console.error(e)
      failed.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <img v-if="url && !failed" class="photo" :class="fit" :src="url" :alt="alt" loading="lazy" decoding="async" @error="failed = true" />
  <div v-else class="photo placeholder" role="img" :aria-label="failed ? 'No se pudo cargar la foto' : 'Sin foto'">
    <ImageOff v-if="failed" :size="28" aria-hidden="true" />
    <Shirt v-else :size="44" :stroke-width="1.2" aria-hidden="true" />
  </div>
</template>

<style scoped>
.photo { display: block; width: 100%; height: 100%; }
.cover { object-fit: cover; }
.contain { object-fit: contain; }
.placeholder { display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); }
</style>
