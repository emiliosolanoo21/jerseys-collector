<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '@/stores/session'
import { repo } from '@/lib/repo'
import BrandMark from '@/components/BrandMark.vue'
import { friendlyMessage } from '@/lib/errors'

const router = useRouter()
const session = useSession()

const email = ref('')
const password = ref('')
const mode = ref<'in' | 'up'>('in')
const busy = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

if (repo.mode === 'local') router.replace('/')

async function submit() {
  busy.value = true
  error.value = null
  message.value = null
  try {
    if (mode.value === 'in') {
      await session.signIn(email.value, password.value)
      router.replace('/')
    } else {
      await session.signUp(email.value, password.value)
      message.value = 'Cuenta creada. Si te pedimos confirmar el correo, revisa tu bandeja y luego inicia sesión.'
      mode.value = 'in'
    }
  } catch (e) {
    console.error(e)
    error.value = friendlyMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page login">
    <div class="brand">
      <BrandMark :size="72" />
      <h1 class="wordmark">Vestuario</h1>
      <p class="muted">Tu colección de camisolas, siempre a la mano.</p>
    </div>
    <form class="card" @submit.prevent="submit">
      <h2>{{ mode === 'in' ? 'Iniciar sesión' : 'Crear cuenta' }}</h2>
      <label class="field">Correo<input v-model="email" type="email" autocomplete="email" required /></label>
      <label class="field">Contraseña
        <input v-model="password" type="password" :autocomplete="mode === 'in' ? 'current-password' : 'new-password'" minlength="6" required />
      </label>
      <p v-if="error" class="error-banner" role="alert">{{ error }}</p>
      <p v-if="message" class="small muted" role="status">{{ message }}</p>
      <button class="primary block" type="submit" :disabled="busy">{{ busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta' }}</button>
      <button type="button" class="ghost small" @click="mode = mode === 'in' ? 'up' : 'in'">
        {{ mode === 'in' ? '¿Primera vez? Crear cuenta' : 'Ya tengo cuenta' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login { max-width: 420px; padding-top: 12vh; margin-left: auto; margin-right: auto; }
.brand { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.login .wordmark { font-size: 2.1rem; }
</style>
