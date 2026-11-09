<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Heart, Settings, Shirt, Star } from 'lucide-vue-next'
import { useSession } from '@/stores/session'
import { hideChrome } from '@/lib/ui'
import BrandMark from '@/components/BrandMark.vue'
import ToastHost from '@/components/ToastHost.vue'
import GarmentSheet from '@/components/GarmentSheet.vue'
import GarmentEditor from '@/components/GarmentEditor.vue'

const route = useRoute()
const session = useSession()

const tabs = [
  { to: '/', label: 'Colección', icon: Shirt },
  { to: '/favoritos', label: 'Favoritos', icon: Star },
  { to: '/deseos', label: 'Deseos', icon: Heart },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

const showNav = computed(() => !route.meta.public)
const loading = computed(() => !route.meta.public && !session.dataLoaded && !session.error)
</script>

<template>
  <div v-if="session.error" class="page" style="padding-bottom: 0">
    <div class="error-banner">{{ session.error }}</div>
  </div>
  <div v-if="loading" class="loading" role="status">
    <span class="spinner" aria-hidden="true" />
    Cargando tu colección…
  </div>
  <RouterView v-else />
  <ToastHost />
  <template v-if="session.dataLoaded">
    <GarmentSheet />
    <GarmentEditor />
  </template>
  <!-- Al escribir o con una hoja abierta (celular) la barra se oculta en vez de saltar sobre el teclado -->
  <nav v-if="showNav" v-show="!hideChrome" class="tabbar" aria-label="Secciones">
    <RouterLink to="/" class="rail-brand" aria-label="Vestuario, inicio">
      <BrandMark :size="40" />
    </RouterLink>
    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab" :class="{ active: route.path === t.to }">
      <component :is="t.icon" :size="22" :stroke-width="route.path === t.to ? 2.4 : 1.8" aria-hidden="true" />
      <span>{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 6px calc(4px + env(safe-area-inset-right)) calc(6px + var(--nav-lift) + env(safe-area-inset-bottom)) calc(4px + env(safe-area-inset-left));
  z-index: 10;
}
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 0.7rem;
  color: var(--text-3);
  text-decoration: none;
  padding: 4px 0;
  border-radius: 8px;
}
.tab.active { color: var(--accent); font-weight: 600; }
.rail-brand { display: none; }
.loading { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-2); }
.spinner { width: 28px; height: 28px; border-radius: 50%; border: 3px solid var(--surface-2); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 3s; } }

/* Computadora: la barra pasa a ser un riel lateral */
@media (min-width: 900px) {
  .tabbar {
    top: 0;
    right: auto;
    width: 96px;
    grid-template-columns: 1fr;
    grid-auto-rows: min-content;
    gap: 6px;
    padding: 20px 8px;
    border-top: 0;
    border-right: 1px solid var(--border);
  }
  .rail-brand { display: grid; place-items: center; padding-bottom: 14px; }
  .tab { padding: 10px 0; font-size: 0.75rem; }
  .tab:hover { background: var(--surface-2); color: var(--text); }
  .tab.active { background: var(--accent-soft); }
}

/* Celular en horizontal: poca altura → riel lateral compacto en vez de barra inferior */
@media (orientation: landscape) and (max-height: 540px) {
  .tabbar {
    top: 0;
    bottom: 0;
    right: auto;
    width: calc(72px + env(safe-area-inset-left));
    grid-template-columns: 1fr;
    grid-auto-rows: min-content;
    align-content: center;
    gap: 2px;
    padding: calc(6px + env(safe-area-inset-top)) 6px calc(6px + env(safe-area-inset-bottom)) calc(6px + env(safe-area-inset-left));
    border-top: 0;
    border-right: 1px solid var(--border);
    overflow-y: auto;
  }
  .rail-brand { display: none; }
  /* El riel no salta con el teclado: se queda visible aunque escribas (gana a v-show) */
  .tabbar[style*='display: none'] { display: grid !important; }
  .tab { padding: 5px 0; font-size: 0.66rem; }
  .tab.active { background: var(--accent-soft); }
}
</style>
