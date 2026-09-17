<template>
  <section class="production-consumption-step">
    <header class="production-mobile-heading">
      <span>03</span>
      <div>
        <h2>Consumo de aves</h2>
        <p>Confirma la cantidad consumida de cada camión.</p>
      </div>
    </header>
    <div class="consumption-planner">
      <div class="consumption-planner-control">
        <div class="consumption-planner-copy">
          <h3 class="consumption-planner-title">Aves a utilizar</h3>
          <p class="consumption-planner-subtitle">
            Total calculado en producción. Asigná la cantidad consumida de cada camión.
          </p>
        </div>
        <NonNegativeInput
          :model-value="production.requiredBirds"
          class="consumption-required-input"
          :minimum="1"
          :maximum="totalAvailable"
          outlined
          dense
          readonly
        />
      </div>
      <div class="consumption-allocation-status">
        <div class="consumption-allocation-metrics">
          <div>
            <span>Disponibles</span><strong>{{ number(totalAvailable) }}</strong>
          </div>
          <div>
            <span>Asignadas</span><strong>{{ number(selectedConsumption) }}</strong>
          </div>
          <div>
            <span>Pendientes</span><strong>{{ number(pendingBirds) }}</strong>
          </div>
        </div>
        <div class="consumption-progress" aria-hidden="true">
          <span :style="{ width: `${allocationPercentage}%` }"></span>
        </div>
        <p :class="['consumption-status-message', { ready: canConfirm }]">
          <CheckCircle2 v-if="canConfirm" :size="16" />
          <AlertCircle v-else :size="16" />
          {{ allocationMessage }}
        </p>
      </div>
    </div>

    <div class="consumption-table">
      <div class="consumption-table-head">
        <span>Orden</span><span>Camión</span><span>Disponibles</span><span>Asignación</span>
      </div>
      <div v-for="truck in activeTrucks" :key="truck.id" class="consumption-table-row">
        <span data-label="Orden">{{ truckUseOrder(truck.id) }}</span>
        <div class="consumption-truck">
          <span class="truck-avatar"><Truck :size="18" /></span>
          <div>
            <strong>{{ truck.chasis || 'Sin patente' }}</strong
            ><small>DTE {{ truck.dte || '-' }} · {{ truck.loteSenasa || 'Sin lote' }}</small>
          </div>
        </div>
        <span data-label="Disponibles">{{ number(availableForTruck(truck)) }}</span>
        <NonNegativeInput
          :model-value="consumptionFor(truck.id)"
          class="consumption-quantity-input"
          :maximum="availableForTruck(truck)"
          outlined
          dense
          @update:model-value="$emit('updateConsumption', truck.id, $event)"
        />
      </div>
      <div class="consumption-table-row consumption-table-row--total">
        <span></span>
        <strong>Total</strong>
        <strong>{{ number(totalAvailable) }}</strong>
        <strong>{{ number(selectedConsumption) }}</strong>
      </div>
    </div>

    <div class="production-stage-actions">
      <span v-if="!canConfirm" class="consumption-confirm-hint"
        >Completá la asignación para continuar.</span
      >
      <button
        class="primary-action"
        type="button"
        :disabled="!canConfirm"
        @click="$emit('confirmConsumption')"
      >
        <CheckCircle2 :size="17" /> Confirmar consumo
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { AlertCircle, CheckCircle2, Truck } from '@lucide/vue'

defineEmits(['confirmConsumption', 'updateConsumption'])
const props = defineProps({
  production: { type: Object, required: true },
  activeTrucks: { type: Array, required: true },
  selectedConsumption: { type: Number, required: true },
  consumptionDifference: { type: Number, required: true },
  number: { type: Function, required: true },
  availableForTruck: { type: Function, required: true },
  truckUseOrder: { type: Function, required: true },
})

const totalAvailable = computed(() =>
  props.activeTrucks.reduce((total, truck) => total + props.availableForTruck(truck), 0),
)
function consumptionFor(truckId) {
  return props.production.consumption.find((item) => item.truckId === truckId)?.birds || 0
}
const requiredBirds = computed(() => Math.max(0, Number(props.production.requiredBirds || 0)))
const pendingBirds = computed(() => Math.abs(requiredBirds.value - props.selectedConsumption))
const allocationPercentage = computed(() => {
  if (!requiredBirds.value) return 0
  return Math.min(100, Math.round((props.selectedConsumption / requiredBirds.value) * 100))
})
const canConfirm = computed(
  () =>
    Number.isInteger(requiredBirds.value) &&
    requiredBirds.value > 0 &&
    props.consumptionDifference === 0,
)
const allocationMessage = computed(() => {
  if (canConfirm.value) return 'Asignación completa. Ya podés confirmar el consumo.'
  if (props.consumptionDifference < 0)
    return `Faltan asignar ${props.number(pendingBirds.value)} aves.`
  if (props.consumptionDifference > 0)
    return `Hay ${props.number(pendingBirds.value)} aves asignadas de más.`
  return 'Ingresá una cantidad válida de aves a procesar.'
})
</script>
