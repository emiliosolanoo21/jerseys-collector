import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Settings, Table } from '@/types'
import { uuid } from './uuid'

/**
 * Acceso a datos. Si hay credenciales de Supabase en .env se usa Postgres
 * (sincronizado entre celular y computadora); si no, todo se guarda en el
 * navegador para poder probar la app sin configurar nada.
 */
export interface Repo {
  mode: 'supabase' | 'local'
  list<T>(table: Table): Promise<T[]>
  insert<T>(table: Table, rows: Partial<T>[]): Promise<T[]>
  update<T>(table: Table, id: string, patch: Partial<T>): Promise<T>
  remove(table: Table, id: string): Promise<void>
  getSettings(): Promise<Partial<Settings> | null>
  saveSettings(settings: Settings): Promise<void>
}

// Solo el origen: si se pega la URL con /rest/v1/ el cliente arma rutas inválidas
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const url = rawUrl ? new URL(rawUrl).origin : undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

const PAGE = 1000

function supabaseRepo(sb: SupabaseClient): Repo {
  return {
    mode: 'supabase',
    async list<T>(table: Table) {
      const rows: T[] = []
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb.from(table).select('*').order('created_at').order('id').range(from, from + PAGE - 1)
        if (error) throw error
        rows.push(...(data as T[]))
        if (data.length < PAGE) return rows
      }
    },
    async insert<T>(table: Table, rows: Partial<T>[]) {
      const { data, error } = await sb.from(table).insert(rows as Record<string, unknown>[]).select()
      if (error) throw error
      return data as T[]
    },
    async update<T>(table: Table, id: string, patch: Partial<T>) {
      const { data, error } = await sb.from(table).update(patch as Record<string, unknown>).eq('id', id).select().single()
      if (error) throw error
      return data as T
    },
    async remove(table: Table, id: string) {
      const { error } = await sb.from(table).delete().eq('id', id)
      if (error) throw error
    },
    async getSettings() {
      const { data, error } = await sb.from('settings').select('data').maybeSingle()
      if (error) throw error
      return (data?.data as Partial<Settings>) ?? null
    },
    async saveSettings(settings: Settings) {
      const { data: auth } = await sb.auth.getSession()
      const { error } = await sb
        .from('settings')
        .upsert({ user_id: auth.session?.user.id, data: settings, updated_at: new Date().toISOString() })
      if (error) throw error
    },
  }
}

const PREFIX = 'vestuario:'

function readLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function writeLocal(key: string, value: unknown) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

function localRepo(): Repo {
  return {
    mode: 'local',
    async list<T>(table: Table) {
      return readLocal<T>(table)
    },
    async insert<T>(table: Table, rows: Partial<T>[]) {
      const now = new Date().toISOString()
      const created = rows.map((r) => ({ id: uuid(), created_at: now, ...r }) as T)
      writeLocal(table, [...readLocal<T>(table), ...created])
      return created
    },
    async update<T>(table: Table, id: string, patch: Partial<T>) {
      const rows = readLocal<T & { id: string }>(table)
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) throw new Error(`No existe ${table}/${id}`)
      rows[i] = { ...rows[i], ...patch }
      writeLocal(table, rows)
      return rows[i]
    },
    async remove(table: Table, id: string) {
      writeLocal(
        table,
        readLocal<{ id: string }>(table).filter((r) => r.id !== id),
      )
    },
    async getSettings() {
      try {
        const raw = localStorage.getItem(PREFIX + 'settings')
        return raw ? (JSON.parse(raw) as Partial<Settings>) : null
      } catch {
        return null
      }
    },
    async saveSettings(settings: Settings) {
      writeLocal('settings', settings)
    },
  }
}

export const repo: Repo = supabase ? supabaseRepo(supabase) : localRepo()
