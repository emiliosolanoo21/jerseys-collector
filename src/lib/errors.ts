/**
 * Mensaje legible de cualquier error. Supabase devuelve objetos planos
 * ({ code, message, details, hint }) que no son `Error`: String(e) daría
 * «[object Object]». Este texto es técnico: solo va a la consola.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const o = e as { message?: unknown; error_description?: unknown; code?: unknown }
    const msg = typeof o.message === 'string' ? o.message : typeof o.error_description === 'string' ? o.error_description : null
    if (msg) return typeof o.code === 'string' ? `${msg} (${o.code})` : msg
    try {
      return JSON.stringify(e)
    } catch {
      /* objeto circular */
    }
  }
  return String(e)
}

/** ¿Falta una tabla, columna o el bucket en Supabase? (no se ejecutó el schema.sql) */
function isMissingSchema(e: unknown): boolean {
  const o = (e ?? {}) as { code?: string; message?: string }
  return (
    o.code === 'PGRST205' ||
    o.code === 'PGRST204' ||
    o.code === '42P01' ||
    o.code === '42703' ||
    /schema cache|does not exist|bucket not found/i.test(o.message ?? '')
  )
}

/** Mensaje para la persona que usa la app: claro y sin detalles técnicos. */
export function friendlyMessage(e: unknown): string {
  const msg = errorMessage(e).toLowerCase()
  const code = String((e as { code?: unknown } | null)?.code ?? '')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
  if (/failed to fetch|network|load failed|timeout|conexi/.test(msg)) return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.'
  if (/invalid login credentials/.test(msg)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/.test(msg)) return 'Confirma tu correo antes de iniciar sesión (revisa tu bandeja).'
  if (/user already registered/.test(msg)) return 'Ese correo ya tiene una cuenta. Inicia sesión.'
  if (/signups? not allowed|signup is disabled/.test(msg)) return 'El registro de cuentas nuevas está cerrado.'
  if (/password should be at least/.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.'
  if (/jwt|token|session|not authenticated|401/.test(msg) || code === 'PGRST301') return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  if (isMissingSchema(e)) return 'La app necesita una actualización de su base de datos. Avísale al administrador.'
  if (/quota/.test(msg)) return 'No hay espacio suficiente en este dispositivo para guardar eso.'
  if (/invalid input|violates|duplicate key|syntax/.test(msg)) return 'Hay un dato que no se pudo guardar. Revisa los valores e inténtalo de nuevo.'
  return 'Algo no salió bien. Inténtalo de nuevo.'
}
