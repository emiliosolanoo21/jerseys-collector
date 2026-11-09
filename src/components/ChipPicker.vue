<script setup lang="ts" generic="T extends string">
/** Selección de una opción con un toque. Con `clearable`, tocar la elegida la quita. */
const props = defineProps<{
  modelValue: T | null
  options: { value: T; label: string }[]
  label: string
  clearable?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T | null] }>()

function pick(value: T) {
  emit('update:modelValue', props.clearable && props.modelValue === value ? null : value)
}
</script>

<template>
  <div class="picker" role="group" :aria-label="label">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="small"
      :class="{ primary: modelValue === o.value }"
      :aria-pressed="modelValue === o.value"
      @click="pick(o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.picker { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
