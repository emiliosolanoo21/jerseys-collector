<script setup lang="ts">
import { dismiss, toasts } from '@/lib/toast'
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">
      <span class="grow">{{ t.text }}</span>
      <button v-if="t.action" class="small ghost action" @click="t.action.run(); dismiss(t.id)">{{ t.action.label }}</button>
    </div>
  </div>
</template>

<style scoped>
/* En el celular va por encima del botón de agregar, para no taparlo */
.toasts {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(140px + var(--nav-lift) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  pointer-events: none;
  z-index: 30;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(100%, 420px);
  background: var(--text);
  color: var(--bg);
  padding: 8px 8px 8px 14px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);
  font-size: 0.9rem;
  min-height: 44px;
  animation: rise 0.18s ease-out;
}
.toast.error { background: var(--bad); color: var(--surface); }
.action { color: inherit; font-weight: 700; text-decoration: underline; }
@keyframes rise { from { transform: translateY(8px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
@media (min-width: 900px) { .toasts { bottom: 24px; } }
@media (orientation: landscape) and (max-height: 540px) {
  .toasts { bottom: calc(16px + env(safe-area-inset-bottom)); padding-left: calc(88px + env(safe-area-inset-left)); padding-right: 120px; }
}
</style>
