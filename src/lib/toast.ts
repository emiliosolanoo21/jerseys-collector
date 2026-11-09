import { ref } from 'vue'

/** Avisos breves y no bloqueantes ("Guardado", errores, deshacer). */
export interface Toast {
  id: number
  text: string
  kind: 'info' | 'error'
  action?: { label: string; run: () => void }
}

export const toasts = ref<Toast[]>([])
let seq = 0

export function toast(text: string, opts: { kind?: Toast['kind']; action?: Toast['action']; ms?: number } = {}) {
  const t: Toast = { id: ++seq, text, kind: opts.kind ?? 'info', action: opts.action }
  toasts.value = [...toasts.value.slice(-2), t]
  setTimeout(() => dismiss(t.id), opts.ms ?? (opts.action ? 6000 : 2500))
}

export function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}
