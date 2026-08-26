<template>
  <section class="production-consumption-step">
    <div class="consumption-summary">
      <label>
        <span>Aves necesarias</span>
        <NonNegativeInput
          :model-value="production.requiredBirds"
          class="consumption-summary-input"
          :minimum="1"
          outlined
          dense
          @update:model-value="$emit('updateRequiredBirds', $event)"
          @change="$emit('applyFifo')"
        />
      </label>
      <div>
        <span>Seleccionadas</span><strong>{{ number(selectedConsumption) }}</strong>
      </div>
      <div :class="{ warning: consumptionDifference !== 0 }">
        <span>Diferencia</span><strong>{{ signedNumber(consumptionDifference) }}</strong>
      </div>
    </div>

    <div class="consumption-table">
      <div class="consumption-table-head">
        <span>Camión</span><span>Disponibles</span><span>Orden</span><span>Aves a utilizar</span>
      </div>
      <div v-for="truck in activeTrucks" :key="truck.id" class="consumption-table-row">
        <div class="consumption-truck">
          <span class="truck-avatar"><Truck :size="18" /></span>
          <div>
            <strong>{{ truck.chasis || 'Sin patente' }}</strong
            ><small>DTE {{ truck.dte || '-' }} · {{ truck.loteSenasa || 'Sin lote' }}</small>
          </div>
        </div>
        <span>{{ number(availableForTruck(truck)) }}</span>
        <span>{{ truckUseOrder(truck.id) }}</span>
        <NonNegativeInput
          :model-value="production.consumption[truck.id]"
          class="consumption-quantity-input"
          :max="availableForTruck(truck)"
          outlined
          dense
          @update:model-value="$emit('updateConsumption', truck.id, $event)"
        />
      </div>
      <div class="consumption-table-row consumption-table-row--total">
        <strong>Total</strong>
        <strong>{{ number(totalAvailable) }}</strong>
        <span></span>
        <strong>{{ number(selectedConsumption) }}</strong>
      </div>
    </div>

    <div class="production-stage-actions">
      <button class="primary-action" type="button" @click="$emit('confirmConsumption')">
        <CheckCircle2 :size="17" /> Confirmar consumo
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { CheckCircle2, Truck } from '@lucide/vue'

defineEmits(['applyFifo', 'confirmConsumption', 'updateConsumption', 'updateRequiredBirds'])
const props = defineProps({
  production: { type: Object, required: true },
  activeTrucks: { type: Array, required: true },
  selectedConsumption: { type: Number, required: true },
  consumptionDifference: { type: Number, required: true },
  number: { type: Function, required: true },
  signedNumber: { type: Function, required: true },
  availableForTruck: { type: Function, required: true },
  truckUseOrder: { type: Function, required: true },
})

const totalAvailable = computed(() =>
  props.activeTrucks.reduce((total, truck) => total + props.availableForTruck(truck), 0),
)
</script>
