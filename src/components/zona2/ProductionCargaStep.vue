<template>
  <section class="production-output-step">
    <header class="production-mobile-heading">
      <span>02</span>
      <div>
        <h2>Producción por calibre</h2>
        <p>Ingresá los cajones terminados y verificá las aves resultantes.</p>
      </div>
    </header>
    <div class="output-tables-grid">
      <section class="output-table-group">
        <div class="output-table-group-title">Cajas normales</div>
        <div class="output-table">
          <div class="output-table-head">
            <span>Cajones</span><span>Producción</span><span>Aves</span>
          </div>
          <div
            v-for="output in production.normalOutputs"
            :key="output.caliber"
            class="output-table-row"
          >
            <div class="output-quantity-cell">
              <NonNegativeInput
                :model-value="output.boxes"
                class="output-quantity-input"
                outlined
                dense
                :readonly="production.status === 'completed'"
                :aria-label="`Cajas normales, calibre ${output.caliber}`"
                @update:model-value="$emit('updateOutputBoxes', output.caliber, $event)"
              />
            </div>
            <div class="output-calculation">
              {{ number(output.boxes) }} cajones de calibre {{ output.caliber }}
            </div>
            <div :class="['output-birds-cell', { adjusted: hasManualOutputBirds(output) }]">
              <NonNegativeInput
                :model-value="outputBirds(output)"
                class="output-birds-input"
                outlined
                dense
                :readonly="production.status === 'completed'"
                :aria-label="`Aves, calibre ${output.caliber}`"
                @update:model-value="$emit('updateOutputBirds', 'normal', output.caliber, $event)"
              />
              <div class="output-birds-meta">
                <span class="output-birds-status">
                  {{
                    hasManualOutputBirds(output)
                      ? 'Manual'
                      : `Automático · ${output.caliber} x ${number(output.boxes)}`
                  }}
                </span>
                <button
                  v-if="hasManualOutputBirds(output) && production.status !== 'completed'"
                  class="output-recalculate-button"
                  type="button"
                  title="Volver al cálculo por calibre y cajones"
                  @click="$emit('resetOutputBirds', 'normal', output.caliber)"
                >
                  <RotateCcw :size="13" /> Usar cálculo
                </button>
              </div>
            </div>
          </div>
          <div class="output-table-row output-table-row--total">
            <span>Total</span
            ><strong>{{ number(totalBoxes(production.normalOutputs)) }} cajones</strong
            ><strong>{{ number(totalOutputBirds(production.normalOutputs)) }} aves</strong>
          </div>
        </div>
      </section>

      <section class="output-table-group">
        <div class="output-table-group-title" aria-label="Listado de cajas B por calibre">
          Cajas B
        </div>
        <div class="output-table output-table--b">
          <div class="output-table-head">
            <span>Cajones</span><span>Producción</span><span>Aves</span>
          </div>
          <div v-for="output in bOutputs" :key="output.caliber" class="output-table-row">
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
            <div class="output-calculation">
              {{ number(output.boxes) }} cajones de calibre {{ output.caliber }}
            </div>
            <div :class="['output-birds-cell', { adjusted: hasManualOutputBirds(output) }]">
              <NonNegativeInput
                :model-value="outputBirds(output)"
                class="output-birds-input"
                outlined
                dense
                :readonly="production.status === 'completed'"
                :aria-label="`Aves B, calibre ${output.caliber}`"
                @update:model-value="$emit('updateOutputBirds', 'b', output.caliber, $event)"
              />
              <div class="output-birds-meta">
                <span class="output-birds-status">
                  {{
                    hasManualOutputBirds(output)
                      ? 'Manual'
                      : `Automático · ${output.caliber} x ${number(output.boxes)}`
                  }}
                </span>
                <button
                  v-if="hasManualOutputBirds(output) && production.status !== 'completed'"
                  class="output-recalculate-button"
                  type="button"
                  title="Volver al cálculo por calibre y cajones"
                  @click="$emit('resetOutputBirds', 'b', output.caliber)"
                >
                  <RotateCcw :size="13" /> Usar cálculo
                </button>
              </div>
            </div>
          </div>
          <div class="output-table-row output-table-row--total">
            <span>Total</span><strong>{{ number(totalBoxes(bOutputs)) }} cajones</strong
            ><strong>{{ number(totalOutputBirds(bOutputs)) }} aves</strong>
          </div>
        </div>
      </section>

      <section class="output-table-group">
        <div
          class="output-table-group-title"
          aria-label="Listado de cajas B de pollo trozado por calibre"
        >
          Cajas B · Pollo trozado
        </div>
        <div class="output-table output-table--b">
          <div class="output-table-head">
            <span>Cajones</span><span>Producción</span><span>Aves</span>
          </div>
          <div v-for="output in bTrozadoOutputs" :key="output.caliber" class="output-table-row">
            <div class="output-quantity-cell">
              <NonNegativeInput
                :model-value="output.boxes"
                class="output-quantity-input"
                outlined
                dense
                :readonly="production.status === 'completed'"
                :aria-label="`Cajas B de pollo trozado, calibre ${output.caliber}`"
                @update:model-value="$emit('updateOutputBTrozadoBoxes', output.caliber, $event)"
              />
            </div>
            <div class="output-calculation">
              {{ number(output.boxes) }} cajones de calibre {{ output.caliber }}
            </div>
            <div :class="['output-birds-cell', { adjusted: hasManualOutputBirds(output) }]">
              <NonNegativeInput
                :model-value="outputBirds(output)"
                class="output-birds-input"
                outlined
                dense
                :readonly="production.status === 'completed'"
                :aria-label="`Aves B de pollo trozado, calibre ${output.caliber}`"
                @update:model-value="$emit('updateOutputBirds', 'bTrozado', output.caliber, $event)"
              />
              <div class="output-birds-meta">
                <span class="output-birds-status">
                  {{
                    hasManualOutputBirds(output)
                      ? 'Manual'
                      : `Automático · ${output.caliber} x ${number(output.boxes)}`
                  }}
                </span>
                <button
                  v-if="hasManualOutputBirds(output) && production.status !== 'completed'"
                  class="output-recalculate-button"
                  type="button"
                  title="Volver al cálculo por calibre y cajones"
                  @click="$emit('resetOutputBirds', 'bTrozado', output.caliber)"
                >
                  <RotateCcw :size="13" /> Usar cálculo
                </button>
              </div>
            </div>
          </div>
          <div class="output-table-row output-table-row--total">
            <span>Total</span><strong>{{ number(totalBoxes(bTrozadoOutputs)) }} cajones</strong
            ><strong>{{ number(totalOutputBirds(bTrozadoOutputs)) }} aves</strong>
          </div>
        </div>
      </section>

      <section class="output-table-group">
        <div class="output-table-group-title">Resumen de producción</div>
        <aside class="output-production-summary">
          <div class="output-summary-metrics">
            <div>
              <span>Cajones totales</span><strong>{{ number(totalOutputBoxes) }}</strong>
            </div>
            <div>
              <span>Aves totales</span><strong>{{ number(totalBirds) }}</strong>
            </div>
            <div>
              <span>Kilos totales</span><strong>{{ number(totalKilos) }} kg</strong>
            </div>
            <div>
              <span>Muertos</span><strong>{{ number(yieldSummary.muertos) }} aves</strong>
            </div>
            <div>
              <span>Decomisos</span><strong>{{ number(yieldSummary.decomisos) }} aves</strong>
            </div>
          </div>
          <div class="output-yield-head">
            <span></span><span>Camión</span><span>Faena</span><span>Rinde</span>
          </div>
          <div class="output-yield-row">
            <span>Total granja</span><strong>{{ number(yieldSummary.netoGranja) }} kg</strong
            ><strong>{{ number(totalKilos) }} kg</strong
            ><strong>{{ percentage(yieldSummary.rindeGranja) }}</strong>
          </div>
          <div class="output-yield-row">
            <span>Total planta</span><strong>{{ number(yieldSummary.netoPlanta) }} kg</strong
            ><strong>{{ number(totalKilos) }} kg</strong
            ><strong>{{ percentage(yieldSummary.rindePlanta) }}</strong>
          </div>
        </aside>
      </section>
    </div>

    <div v-if="production.status !== 'completed'" class="production-stage-actions">
      <button class="primary-action" type="button" @click="$emit('confirmOutput')">
        Confirmar producción <ArrowRight :size="17" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { ArrowRight, RotateCcw } from '@lucide/vue'
