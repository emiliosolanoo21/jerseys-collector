import { supabase } from './repo'
import { uuid } from './uuid'

/**
 * Fotos de las prendas. Cada foto se guarda en dos tamaños: la grande para la
 * ficha y una miniatura para que la cuadrícula cargue rápido aunque haya cientos.
 * Con Supabase van a un bucket privado; sin Supabase, a IndexedDB
 * (localStorage solo alcanzaría para unas pocas fotos).
 * En la base de datos se guarda únicamente la ruta de la foto grande.
 */
export interface PhotoBlobs {
  full: Blob
  thumb: Blob
}
export type PhotoVariant = 'full' | 'thumb'

const BUCKET = 'garment-photos'
const thumbPath = (path: string) => path.replace(/\.jpg$/, '_t.jpg')
const objectPath = (path: string, variant: PhotoVariant) => (variant === 'thumb' ? thumbPath(path) : path)

// ---------- Reducir la foto del celular ----------

function drawJpeg(img: HTMLImageElement, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la foto'))), 'image/jpeg', quality),
  )
}

export async function processPhoto(file: File): Promise<PhotoBlobs> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    // 1400 px conserva parches, costuras y etiquetas; la miniatura llena una tarjeta
    const [full, thumb] = await Promise.all([drawJpeg(img, 1400, 0.82), drawJpeg(img, 480, 0.72)])
    return { full, thumb }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ---------- IndexedDB (modo local) ----------

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('vestuario-photos', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('photos')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbRun<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode)
    const req = run(tx.objectStore('photos'))
    tx.oncomplete = () => {
      db.close()
      resolve(req ? req.result : undefined)
    }
    tx.onerror = tx.onabort = () => {
      db.close()
      reject(tx.error)
    }
  })
}

const objectUrls = new Map<string, string>()

// ---------- Enlaces firmados (Supabase) ----------

const SIGNED_KEY = 'vestuario:signed-urls'
const TTL_S = 7 * 24 * 3600
const DAY_MS = 24 * 3600 * 1000

type SignedCache = Record<string, { url: string; exp: number }>

function loadSigned(): SignedCache {
  try {
    return JSON.parse(localStorage.getItem(SIGNED_KEY) ?? '{}') as SignedCache
  } catch {
    return {}
  }
}

// Reusar el mismo enlace entre visitas permite que el navegador sirva la foto desde su caché
const signed = loadSigned()

function persistSigned() {
  try {
    localStorage.setItem(SIGNED_KEY, JSON.stringify(signed))
  } catch {
    /* sin espacio: solo se pierde la caché de enlaces */
  }
}

interface Waiter {
  resolve: (url: string) => void
  reject: (e: unknown) => void
}
const waiting = new Map<string, Waiter[]>()
let flushScheduled = false

/** Todas las fotos que pide una pantalla se firman en una sola petición */
async function flushSigned() {
  flushScheduled = false
  const batch = [...waiting.entries()]
  waiting.clear()
  try {
    const { data, error } = await supabase!.storage.from(BUCKET).createSignedUrls(batch.map(([p]) => p), TTL_S)
    if (error) throw error
    batch.forEach(([path, waiters], i) => {
      const url = data[i]?.signedUrl
      if (url) {
        signed[path] = { url, exp: Date.now() + TTL_S * 1000 }
        waiters.forEach((w) => w.resolve(url))
      } else waiters.forEach((w) => w.reject(new Error(data[i]?.error ?? 'Foto no encontrada')))
    })
    persistSigned()
  } catch (e) {
    batch.forEach(([, waiters]) => waiters.forEach((w) => w.reject(e)))
  }
}

function signedUrl(path: string): Promise<string> {
  const hit = signed[path]
  if (hit && hit.exp - Date.now() > DAY_MS) return Promise.resolve(hit.url)
  return new Promise((resolve, reject) => {
    waiting.set(path, [...(waiting.get(path) ?? []), { resolve, reject }])
    if (!flushScheduled) {
      flushScheduled = true
      setTimeout(flushSigned)
    }
  })
}

// ---------- API ----------

/** Guarda los dos tamaños y devuelve la ruta que se anota en la prenda */
export async function storePhoto(blobs: PhotoBlobs): Promise<string> {
  const name = `${uuid()}.jpg`
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const path = `${data.session?.user.id}/${name}`
    const options = { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false }
    const results = await Promise.all([
      supabase.storage.from(BUCKET).upload(path, blobs.full, options),
      supabase.storage.from(BUCKET).upload(thumbPath(path), blobs.thumb, options),
    ])
    const failed = results.find((r) => r.error)
    if (failed) {
      await removePhotos([path])
      throw failed.error
    }
    return path
  }
  await idbRun('readwrite', (s) => {
    s.put(blobs.full, name)
    s.put(blobs.thumb, thumbPath(name))
  })
  return name
}

export async function photoUrl(path: string, variant: PhotoVariant): Promise<string> {
  const key = objectPath(path, variant)
  if (supabase) return signedUrl(key)
  const known = objectUrls.get(key)
  if (known) return known
  const blob = await idbRun<Blob>('readonly', (s) => s.get(key) as IDBRequest<Blob>)
  if (!blob) throw new Error('Foto no encontrada')
  const url = URL.createObjectURL(blob)
  objectUrls.set(key, url)
  return url
}

/** Si falla solo queda un archivo sin usar: no vale la pena interrumpir a la persona */
export async function removePhotos(paths: string[]): Promise<void> {
  if (!paths.length) return
  const keys = paths.flatMap((p) => [p, thumbPath(p)])
  try {
    if (supabase) {
      const { error } = await supabase.storage.from(BUCKET).remove(keys)
      if (error) throw error
      keys.forEach((k) => delete signed[k])
      persistSigned()
    } else {
      await idbRun('readwrite', (s) => keys.forEach((k) => s.delete(k)))
      for (const k of keys) {
        const url = objectUrls.get(k)
        if (url) URL.revokeObjectURL(url)
        objectUrls.delete(k)
      }
    }
  } catch (e) {
    console.error('No se pudieron borrar las fotos', e)
  }
}

/** Al cerrar sesión no deben quedar enlaces a las fotos en este dispositivo */
export function clearPhotoCache() {
  for (const k of Object.keys(signed)) delete signed[k]
  try {
    localStorage.removeItem(SIGNED_KEY)
  } catch {
    /* sin almacenamiento: no hay nada que limpiar */
  }
}
