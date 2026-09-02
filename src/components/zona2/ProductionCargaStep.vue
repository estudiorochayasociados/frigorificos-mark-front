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
      <div class="output-table-head"><span>Calibre</span><span>Cajas producidas</span></div>
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
            :aria-label="`Cajas producidas, calibre ${output.caliber}`"
            @update:model-value="$emit('updateOutputBoxes', output.caliber, $event)"
          />
        </div>
      </div>
      <div class="output-table-row output-table-row--total">
        <span>Total cajas</span><strong>{{ number(totalBoxes(production.outputs)) }}</strong>
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
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { ArrowRight } from '@lucide/vue'

defineEmits(['confirmOutput', 'updateOutputBoxes', 'updateProduct'])
defineProps({
  production: { type: Object, required: true },
  productOptions: { type: Array, required: true },
  number: { type: Function, required: true },
  totalBoxes: { type: Function, required: true },
})
</script>