import {
  DEFAULT_CALIBERS,
  hasManualOutputBirds,
  KILOS_POR_CAJA_RENDE,
  outputBirds,
  totalOutputBirds,
} from '@/utils/production'

defineEmits([
  'confirmOutput',
  'resetOutputBirds',
  'updateOutputBBoxes',
  'updateOutputBTrozadoBoxes',
  'updateOutputBirds',
  'updateOutputBoxes',
])
const props = defineProps({
  production: { type: Object, required: true },
  number: { type: Function, required: true },
  percentage: { type: Function, required: true },
  totalBoxes: { type: Function, required: true },
  yieldSummary: { type: Object, required: true },
})

const bOutputs = computed(() =>
  props.production.bOutputs?.length
    ? props.production.bOutputs
    : DEFAULT_CALIBERS.map((caliber) => ({ caliber, boxes: 0 })),
)

const bTrozadoOutputs = computed(() =>
  props.production.bTrozadoOutputs?.length
    ? props.production.bTrozadoOutputs
    : DEFAULT_CALIBERS.map((caliber) => ({ caliber, boxes: 0 })),
)

const totalOutputBoxes = computed(
  () =>
    props.totalBoxes(props.production.normalOutputs) +
    props.totalBoxes(bOutputs.value) +
    props.totalBoxes(bTrozadoOutputs.value),
)
const totalBirds = computed(
  () =>
    totalOutputBirds(props.production.normalOutputs) +
    totalOutputBirds(bOutputs.value) +
    totalOutputBirds(bTrozadoOutputs.value),
)
const totalKilos = computed(() => totalOutputBoxes.value * KILOS_POR_CAJA_RENDE)
</script>
