<template>
  <q-input
    v-bind="$attrs"
    :model-value="modelValue"
    type="number"
    :min="minimum"
    @update:model-value="updateValue"
  />
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  minimum: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue'])

function updateValue(value) {
  const number = Number(value)
  emit(
    'update:modelValue',
    Number.isFinite(number) ? Math.max(props.minimum, number) : props.minimum,
  )
}
</script>
