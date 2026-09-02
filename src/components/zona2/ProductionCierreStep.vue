<template>
  <section class="production-closure-step">
    <header class="production-mobile-heading">
      <span>04</span>
      <div><h2>Cierre y stock</h2><p>Verifica el resumen e identifica el lote terminado.</p></div>
    </header>
    <div class="closure-grid">
      <div class="closure-summary">
        <section class="closure-summary-section">
          <h3>Entrada</h3>
          <div class="closure-summary-row">
            <span>Aves ingresadas</span><strong>{{ number(activeTotals.birds) }}</strong>
          </div>
          <div class="closure-summary-row">
            <span>Muertos</span><strong>{{ number(activeTotals.deaths) }}</strong>
          </div>
          <div class="closure-summary-row">
            <span>Decomisos</span><strong>{{ number(activeTotals.confiscations) }}</strong>
          </div>
        </section>
        <section class="closure-summary-section">
          <h3>Consumo</h3>
          <div class="closure-summary-row">
            <span>Aves utilizadas</span><strong>{{ number(selectedConsumption) }}</strong>
          </div>
          <div class="closure-summary-row">
            <span>Aves restantes</span
            ><strong>{{ number(activeTotals.available - selectedConsumption) }}</strong>
          </div>
        </section>
        <section class="closure-summary-section">
          <h3>Producto terminado</h3>
          <div v-for="output in producedOutputs" :key="output.caliber" class="closure-summary-row">
            <span>Calibre {{ output.caliber }}</span><strong>{{ number(output.boxes) }} cajas</strong>
          </div>
          <div class="closure-summary-row closure-summary-row--total">
            <span>Total cajas</span><strong>{{ number(totalBoxes(production.outputs)) }}</strong>
          </div>
        </section>
      </div>
      <div class="finished-data">
        <h3>Identificación del lote</h3>
        <q-input
          :model-value="production.finished.lot"
          class="closure-input"
          outlined
          dense
          label="Lote"
          :readonly="production.status === 'completed'"
          @update:model-value="$emit('updateFinished', 'lot', $event)"
        />
        <q-input
          :model-value="production.finished.clientCode"
          class="closure-input"
          outlined
          dense
          label="Código de cliente"
          :readonly="production.status === 'completed'"
          @update:model-value="$emit('updateFinished', 'clientCode', $event)"
        />
        <DateInput
          :model-value="production.finished.manufactureDate"
          label="Fabricación"
          :readonly="production.status === 'completed'"
          @update:model-value="$emit('updateFinished', 'manufactureDate', $event)"
        />
        <DateInput
          :model-value="production.finished.expirationDate"
          label="Vencimiento"
          :readonly="production.status === 'completed'"
          @update:model-value="$emit('updateFinished', 'expirationDate', $event)"
        />
        <div class="stock-callout">
          <PackageCheck :size="22" />
          <div>
            <strong>Alta de stock automática</strong
            ><span
              >Se generarán {{ number(totalBoxes(production.outputs)) }} cajas trazadas al lote
              {{ production.finished.lot || '-' }}.</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="production-stage-actions">
      <button
        class="primary-action"
        type="button"
        :disabled="production.status === 'completed'"
        @click="$emit('closeProduction')"
      >
        <PackageCheck :size="17" />
        {{ production.status === 'completed' ? 'Producción cerrada' : 'Cerrar producción' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import DateInput from '@/components/DateInput.vue'
import { PackageCheck } from '@lucide/vue'

defineEmits(['closeProduction', 'updateFinished'])
defineProps({
  production: { type: Object, required: true },
  activeTotals: { type: Object, required: true },
  producedOutputs: { type: Array, required: true },
  selectedConsumption: { type: Number, required: true },
  number: { type: Function, required: true },
  totalBoxes: { type: Function, required: true },
})
</script>
