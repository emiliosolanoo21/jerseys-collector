<script setup lang="ts">
import { computed } from 'vue'
import { Award, Star } from 'lucide-vue-next'
import { useGarments } from '@/stores/garments'
import { useSettings } from '@/stores/settings'
import { KIT_LABELS, typeLabel } from '@/data/options'
import { openGarment } from '@/lib/sheets'
import { formatPrice } from '@/lib/format'
import type { Garment } from '@/types'
import GarmentPhoto from './GarmentPhoto.vue'

const props = defineProps<{ garment: Garment }>()
const store = useGarments()
const settings = useSettings()

const subtitle = computed(() => {
  const g = props.garment
  return [g.kit ? KIT_LABELS[g.kit] : typeLabel(g), g.season].filter(Boolean).join(' · ')
})
// En la lista de deseos importa cuánto cuesta; en la colección, la talla
const detail = computed(() => {
  const g = props.garment
  if (g.status === 'wish') return g.price != null ? formatPrice(g.price, settings.currency) : null
  return g.size ? `Talla ${g.size}` : null
})
</script>

<template>
  <article class="garment">
    <button class="open" :aria-label="`Ver ${garment.team}, ${subtitle}`" @click="openGarment(garment.id)">
      <span class="media">
        <GarmentPhoto :path="garment.photo_front" alt="" />
        <span v-if="garment.limited_edition" class="limited"><Award :size="13" aria-hidden="true" /> Limitada</span>
      </span>
      <span class="info">
        <b class="team">{{ garment.team }}</b>
        <span class="tiny line">{{ subtitle }}</span>
        <span v-if="detail" class="tiny line">{{ detail }}</span>
      </span>
    </button>
    <button
      class="fav"
      :class="{ on: garment.favorite }"
      :aria-pressed="garment.favorite"
      :aria-label="`Favorita: ${garment.team}`"
      @click="store.toggleFavorite(garment.id)"
    >
      <span class="fav-disc"><Star :size="18" :fill="garment.favorite ? 'currentColor' : 'none'" aria-hidden="true" /></span>
    </button>
  </article>
</template>

<style scoped>
.garment { position: relative; min-width: 0; }
.open { display: flex; flex-direction: column; align-items: stretch; width: 100%; padding: 0; gap: 0; overflow: hidden; background: var(--surface); border-color: var(--border); border-radius: var(--radius); text-align: left; box-shadow: var(--shadow); }
@media (hover: hover) { .open:hover:not(:disabled) { background: var(--surface); border-color: var(--accent); } }
.media { position: relative; display: block; aspect-ratio: 4 / 5; }
.limited { position: absolute; left: 8px; bottom: 8px; display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #15130f; color: #f0cf7a; }
.info { display: flex; flex-direction: column; padding: 8px 10px 10px; min-width: 0; }
.team, .line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* El disco oscuro mantiene visible la estrella sobre cualquier foto o fondo */
.fav { position: absolute; top: 4px; right: 4px; width: 44px; min-height: 44px; padding: 0; background: transparent; border: 0; color: #fff; }
.fav-disc { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: rgb(15 13 10 / 0.62); }
.fav.on { color: #f0c64f; }
@media (hover: hover) { .fav:hover:not(:disabled) { background: transparent; } }
</style>
