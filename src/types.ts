export type GarmentStatus = 'owned' | 'wish'
export type GarmentType = 'camisola' | 'chumpa' | 'sueter' | 'pantaloneta' | 'pants' | 'calcetas' | 'gorra' | 'bufanda' | 'otra'
export type Kit = 'local' | 'visitante' | 'alternativa' | 'portero' | 'entrenamiento'
export type Fit = 'hombre' | 'mujer' | 'nino' | 'unisex'
export type Version = 'aficionado' | 'jugador' | 'retro'
export type Sleeve = 'corta' | 'larga' | 'sin'
export type Condition = 'nueva_etiqueta' | 'nueva' | 'excelente' | 'buena' | 'usada'

export interface Garment {
  id: string
  status: GarmentStatus
  favorite: boolean
  garment_type: GarmentType
  type_other: string | null
  team: string
  kit: Kit | null
  limited_edition: boolean
  edition_note: string | null
  season: string | null
  brand: string | null
  size: string | null
  fit: Fit | null
  version: Version | null
  sleeve: Sleeve | null
  condition: Condition | null
  color: string | null
  material: string | null
  player_name: string | null
  shirt_number: string | null
  patches: string | null
  signed: boolean
  product_code: string | null
  notes: string | null
  acquired_on: string | null
  /** Lo que pagaste o, si es un deseo, cuánto cuesta */
  price: number | null
  purchase_place: string | null
  link: string | null
  /** Ruta de la foto en el almacenamiento (no la imagen en sí) */
  photo_front: string | null
  photo_back: string | null
  created_at: string
}

/** Lo que llena el formulario: las fotos, el id y la fecha se manejan aparte */
export type GarmentDraft = Omit<Garment, 'id' | 'created_at' | 'photo_front' | 'photo_back'>

export type Currency = 'GTQ' | 'USD' | 'EUR' | 'MXN'

export interface Settings {
  currency: Currency
}

export type Table = 'garments'
