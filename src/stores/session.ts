import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { repo, supabase } from '@/lib/repo'
import { clearPhotoCache } from '@/lib/photos'
import { friendlyMessage } from '@/lib/errors'
import { useSettings } from './settings'
import { useGarments } from './garments'

/** Autenticación (solo en modo Supabase) y carga inicial de todos los datos. */
export const useSession = defineStore('session', () => {
  const session = ref<Session | null>(null)
  const ready = ref(false)
  const dataLoaded = ref(false)
  const error = ref<string | null>(null)

  async function init() {
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      supabase.auth.onAuthStateChange((_event, s) => {
        session.value = s
        if (!s) {
          dataLoaded.value = false
          useGarments().clear()
          clearPhotoCache()
        }
      })
    }
    ready.value = true
  }

  const isAuthenticated = () => repo.mode === 'local' || !!session.value

  // Una sola carga a la vez: dos navegaciones seguidas no deben repetirla
  let loading: Promise<void> | null = null
  function loadData() {
    if (dataLoaded.value) return Promise.resolve()
    loading ??= (async () => {
      error.value = null
      try {
        await Promise.all([useSettings().load(), useGarments().load()])
        dataLoaded.value = true
      } catch (e) {
        console.error(e)
        error.value = friendlyMessage(e)
        throw e
      } finally {
        loading = null
      }
    })()
    return loading
  }

  async function signIn(email: string, password: string) {
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password })
    if (err) throw err
  }

  async function signUp(email: string, password: string) {
    const { error: err } = await supabase!.auth.signUp({ email, password })
    if (err) throw err
  }

  async function signOut() {
    await supabase?.auth.signOut()
  }

  return { session, ready, dataLoaded, error, init, isAuthenticated, loadData, signIn, signUp, signOut }
})
