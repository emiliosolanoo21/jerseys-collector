<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Download, LogOut } from 'lucide-vue-next'
import { useSettings } from '@/stores/settings'
import { useSession } from '@/stores/session'
import { useGarments } from '@/stores/garments'
import { repo } from '@/lib/repo'
import { CURRENCIES } from '@/data/options'
import { isoDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import type { Currency } from '@/types'

const router = useRouter()
const settings = useSettings()
const session = useSession()
const store = useGarments()

async function setCurrency(ev: Event) {
  await settings.save({ currency: (ev.target as HTMLSelectElement).value as Currency })
  toast('Moneda guardada')
}

/** Respaldo de los datos en JSON. Las fotos no van incluidas. */
function exportData() {
  const data = { exported_at: new Date().toISOString(), settings: settings.settings, garments: store.items }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `vestuario-${isoDate()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function logout() {
  await session.signOut()
  router.push('/login')
}
</script>

<template>
  <main class="page">
    <header class="page-header"><h1>Ajustes</h1></header>

    <section class="card">
      <h2>Moneda</h2>
      <p class="small muted">Se usa para mostrar los precios de tus prendas.</p>
      <select :value="settings.currency" aria-label="Moneda" @change="setCurrency">
        <option v-for="c in CURRENCIES" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </section>

    <section class="card">
      <h2>Datos</h2>
      <p class="small muted">
        <template v-if="repo.mode === 'supabase'">Conectado: tu colección y tus fotos se sincronizan entre dispositivos.</template>
        <template v-else>Modo local: tu colección y tus fotos viven solo en este navegador.</template>
      </p>
      <button @click="exportData"><Download :size="18" aria-hidden="true" /> Descargar respaldo (sin fotos)</button>
      <button v-if="repo.mode === 'supabase'" class="danger" @click="logout"><LogOut :size="18" aria-hidden="true" /> Cerrar sesión</button>
    </section>
  </main>
</template>
