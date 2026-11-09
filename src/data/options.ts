import type { Condition, Currency, Fit, Garment, GarmentType, Kit, Sleeve, Version } from '@/types'

export const TYPE_LABELS: Record<GarmentType, string> = {
  camisola: 'Camisola',
  chumpa: 'Chumpa',
  sueter: 'Suéter',
  pantaloneta: 'Pantaloneta',
  pants: 'Pants',
  calcetas: 'Calcetas',
  gorra: 'Gorra',
  bufanda: 'Bufanda',
  otra: 'Otra prenda',
}

export const KIT_LABELS: Record<Kit, string> = {
  local: 'Local',
  visitante: 'Visitante',
  alternativa: 'Alternativa',
  portero: 'Portero',
  entrenamiento: 'Entrenamiento',
}

export const FIT_LABELS: Record<Fit, string> = { hombre: 'Hombre', mujer: 'Mujer', nino: 'Niño', unisex: 'Unisex' }

export const VERSION_LABELS: Record<Version, string> = {
  aficionado: 'Aficionado (réplica)',
  jugador: 'Jugador (auténtica)',
  retro: 'Retro',
}

export const SLEEVE_LABELS: Record<Sleeve, string> = { corta: 'Manga corta', larga: 'Manga larga', sin: 'Sin mangas' }

export const CONDITION_LABELS: Record<Condition, string> = {
  nueva_etiqueta: 'Nueva con etiqueta',
  nueva: 'Nueva sin etiqueta',
  excelente: 'Excelente',
  buena: 'Buena',
  usada: 'Usada',
}

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export const BRANDS = ['Adidas', 'Nike', 'Puma', 'Umbro', 'New Balance', 'Kappa', 'Joma', 'Macron', 'Hummel', 'Castore', 'Le Coq Sportif', 'Lotto']

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'GTQ', label: 'Quetzal (Q)' },
  { value: 'USD', label: 'Dólar (US$)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'MXN', label: 'Peso mexicano (MX$)' },
]

/** Convierte un diccionario de etiquetas en opciones para los selectores */
export function toOptions<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

export function typeLabel(g: Pick<Garment, 'garment_type' | 'type_other'>): string {
  return g.garment_type === 'otra' ? g.type_other || TYPE_LABELS.otra : TYPE_LABELS[g.garment_type]
}
