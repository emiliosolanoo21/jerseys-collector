import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/lib/repo'
import { removePhotos, storePhoto, type PhotoBlobs } from '@/lib/photos'
import { isoDate } from '@/lib/format'
import type { Garment, GarmentDraft } from '@/types'

/** Qué pasa con una foto al guardar: se conserva (undefined), se reemplaza o se quita (null) */
export type PhotoChange = PhotoBlobs | null | undefined

/** Tiempo que dura el «Deshacer»: las fotos no se borran hasta que pase */
const UNDO_MS = 6500

export const useGarments = defineStore('garments', () => {
  const items = ref<Garment[]>([])

  const owned = computed(() => items.value.filter((g) => g.status === 'owned'))
  const wishes = computed(() => items.value.filter((g) => g.status === 'wish'))
  const favorites = computed(() => items.value.filter((g) => g.favorite))
  const byId = computed(() => new Map(items.value.map((g) => [g.id, g])))

  async function load() {
    items.value = await repo.list<Garment>('garments')
  }

  function replace(row: Garment) {
    items.value = items.value.map((g) => (g.id === row.id ? row : g))
  }

  async function update(id: string, patch: Partial<Garment>) {
    const row = await repo.update<Garment>('garments', id, patch)
    replace(row)
    return row
  }

  /** Crea o actualiza una prenda: primero sube las fotos para no dejar una ficha a medias */
  async function save(id: string | null, draft: GarmentDraft, front: PhotoChange, back: PhotoChange) {
    const current = id ? byId.value.get(id) : undefined
    const uploaded: string[] = []
    const resolve = async (change: PhotoChange, prev: string | null) => {
      if (change === undefined) return prev
      if (change === null) return null
      const path = await storePhoto(change)
      uploaded.push(path)
      return path
    }

    let row: Garment
    try {
      const photo_front = await resolve(front, current?.photo_front ?? null)
      const photo_back = await resolve(back, current?.photo_back ?? null)
      const data = { ...draft, photo_front, photo_back }
      if (id) row = await update(id, data)
      else {
        ;[row] = await repo.insert<Garment>('garments', [data])
        items.value = [...items.value, row]
      }
    } catch (e) {
      await removePhotos(uploaded)
      throw e
    }

    // Las fotos reemplazadas o quitadas ya no se usan
    if (current) {
      const stale = [current.photo_front, current.photo_back].filter((p): p is string => !!p && p !== row.photo_front && p !== row.photo_back)
      await removePhotos(stale)
    }
    return row
  }

  /** Se ve de inmediato; si falla al guardar, vuelve como estaba */
  async function toggleFavorite(id: string) {
    const g = byId.value.get(id)
    if (!g) return
    replace({ ...g, favorite: !g.favorite })
    try {
      await repo.update<Garment>('garments', id, { favorite: !g.favorite })
    } catch (e) {
      replace(g)
      throw e
    }
  }

  /** Pasa un deseo a la colección y devuelve cómo deshacerlo */
  async function markOwned(id: string) {
    const prev = byId.value.get(id)
    if (!prev) return () => Promise.resolve()
    await update(id, { status: 'owned', acquired_on: prev.acquired_on ?? isoDate() })
    return async () => {
      await update(id, { status: 'wish', acquired_on: prev.acquired_on })
    }
  }

  /** Borra la prenda ya y devuelve cómo deshacerlo; las fotos esperan a que venza el «Deshacer» */
  async function remove(id: string) {
    const row = byId.value.get(id)
    if (!row) return () => Promise.resolve()
    await repo.remove('garments', id)
    items.value = items.value.filter((g) => g.id !== id)
    const timer = setTimeout(() => {
      void removePhotos([row.photo_front, row.photo_back].filter((p): p is string => !!p))
    }, UNDO_MS)
    return async () => {
      clearTimeout(timer)
      const [restored] = await repo.insert<Garment>('garments', [row])
      items.value = [...items.value, restored]
    }
  }

  function clear() {
    items.value = []
  }

  return { items, owned, wishes, favorites, byId, load, save, toggleFavorite, markOwned, remove, clear }
})
