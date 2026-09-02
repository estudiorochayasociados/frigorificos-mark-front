<template>
  <q-input
    v-bind="$attrs"
    :model-value="modelValue"
    type="number"
    :min="minimum"
    :max="Number.isFinite(maximum) ? maximum : undefined"
    @update:model-value="updateValue"
  />
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  minimum: { type: Number, default: 0 },
  maximum: { type: Number, default: null },
})

const emit = defineEmits(['update:modelValue'])

function updateValue(value) {
  const number = Number(value)
  emit(
    'update:modelValue',
    Number.isFinite(number)
      ? Math.max(
          props.minimum,
          Number.isFinite(props.maximum) ? Math.min(props.maximum, number) : number,
        )
      : props.minimum,
  )
}
</script>
