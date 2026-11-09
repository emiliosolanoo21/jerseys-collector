import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { toast } from './lib/toast'
import { friendlyMessage } from './lib/errors'
import { initUi } from './lib/ui'
import '@fontsource/archivo-black/latin-400.css'
import './style.css'

const app = createApp(App).use(createPinia()).use(router)

// Ningún error se pierde en silencio: mensaje claro para la persona, detalle en la consola
const report = (e: unknown) => {
  console.error(e)
  toast(friendlyMessage(e), { kind: 'error', ms: 5000 })
}
app.config.errorHandler = report
window.addEventListener('unhandledrejection', (ev) => report(ev.reason))

initUi(router)
app.mount('#app')
