import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/lib/repo'
import type { Settings } from '@/types'

const DEFAULTS: Settings = { currency: 'GTQ' }

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>({ ...DEFAULTS })
  const currency = computed(() => settings.value.currency)

  async function load() {
    const stored = await repo.getSettings()
    settings.value = { ...DEFAULTS, ...(stored ?? {}) }
  }

  async function save(patch: Partial<Settings>) {
    settings.value = { ...settings.value, ...patch }
    await repo.saveSettings({ ...settings.value })
  }

  return { settings, currency, load, save }
})
