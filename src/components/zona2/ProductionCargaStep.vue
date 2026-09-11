<template>
  <section class="production-output-step">
    <header class="production-mobile-heading">
      <span>02</span>
      <div><h2>Producción por calibre</h2><p>Registra únicamente las cajas terminadas.</p></div>
    </header>
    <div class="production-step-toolbar">
      <q-select
        :model-value="production.product"
        outlined
        dense
        :options="productOptions"
        label="Producto"
        @update:model-value="$emit('updateProduct', $event)"
      />
    </div>

    <div class="output-table">
      <div class="output-table-head"><span>Calibre</span><span>Cajas normales</span></div>
      <div v-for="output in production.outputs" :key="output.caliber" class="output-table-row">
        <div>
          <span class="output-caliber-label">Calibre {{ output.caliber }}</span>
        </div>
        <div class="output-quantity-cell">
          <NonNegativeInput
            :model-value="output.boxes"
            class="output-quantity-input"
            outlined
            dense
            :aria-label="`Cajas normales, calibre ${output.caliber}`"
            @update:model-value="$emit('updateOutputBoxes', output.caliber, $event)"
          />
        </div>
      </div>
      <div class="output-table-row output-table-row--total">
        <span>Total cajas</span><strong>{{ number(totalBoxes(production.outputs)) }}</strong>
      </div>
    </div>

    <div class="output-table-group-title" aria-label="Listado de cajas B por calibre">
      Cajas B
    </div>
    <div class="output-table output-table--b">
      <div class="output-table-head"><span>Calibre</span><span>Cajas B</span></div>
      <div v-for="output in bOutputs" :key="output.caliber" class="output-table-row">
        <div>
          <span class="output-caliber-label">Calibre {{ output.caliber }}</span>
        </div>
        <div class="output-quantity-cell">
          <NonNegativeInput
            :model-value="output.boxes"
            class="output-quantity-input"
            outlined
            dense
            :readonly="production.status === 'completed'"
            :aria-label="`Cajas B, calibre ${output.caliber}`"
            @update:model-value="$emit('updateOutputBBoxes', output.caliber, $event)"
          />
        </div>
      </div>
      <div class="output-table-row output-table-row--total">
        <span>Total cajas B</span><strong>{{ number(totalBoxes(bOutputs)) }}</strong>
      </div>
    </div>

    <div class="production-stage-actions">
      <button class="primary-action" type="button" @click="$emit('confirmOutput')">
        Confirmar producción <ArrowRight :size="17" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { ArrowRight } from '@lucide/vue'
import { DEFAULT_CALIBERS } from '@/utils/production'

defineEmits([
  'confirmOutput',
  'updateOutputBBoxes',
  'updateOutputBoxes',
  'updateProduct',
])
const props = defineProps({
  production: { type: Object, required: true },
  productOptions: { type: Array, required: true },
  number: { type: Function, required: true },
  totalBoxes: { type: Function, required: true },
})

const bOutputs = computed(() =>
  DEFAULT_CALIBERS.map(
    (caliber) =>
      props.production.outputsB?.find((output) => output.caliber === caliber) || {
        caliber,
        boxes: 0,
      },
  ),
)
</script>
