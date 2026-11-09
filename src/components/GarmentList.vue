<script lang="ts">
import { reactive } from 'vue'

type KitFilter = 'todas' | 'local' | 'visitante' | 'alternativa' | 'limitada'
type SortKey = 'recientes' | 'equipo' | 'temporada'
interface Filters {
  query: string
  kit: KitFilter
  type: string
  sort: SortKey
}

// Fuera del componente: al cambiar de pestaña y volver, los filtros siguen como los dejaste
const memory = new Map<string, Filters>()
function filtersFor(key: string): Filters {
  if (!memory.has(key)) memory.set(key, reactive<Filters>({ query: '', kit: 'todas', type: 'todos', sort: 'recientes' }))
  return memory.get(key)!
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, SearchX, Shirt } from 'lucide-vue-next'
import { CONDITION_LABELS, FIT_LABELS, KIT_LABELS, TYPE_LABELS, VERSION_LABELS, typeLabel } from '@/data/options'
import type { Garment, GarmentType } from '@/types'
import GarmentCard from './GarmentCard.vue'

const props = defineProps<{ items: Garment[]; listKey: string; emptyTitle: string; emptyText: string }>()
const filters = filtersFor(props.listKey)

const KITS: { id: KitFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'local', label: 'Local' },
  { id: 'visitante', label: 'Visitante' },
  { id: 'alternativa', label: 'Alternativa' },
  { id: 'limitada', label: 'Edición limitada' },
]

// Solo se ofrecen los tipos de prenda que de verdad hay en esta lista
const typeOptions = computed(() => {
  const counts = new Map<GarmentType, number>()
  for (const g of props.items) counts.set(g.garment_type, (counts.get(g.garment_type) ?? 0) + 1)
  return (Object.keys(TYPE_LABELS) as GarmentType[]).filter((t) => counts.has(t)).map((t) => ({ value: t, label: `${TYPE_LABELS[t]} (${counts.get(t)})` }))
})

function searchable(g: Garment): string {
  return [
    g.team,
    typeLabel(g),
    g.kit && KIT_LABELS[g.kit],
    g.limited_edition && 'edición limitada',
    g.edition_note,
    g.season,
    g.brand,
    g.size,
    g.fit && FIT_LABELS[g.fit],
    g.version && VERSION_LABELS[g.version],
    g.condition && CONDITION_LABELS[g.condition],
    g.color,
    g.player_name,
    g.shirt_number,
    g.patches,
    g.purchase_place,
    g.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const visible = computed(() => {
  const q = filters.query.trim().toLowerCase()
  const list = props.items.filter(
    (g) =>
      (filters.kit === 'todas' || (filters.kit === 'limitada' ? g.limited_edition : g.kit === filters.kit)) &&
      (filters.type === 'todos' || g.garment_type === filters.type) &&
      (!q || searchable(g).includes(q)),
  )
  if (filters.sort === 'equipo') return list.sort((a, b) => a.team.localeCompare(b.team, 'es') || (b.season ?? '').localeCompare(a.season ?? ''))
  if (filters.sort === 'temporada') return list.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? '') || a.team.localeCompare(b.team, 'es'))
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
})

function clearFilters() {
  Object.assign(filters, { query: '', kit: 'todas', type: 'todos' })
}
</script>

<template>
  <section v-if="!items.length" class="card intro">
    <span class="intro-icon" aria-hidden="true"><Shirt :size="30" :stroke-width="1.6" /></span>
    <h2>{{ emptyTitle }}</h2>
    <p class="small muted">{{ emptyText }}</p>
  </section>

  <template v-else>
    <div class="search">
      <Search :size="18" class="search-icon" aria-hidden="true" />
      <input v-model="filters.query" type="search" aria-label="Buscar" placeholder="Buscar equipo, jugador, marca…" />
    </div>

    <div class="filters" role="group" aria-label="Filtrar por versión">
      <button
        v-for="k in KITS"
        :key="k.id"
        class="small"
        :class="{ primary: filters.kit === k.id }"
        :aria-pressed="filters.kit === k.id"
        @click="filters.kit = k.id"
      >
        {{ k.label }}
      </button>
    </div>

    <div class="pair">
      <select v-model="filters.type" aria-label="Tipo de prenda">
        <option value="todos">Todas las prendas</option>
        <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <select v-model="filters.sort" aria-label="Ordenar">
        <option value="recientes">Más recientes</option>
        <option value="equipo">Equipo (A-Z)</option>
        <option value="temporada">Temporada</option>
      </select>
    </div>

    <div v-if="visible.length" class="grid">
      <GarmentCard v-for="g in visible" :key="g.id" :garment="g" />
    </div>
    <section v-else class="card intro">
      <span class="intro-icon" aria-hidden="true"><SearchX :size="28" :stroke-width="1.6" /></span>
      <p class="small muted">Nada coincide con tu búsqueda.</p>
      <button class="small" @click="clearFilters">Quitar filtros</button>
    </section>
  </template>
</template>

<style scoped>
.intro { align-items: center; text-align: center; padding: 32px 20px; }
.intro p { max-width: 34ch; }
.intro-icon { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); }
.search { position: relative; }
.search-icon { position: absolute; left: 12px; top: 13px; color: var(--text-3); pointer-events: none; }
.search input { padding-left: 38px; }
.filters { display: flex; gap: 6px; overflow-x: auto; margin: 0 -16px; padding: 2px 16px; scrollbar-width: none; }
.filters::-webkit-scrollbar { display: none; }
.filters button { flex: none; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
@media (min-width: 900px) {
  .filters { margin: 0; padding: 2px; flex-wrap: wrap; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
}
</style>
