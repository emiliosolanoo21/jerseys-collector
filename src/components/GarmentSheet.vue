<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Award, BadgeCheck, ExternalLink, PackageCheck, Pencil, PenTool, Star, Trash2 } from 'lucide-vue-next'
import { useGarments } from '@/stores/garments'
import { useSettings } from '@/stores/settings'
import { CONDITION_LABELS, FIT_LABELS, KIT_LABELS, SLEEVE_LABELS, VERSION_LABELS, typeLabel } from '@/data/options'
import { closeSheet, editGarment, garmentSheetId } from '@/lib/sheets'
import { formatDate, formatPrice } from '@/lib/format'
import { toast } from '@/lib/toast'
import BottomSheet from './BottomSheet.vue'
import GarmentPhoto from './GarmentPhoto.vue'

/** Ficha de una prenda: fotos de frente y espalda y todos sus detalles. */
const store = useGarments()
const settings = useSettings()
const g = computed(() => (garmentSheetId.value ? store.byId.get(garmentSheetId.value) : undefined))

const photos = computed(() => {
  if (!g.value) return []
  return [
    { label: 'Frente', path: g.value.photo_front },
    { label: 'Espalda', path: g.value.photo_back },
  ].filter((p) => p.path)
})

const slides = ref<HTMLElement | null>(null)
const slide = ref(0)
watch(garmentSheetId, () => {
  slide.value = 0
  slides.value?.scrollTo({ left: 0 })
})
function onScroll() {
  const el = slides.value
  if (el) slide.value = Math.round(el.scrollLeft / el.clientWidth)
}
function goTo(i: number) {
  const el = slides.value
  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}

const groups = computed(() => {
  const x = g.value
  if (!x) return []
  const isWish = x.status === 'wish'
  const groupsRaw: { title: string; rows: [string, string | null | undefined][] }[] = [
    {
      title: 'Prenda',
      rows: [
        ['Tipo', typeLabel(x)],
        ['Versión', x.kit && KIT_LABELS[x.kit]],
        ['Temporada', x.season],
        ['Marca', x.brand],
        ['Edición limitada', x.limited_edition ? x.edition_note || 'Sí' : null],
      ],
    },
    {
      title: 'Detalles',
      rows: [
        ['Talla', x.size],
        ['Corte', x.fit && FIT_LABELS[x.fit]],
        ['Calidad', x.version && VERSION_LABELS[x.version]],
        ['Manga', x.sleeve && SLEEVE_LABELS[x.sleeve]],
        ['Estado', x.condition && CONDITION_LABELS[x.condition]],
        ['Color', x.color],
        ['Material', x.material],
        ['Jugador', x.player_name],
        ['Dorsal', x.shirt_number],
        ['Parches', x.patches],
        ['Código', x.product_code],
      ],
    },
    {
      title: isWish ? 'Dónde conseguirla' : 'Compra',
      rows: [
        ['Fecha', x.acquired_on && formatDate(x.acquired_on)],
        [isWish ? 'Precio' : 'Pagado', x.price != null ? formatPrice(x.price, settings.currency) : null],
        [isWish ? 'Tienda' : 'Lugar', x.purchase_place],
      ],
    },
  ]
  return groupsRaw.map((group) => ({ ...group, rows: group.rows.filter(([, v]) => v) })).filter((group) => group.rows.length)
})

async function acquire() {
  if (!g.value) return
  const undo = await store.markOwned(g.value.id)
  closeSheet()
  toast('Agregada a tu colección', { action: { label: 'Deshacer', run: () => void undo() } })
}

async function remove() {
  if (!g.value) return
  const undo = await store.remove(g.value.id)
  closeSheet()
  toast('Prenda borrada', { action: { label: 'Deshacer', run: () => void undo() } })
}
</script>

<template>
  <BottomSheet :open="!!g" :title="g?.team ?? ''" @close="closeSheet">
    <template v-if="g" #head>
      <button
        class="ghost small icon"
        :class="{ on: g.favorite }"
        :aria-pressed="g.favorite"
        aria-label="Favorita"
        @click="store.toggleFavorite(g.id)"
      >
        <Star :size="22" :fill="g.favorite ? 'currentColor' : 'none'" aria-hidden="true" />
      </button>
    </template>

    <template v-if="g">
      <div v-if="photos.length" class="gallery">
        <div ref="slides" class="slides" tabindex="0" aria-label="Fotos de la prenda" @scroll.passive="onScroll">
          <div v-for="p in photos" :key="p.label" class="slide">
            <GarmentPhoto :path="p.path" :alt="`${g.team}, ${p.label.toLowerCase()}`" variant="full" fit="contain" />
          </div>
        </div>
        <div v-if="photos.length > 1" class="switch-side" role="group" aria-label="Ver lado">
          <button v-for="(p, i) in photos" :key="p.label" class="small" :class="{ primary: slide === i }" :aria-pressed="slide === i" @click="goTo(i)">
            {{ p.label }}
          </button>
        </div>
      </div>
      <div v-else class="no-photo">
        <GarmentPhoto :path="null" alt="" />
      </div>

      <div class="row">
        <span v-if="g.status === 'wish'" class="chip accent">Lista de deseos</span>
        <span v-if="g.limited_edition" class="chip accent"><Award :size="13" aria-hidden="true" /> Edición limitada</span>
        <span v-if="g.signed" class="chip accent"><PenTool :size="13" aria-hidden="true" /> Autografiada</span>
        <span v-if="g.version === 'jugador'" class="chip"><BadgeCheck :size="13" aria-hidden="true" /> Auténtica</span>
      </div>

      <section v-for="group in groups" :key="group.title" class="stack">
        <h3>{{ group.title }}</h3>
        <dl class="specs">
          <div v-for="[label, value] in group.rows" :key="label" class="spec">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>

      <a v-if="g.link" class="btn" :href="g.link" target="_blank" rel="noopener noreferrer"><ExternalLink :size="18" aria-hidden="true" /> Abrir enlace de la tienda</a>

      <section v-if="g.notes" class="stack">
        <h3>Notas</h3>
        <p class="small muted notes">{{ g.notes }}</p>
      </section>

      <button class="ghost small danger" @click="remove"><Trash2 :size="16" aria-hidden="true" /> Borrar prenda</button>
    </template>

    <template v-if="g" #footer>
      <button class="grow" @click="editGarment(g.id)"><Pencil :size="18" aria-hidden="true" /> Editar</button>
      <button v-if="g.status === 'wish'" class="primary grow" @click="acquire"><PackageCheck :size="18" aria-hidden="true" /> Ya la tengo</button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.icon { width: 44px; min-height: 44px; padding: 0; color: var(--text-3); }
.icon.on { color: var(--star); }
.gallery { display: flex; flex-direction: column; gap: 8px; }
.slides { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; border-radius: 12px; background: var(--surface-2); scrollbar-width: none; }
.slides::-webkit-scrollbar { display: none; }
.slide { flex: 0 0 100%; aspect-ratio: 1; scroll-snap-align: center; }
.switch-side { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.no-photo { height: 120px; border-radius: 12px; overflow: hidden; }
.specs { margin: 0; display: flex; flex-direction: column; }
.spec { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 0.92rem; }
.spec dt { color: var(--text-2); flex: none; }
.spec dd { margin: 0; text-align: right; font-weight: 550; overflow-wrap: anywhere; min-width: 0; }
.notes { white-space: pre-wrap; }
</style>
