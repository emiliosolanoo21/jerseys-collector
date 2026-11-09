import type { Currency } from '@/types'

export function formatPrice(value: number, currency: Currency): string {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value)
}

/** Fecha guardada como YYYY-MM-DD: se interpreta en hora local para no correrse un día */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Hoy en hora local, como YYYY-MM-DD */
export function isoDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
