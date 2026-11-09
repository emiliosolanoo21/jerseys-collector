import { computed } from 'vue'
import { router } from '@/router'
import type { GarmentStatus } from '@/types'

/**
 * Las hojas (ficha y formulario) viven en la URL: ?prenda=<id> y ?editar=<id|nueva>.
 * Así el botón «atrás» del teléfono las cierra y la lista de abajo no pierde su lugar.
 */
const query = computed(() => router.currentRoute.value.query)

export const garmentSheetId = computed(() => (typeof query.value.prenda === 'string' ? query.value.prenda : null))
export const editorKey = computed(() => (typeof query.value.editar === 'string' ? query.value.editar : null))
export const editorStatus = computed<GarmentStatus>(() => (query.value.estado === 'wish' ? 'wish' : 'owned'))

const path = () => router.currentRoute.value.path

export const openGarment = (id: string) => router.push({ path: path(), query: { prenda: id } })
export const editGarment = (id: string) => router.push({ path: path(), query: { editar: id } })
export const newGarment = (status: GarmentStatus) =>
  router.push({ path: path(), query: status === 'wish' ? { editar: 'nueva', estado: 'wish' } : { editar: 'nueva' } })

/** Regresa a lo que había antes; si la hoja se abrió desde un enlace directo, solo la quita */
export function closeSheet() {
  if (window.history.state?.back) router.back()
  else router.replace({ path: path(), query: {} })
}
