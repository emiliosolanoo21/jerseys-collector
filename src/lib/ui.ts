import { computed, ref } from 'vue'
import type { Router } from 'vue-router'

/**
 * Estado de la interfaz que afecta a la barra inferior en el celular:
 * al escribir (teclado abierto) o con una hoja abierta, la barra y el botón de
 * agregar se ocultan en lugar de «saltar» encima del teclado.
 *
 * Se recalcula leyendo el estado REAL de la página (campo activo y <dialog> abiertos)
 * en lugar de llevar la cuenta: si un campo con foco desaparece, Safari no avisa.
 */
export const typing = ref(false)
export const openSheets = ref(0)

/** El formulario tiene cambios sin guardar: el router pregunta antes de cerrarlo */
export const editorDirty = ref(false)

const coarse = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

function isTextField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement) || !el.isConnected) return false
  if (el.isContentEditable || el.tagName === 'TEXTAREA') return true
  if (el.tagName !== 'INPUT') return false
  const type = (el as HTMLInputElement).type
  return !['checkbox', 'radio', 'range', 'button', 'submit', 'file', 'color'].includes(type)
}

/** Vuelve a leer qué hay en pantalla: campo de texto activo y hojas abiertas. */
export function refreshUi() {
  typing.value = isTextField(document.activeElement)
  openSheets.value = document.querySelectorAll('dialog[open]').length
}

export const hideChrome = computed(() => coarse() && (typing.value || openSheets.value > 0))

export function initUi(router: Router) {
  const later = () => setTimeout(refreshUi, 60)
  document.addEventListener('focusin', refreshUi)
  // Al pasar de un campo a otro llega focusout y luego focusin: se espera un instante
  document.addEventListener('focusout', later)
  document.addEventListener('pointerdown', later, { capture: true, passive: true })
  document.addEventListener('visibilitychange', later)
  window.addEventListener('orientationchange', () => setTimeout(refreshUi, 300))
  window.addEventListener('resize', later)
  // Al cambiar de pantalla: se cierra el teclado (si quedó abierto) y se recalcula
  router.afterEach(() => {
    const el = document.activeElement
    if (isTextField(el)) (el as HTMLElement).blur()
    later()
  })
}
