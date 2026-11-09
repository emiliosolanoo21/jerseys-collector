<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useGarments, type PhotoChange } from '@/stores/garments'
import { useSettings } from '@/stores/settings'
import { BRANDS, CONDITION_LABELS, CURRENCIES, FIT_LABELS, KIT_LABELS, SIZES, SLEEVE_LABELS, TYPE_LABELS, VERSION_LABELS, toOptions } from '@/data/options'
import { closeSheet, editorKey, editorStatus } from '@/lib/sheets'
import { editorDirty } from '@/lib/ui'
import { processPhoto, type PhotoBlobs } from '@/lib/photos'
import { friendlyMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import type { Garment, GarmentDraft, GarmentStatus } from '@/types'
import BottomSheet from './BottomSheet.vue'
import ChipPicker from './ChipPicker.vue'
import PhotoSlot from './PhotoSlot.vue'

/** Formulario para agregar o editar una prenda de la colección o de la lista de deseos. */
const store = useGarments()
const settings = useSettings()

function emptyDraft(status: GarmentStatus): GarmentDraft {
  return {
    status,
    favorite: false,
    garment_type: 'camisola',
    type_other: null,
    team: '',
    kit: null,
    limited_edition: false,
    edition_note: null,
    season: null,
    brand: null,
    size: null,
    fit: null,
    version: null,
    sleeve: null,
    condition: null,
    color: null,
    material: null,
    player_name: null,
    shirt_number: null,
    patches: null,
    signed: false,
    product_code: null,
    notes: null,
    acquired_on: null,
    price: null,
    purchase_place: null,
    link: null,
  }
}

const form = ref<GarmentDraft>(emptyDraft('owned'))
let snapshot = ''
const current = ref<Garment | null>(null)
const error = ref<string | null>(null)
const busy = ref(false)
const detailsOpen = ref(false)

// ---------- Talla: opciones comunes o una a mano (32, 8 años…) ----------
const OTHER_SIZE = '__otra'
const sizeOptions = [...SIZES.map((s) => ({ value: s, label: s })), { value: OTHER_SIZE, label: 'Otra' }]
const customSize = ref(false)
const sizeChoice = computed({
  get: () => (customSize.value ? OTHER_SIZE : form.value.size),
  set: (v: string | null) => {
    customSize.value = v === OTHER_SIZE
    form.value.size = v === OTHER_SIZE ? null : v
  },
})

// ---------- Fotos ----------
interface Slot {
  path: string | null
  blobs: PhotoBlobs | null
  preview: string | null
  busy: boolean
  /** La persona la cambió o la quitó */
  touched: boolean
}
const front = reactive<Slot>({ path: null, blobs: null, preview: null, busy: false, touched: false })
const back = reactive<Slot>({ path: null, blobs: null, preview: null, busy: false, touched: false })

function setPreview(slot: Slot, url: string | null) {
  if (slot.preview) URL.revokeObjectURL(slot.preview)
  slot.preview = url
}

async function pickPhoto(slot: Slot, file: File) {
  slot.busy = true
  error.value = null
  try {
    const blobs = await processPhoto(file)
    slot.blobs = blobs
    slot.touched = true
    setPreview(slot, URL.createObjectURL(blobs.thumb))
  } catch (e) {
    console.error(e)
    error.value = 'No pudimos leer esa foto. Prueba con otra en JPG o PNG.'
  } finally {
    slot.busy = false
  }
}

function clearPhoto(slot: Slot) {
  slot.blobs = null
  slot.path = null
  slot.touched = true
  setPreview(slot, null)
}

const photoChange = (slot: Slot): PhotoChange => (slot.touched ? slot.blobs : undefined)

// ---------- Abrir ----------
function init(key: string | null) {
  error.value = null
  detailsOpen.value = false
  setPreview(front, null)
  setPreview(back, null)
  current.value = key && key !== 'nueva' ? (store.byId.get(key) ?? null) : null
  if (key && key !== 'nueva' && !current.value) {
    closeSheet()
    return
  }
  const g = current.value
  const draft = emptyDraft(editorStatus.value)
  for (const k of Object.keys(draft) as (keyof GarmentDraft)[]) if (g) Object.assign(draft, { [k]: g[k] })
  form.value = draft
  snapshot = JSON.stringify(draft)
  customSize.value = !!draft.size && !SIZES.includes(draft.size)
  Object.assign(front, { path: g?.photo_front ?? null, blobs: null, busy: false, touched: false })
  Object.assign(back, { path: g?.photo_back ?? null, blobs: null, busy: false, touched: false })
  // Si ya tiene datos secundarios, se muestran desde el inicio
  detailsOpen.value = !!g && !!(g.fit || g.version || g.sleeve || g.condition || g.color || g.material || g.player_name || g.shirt_number || g.patches || g.signed || g.product_code)
}
watch(editorKey, init, { immediate: true })

watch(
  () => !!editorKey.value && (JSON.stringify(form.value) !== snapshot || front.touched || back.touched),
  (dirty) => (editorDirty.value = dirty),
)

const isWish = computed(() => form.value.status === 'wish')
const title = computed(() => (current.value ? 'Editar prenda' : isWish.value ? 'Nuevo deseo' : 'Nueva prenda'))
const currencyLabel = computed(() => CURRENCIES.find((c) => c.value === settings.currency)?.label ?? settings.currency)

// Equipos que ya escribiste, para no repetirlos y evitar variantes
const knownTeams = computed(() => [...new Set(store.items.map((g) => g.team))].sort((a, b) => a.localeCompare(b, 'es')))

// ---------- Guardar ----------
/** Sin textos vacíos ni números inválidos: Postgres rechaza '' en columnas numéricas y de fecha */
function clean(d: GarmentDraft): GarmentDraft {
  const out = { ...d } as Record<string, unknown>
  for (const [k, v] of Object.entries(out)) if (typeof v === 'string') out[k] = v.trim() || null
  const price = Number(d.price)
  out.price = d.price === null || (d.price as unknown) === '' || !Number.isFinite(price) || price < 0 ? null : price
  const link = out.link as string | null
  out.link = link && !/^https?:\/\//i.test(link) ? `https://${link}` : link
  if (d.garment_type !== 'otra') out.type_other = null
  if (!d.limited_edition) out.edition_note = null
  return out as unknown as GarmentDraft
}

async function submit() {
  // `required` deja pasar un nombre hecho solo de espacios
  if (!form.value.team.trim()) {
    error.value = 'Escribe el equipo o la selección.'
    return
  }
  busy.value = true
  error.value = null
  try {
    const wasNew = !current.value
    await store.save(current.value?.id ?? null, clean(form.value), photoChange(front), photoChange(back))
    editorDirty.value = false
    closeSheet()
    toast(wasNew ? (isWish.value ? 'Agregada a tus deseos' : 'Agregada a tu colección') : 'Cambios guardados')
  } catch (e) {
    console.error(e)
    error.value = friendlyMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BottomSheet :open="!!editorKey" :title="title" @close="closeSheet">
    <form id="garment-form" class="form" @submit.prevent="submit">
      <div class="segmented" role="group" aria-label="¿La tienes?">
        <button type="button" :class="{ primary: !isWish }" :aria-pressed="!isWish" @click="form.status = 'owned'">La tengo</button>
        <button type="button" :class="{ primary: isWish }" :aria-pressed="isWish" @click="form.status = 'wish'">La deseo</button>
      </div>

      <div class="pair photos">
        <PhotoSlot label="Frente" :path="front.path" :preview="front.preview" :busy="front.busy" @pick="pickPhoto(front, $event)" @clear="clearPhoto(front)" />
        <PhotoSlot label="Espalda" :path="back.path" :preview="back.preview" :busy="back.busy" @pick="pickPhoto(back, $event)" @clear="clearPhoto(back)" />
      </div>

      <div class="field">
        Tipo de prenda
        <ChipPicker v-model="form.garment_type" :options="toOptions(TYPE_LABELS)" label="Tipo de prenda" />
      </div>
      <label v-if="form.garment_type === 'otra'" class="field">¿Qué prenda es?
        <input v-model="form.type_other" placeholder="Ej. Polo, chaleco, mochila" />
      </label>

      <label class="field">Equipo o selección
        <input v-model="form.team" list="known-teams" required autocapitalize="words" placeholder="Ej. Barcelona, Guatemala" />
        <datalist id="known-teams">
          <option v-for="t in knownTeams" :key="t" :value="t" />
        </datalist>
      </label>

      <div class="field">
        Versión
        <ChipPicker v-model="form.kit" :options="toOptions(KIT_LABELS)" label="Versión" clearable />
      </div>

      <label class="switch">
        <input v-model="form.limited_edition" type="checkbox" />
        <span class="track"><span class="thumb" /></span>
        Edición limitada
      </label>
      <label v-if="form.limited_edition" class="field">¿Cuál edición?
        <input v-model="form.edition_note" placeholder="Ej. Centenario, 123/500" />
      </label>

      <div class="pair">
        <label class="field">Temporada
          <input v-model="form.season" placeholder="Ej. 2024/25" />
        </label>
        <label class="field">Marca
          <input v-model="form.brand" list="known-brands" autocapitalize="words" placeholder="Ej. Adidas" />
          <datalist id="known-brands">
            <option v-for="b in BRANDS" :key="b" :value="b" />
          </datalist>
        </label>
      </div>

      <div class="field">
        Talla
        <ChipPicker v-model="sizeChoice" :options="sizeOptions" label="Talla" clearable />
      </div>
      <label v-if="customSize" class="field">Escribe la talla
        <input v-model="form.size" placeholder="Ej. 32, 8 años, Única" />
      </label>

      <h3 class="section">{{ isWish ? 'Dónde conseguirla' : 'Compra' }}</h3>
      <label v-if="!isWish" class="field">Fecha en que la conseguiste
        <input v-model="form.acquired_on" type="date" />
      </label>
      <div class="pair">
        <label class="field">{{ isWish ? 'Precio aproximado' : 'Precio pagado' }}
          <input v-model.number="form.price" type="number" inputmode="decimal" min="0" step="any" :placeholder="currencyLabel" />
        </label>
        <label class="field">{{ isWish ? 'Tienda' : 'Dónde la compraste' }}
          <input v-model="form.purchase_place" placeholder="Tienda, regalo…" />
        </label>
      </div>
      <label v-if="isWish" class="field">Enlace de la tienda
        <input v-model="form.link" type="text" inputmode="url" autocapitalize="none" placeholder="https://…" />
      </label>

      <button v-if="!detailsOpen" type="button" class="small" @click="detailsOpen = true">Más detalles (corte, dorsal, estado…)</button>
      <template v-else>
        <h3 class="section">Detalles de la prenda</h3>
        <div class="pair">
          <label class="field">Jugador
            <input v-model="form.player_name" autocapitalize="words" placeholder="Ej. Messi" />
          </label>
          <label class="field">Dorsal
            <input v-model="form.shirt_number" inputmode="numeric" placeholder="Ej. 10" />
          </label>
        </div>
        <div class="pair">
          <label class="field">Corte
            <select v-model="form.fit">
              <option :value="null">Sin indicar</option>
              <option v-for="o in toOptions(FIT_LABELS)" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
          <label class="field">Calidad
            <select v-model="form.version">
              <option :value="null">Sin indicar</option>
              <option v-for="o in toOptions(VERSION_LABELS)" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>
        <div class="pair">
          <label class="field">Manga
            <select v-model="form.sleeve">
              <option :value="null">Sin indicar</option>
              <option v-for="o in toOptions(SLEEVE_LABELS)" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
          <label class="field">Estado
            <select v-model="form.condition">
              <option :value="null">Sin indicar</option>
              <option v-for="o in toOptions(CONDITION_LABELS)" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>
        <div class="pair">
          <label class="field">Color
            <input v-model="form.color" placeholder="Ej. Azul y grana" />
          </label>
          <label class="field">Material
            <input v-model="form.material" placeholder="Ej. 100% poliéster" />
          </label>
        </div>
        <label class="field">Parches
          <input v-model="form.patches" placeholder="Ej. Champions League, La Liga" />
        </label>
        <label class="field">Código del producto
          <input v-model="form.product_code" autocapitalize="characters" placeholder="Viene en la etiqueta interior" />
        </label>
        <label class="switch">
          <input v-model="form.signed" type="checkbox" />
          <span class="track"><span class="thumb" /></span>
          Autografiada
        </label>
      </template>

      <label class="field">Notas
        <textarea v-model="form.notes" rows="3" placeholder="Su historia, quién te la regaló…" />
      </label>

      <p v-if="error" class="error-banner" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <button type="submit" form="garment-form" class="primary block" :disabled="busy || front.busy || back.busy">
        {{ busy ? 'Guardando…' : 'Guardar' }}
      </button>
    </template>
  </BottomSheet>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 14px; }
.segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.photos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.section { margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--border); }
textarea { resize: vertical; }
</style>
