<template>
  <section class="production-closure-step">
    <header class="production-mobile-heading">
      <span>03</span>
      <div>
        <h2>Cierre y stock</h2>
        <p>Verifica el resumen e identifica el lote terminado.</p>
      </div>
    </header>

    <div class="closure-grid">
      <div class="closure-results">
        <div class="closure-output-tables">
          <div class="output-table closure-output-table">
            <div class="output-table-head">
              <span>Cajones</span><span>Producción</span><span>Aves</span>
            </div>
      <section class="output-table-group">
        <div class="closure-output-section-title">Cajas normales</div>
          <div v-for="output in producedOutputs" :key="output.caliber" class="output-table-row">
            <strong class="closure-output-quantity">{{ number(output.boxes) }}</strong>
            <div class="output-calculation">
              {{ number(output.boxes) }} cajones de calibre {{ output.caliber }}
            </div>
            <strong class="closure-output-birds">{{ number(outputBirds(output)) }} aves</strong>
          </div>
          <div class="output-table-row output-table-row--total">
            <span>Total</span><strong>{{ number(totalBoxes(production.normalOutputs)) }} cajones</strong
            ><strong>{{ number(totalOutputBirds(production.normalOutputs)) }} aves</strong>
          </div>
      </section>

      <section class="output-table-group">
        <div class="closure-output-section-title">Cajas B</div>
          <div v-for="output in producedOutputsB" :key="output.caliber" class="output-table-row">
            <strong class="closure-output-quantity">{{ number(output.boxes) }}</strong>
            <div class="output-calculation">
              {{ number(output.boxes) }} cajones de calibre B {{ output.caliber }}
            </div>
            <strong class="closure-output-birds">{{ number(outputBirds(output)) }} aves</strong>
          </div>
          <div class="output-table-row output-table-row--total">
            <span>Total</span><strong>{{ number(totalBoxes(production.bOutputs)) }} cajones</strong
            ><strong>{{ number(totalOutputBirds(production.bOutputs)) }} aves</strong>
          </div>
      </section>

      <section class="output-table-group">
        <div class="closure-output-section-title">Cajas B · Pollo trozado</div>
          <div v-for="output in producedOutputsBTrozado" :key="output.caliber" class="output-table-row">
            <strong class="closure-output-quantity">{{ number(output.boxes) }}</strong>
            <div class="output-calculation">
              {{ number(output.boxes) }} cajones de calibre B {{ output.caliber }}
            </div>
            <strong class="closure-output-birds">{{ number(outputBirds(output)) }} aves</strong>
          </div>
          <div class="output-table-row output-table-row--total">
            <span>Total</span><strong>{{ number(totalBoxes(production.bTrozadoOutputs)) }} cajones</strong
            ><strong>{{ number(totalOutputBirds(production.bTrozadoOutputs)) }} aves</strong>
          </div>
      </section>
            <div class="output-table-row output-table-row--grand-total">
              <span>Total producción</span>
              <strong>
                {{
                  number(
                    totalBoxes([
                      ...production.normalOutputs,
                      ...production.bOutputs,
                      ...production.bTrozadoOutputs,
                    ]),
                  )
                }}
                cajones
              </strong>
              <strong>
                {{
                  number(
                    totalOutputBirds([
                      ...production.normalOutputs,
                      ...production.bOutputs,
                      ...production.bTrozadoOutputs,
                    ]),
                  )
                }}
                aves
              </strong>
            </div>
          </div>
        </div>

        <div class="closure-summary">
        <section class="closure-summary-section">
          <h3>Entrada</h3>
          <div class="closure-summary-row">
            <span>Muertos</span><strong>{{ number(activeTotals.deaths) }}</strong>
          </div>
          <div class="closure-summary-row">
            <span>Decomisos</span><strong>{{ number(activeTotals.confiscations) }}</strong>
          </div>
        </section>
        <section class="closure-summary-section">
          <h3>Rinde</h3>
          <div class="closure-summary-row">
            <span>Kg totales</span><strong>{{ number(yieldSummary.faenaKg) }} kg</strong>
          </div>
          <div class="closure-summary-row">
            <span>Neto granja</span><strong>{{ number(yieldSummary.netoGranja) }} kg</strong>
          </div>
          <div class="closure-summary-row closure-summary-row--total">
            <span>Rinde granja</span><strong>{{ percentage(yieldSummary.rindeGranja) }}</strong>
          </div>
          <div class="closure-summary-row">
            <span>Neto planta</span><strong>{{ number(yieldSummary.netoPlanta) }} kg</strong>
          </div>
          <div class="closure-summary-row closure-summary-row--total">
            <span>Rinde planta</span><strong>{{ percentage(yieldSummary.rindePlanta) }}</strong>
          </div>
        </section>
        </div>
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
              >Se generarán {{ number(totalBoxes(production.normalOutputs)) }} cajas normales y
              {{ number(totalBoxes(production.bOutputs)) }} cajas B y
              {{ number(totalBoxes(production.bTrozadoOutputs)) }} cajas B de pollo trozado,
              trazadas al lote {{ production.finished.lot || '-' }}.</span
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
import { outputBirds, totalOutputBirds } from '@/utils/production'

defineEmits(['closeProduction', 'updateFinished'])
defineProps({
  production: { type: Object, required: true },
  activeTotals: { type: Object, required: true },
  producedOutputs: { type: Array, required: true },
  producedOutputsB: { type: Array, required: true },
  producedOutputsBTrozado: { type: Array, required: true },
  selectedConsumption: { type: Number, required: true },
  yieldSummary: { type: Object, required: true },
  number: { type: Function, required: true },
  percentage: { type: Function, required: true },
  totalBoxes: { type: Function, required: true },
})
</script>
