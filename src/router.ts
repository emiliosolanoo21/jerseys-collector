import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '@/stores/session'
import { editorDirty } from '@/lib/ui'

/** Posición de cada pestaña: al volver sigues donde ibas, no arriba de todo */
const tabScroll = new Map<string, number>()

export const router = createRouter({
  history: createWebHistory(),
  // Atrás/adelante = donde estabas. Misma pantalla (abrir una hoja) = no mover.
  // Pestaña ya visitada = su última posición. Pantalla nueva = arriba.
  scrollBehavior(to, from, saved) {
    if (to.path === from.path) return false
    if (saved) return saved
    const top = tabScroll.get(to.path)
    // Se espera un cuadro para que la pantalla ya tenga su altura completa
    return top ? new Promise((resolve) => requestAnimationFrame(() => resolve({ top }))) : { top: 0 }
  },
  routes: [
    { path: '/', name: 'coleccion', component: () => import('@/views/CollectionView.vue') },
    { path: '/favoritos', name: 'favoritos', component: () => import('@/views/FavoritesView.vue') },
    { path: '/deseos', name: 'deseos', component: () => import('@/views/WishlistView.vue') },
    { path: '/ajustes', name: 'ajustes', component: () => import('@/views/SettingsView.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Salir del formulario (X, fondo o «atrás» del teléfono) con cambios sin guardar pide confirmación
router.beforeEach((to, from) => {
  if (from.query.editar && !to.query.editar && editorDirty.value) {
    if (!confirm('¿Salir sin guardar los cambios?')) return false
    editorDirty.value = false
  }
  return true
})

router.beforeEach((_to, from) => {
  if (from.matched.length) tabScroll.set(from.path, window.scrollY)
})

router.beforeEach(async (to) => {
  const session = useSession()
  if (!session.ready) await session.init()
  if (to.meta.public) return true
  if (!session.isAuthenticated()) return { name: 'login' }
  try {
    await session.loadData()
  } catch {
    // El error se muestra en App.vue
  }
  return true
})
