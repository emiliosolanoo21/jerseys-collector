<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { refreshUi } from '@/lib/ui'

/**
 * Hoja que sube desde abajo en el celular y se centra en la computadora.
 * Usa <dialog> nativo: atrapa el foco, cierra con Esc y con tocar el fondo.
 */
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
const el = ref<HTMLDialogElement | null>(null)

function sync() {
  const d = el.value
  if (!d) return
  if (props.open && !d.open) {
    d.showModal()
    refreshUi()
    nextTick(() => d.querySelector('.sheet-body')?.scrollTo(0, 0))
  } else if (!props.open && d.open) {
    d.close()
    refreshUi()
  }
}
onBeforeUnmount(() => {
  el.value?.close()
  setTimeout(refreshUi)
})
watch(() => props.open, sync)
onMounted(sync)

function onBackdrop(ev: MouseEvent) {
  if (ev.target === el.value) emit('close')
}
</script>

<template>
  <dialog ref="el" class="sheet" :aria-label="title" @cancel.prevent="emit('close')" @close="refreshUi" @click="onBackdrop">
    <div class="sheet-inner">
      <header class="sheet-head">
        <span class="grabber" aria-hidden="true" />
        <!-- El foco inicial va al título, no a la X (evita el contorno de foco al abrir) -->
        <h2 tabindex="-1" autofocus>{{ title }}</h2>
        <slot name="head" />
        <button class="ghost small" aria-label="Cerrar" @click="emit('close')"><X :size="20" /></button>
      </header>
      <div class="sheet-body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="sheet-foot">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.sheet {
  padding: 0;
  border: 0;
  margin: auto auto 0;
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  border-radius: 18px 18px 0 0;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 -8px 30px rgb(0 0 0 / 0.2);
}
.sheet[open] { animation: up 0.22s ease-out; }
.sheet::backdrop { background: rgb(0 0 0 / 0.45); }
.sheet-inner { display: flex; flex-direction: column; max-height: 92dvh; }
.sheet-head { position: relative; display: flex; align-items: center; gap: 4px; padding: 18px 12px 8px 18px; }
.sheet-head h2 { flex: 1; min-width: 0; font-size: 1.15rem; outline: none; overflow-wrap: anywhere; }
.grabber { position: absolute; top: 6px; left: 50%; translate: -50% 0; width: 40px; height: 4px; border-radius: 2px; background: var(--border); }
.sheet-body { overflow-y: auto; padding: 4px 18px 18px; display: flex; flex-direction: column; gap: 14px; overscroll-behavior: contain; }
.sheet-foot { padding: 12px 18px calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border); display: flex; gap: 8px; }
@keyframes up { from { transform: translateY(40px); opacity: 0; } }
@media (min-width: 700px) {
  .sheet { margin: auto; border-radius: 18px; }
  .grabber { display: none; }
}
/* Horizontal con poca altura: la hoja usa casi toda la altura y respeta la muesca */
@media (orientation: landscape) and (max-height: 540px) {
  .sheet, .sheet-inner { max-height: calc(100dvh - 16px); }
  .sheet-head { padding-top: 10px; }
  .sheet-body { padding-left: calc(18px + env(safe-area-inset-left)); padding-right: calc(18px + env(safe-area-inset-right)); }
}
</style>
