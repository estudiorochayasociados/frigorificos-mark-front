<template>
  <q-input
    :model-value="modelValue"
    :label="label"
    :dense="dense"
    :outlined="outlined"
    readonly
    :disable="disable"
    :class="$attrs.class"
  >
    <template #append>
      <CalendarDays :size="18" />
      <q-popup-proxy
        v-if="!readonly && !disable"
        cover
        transition-show="scale"
        transition-hide="scale"
      >
        <q-date
          :model-value="modelValue"
          mask="YYYY-MM-DD"
          @update:model-value="$emit('update:modelValue', $event)"
        >
          <div class="row items-center justify-end">
            <q-btn v-close-popup flat label="OK" color="primary" />
          </div>
        </q-date>
      </q-popup-proxy>
    </template>
  </q-input>
</template>

<script setup>
import { CalendarDays } from '@lucide/vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Fecha' },
  dense: { type: Boolean, default: true },
  outlined: { type: Boolean, default: true },
  readonly: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>
