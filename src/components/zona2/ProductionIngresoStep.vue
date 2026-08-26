<template>
  <section class="production-entry-step">
    <div class="raw-material-compact">
      <div class="raw-material-table">
        <div class="raw-material-table-head">
          <span>Camión</span><span>Clasificación</span><span>Estado</span><span>Lote</span
          ><span>Orden</span><span>Aves</span><span>Muertos</span><span>Decomisos</span
          ><span>Disponibles</span>
        </div>
        <div v-for="truck in activeTrucks" :key="truck.id" class="raw-material-table-row">
          <div>
            <span class="truck-avatar"><Truck :size="17" /></span>
            <strong>{{ truck.chasis || 'Sin patente' }}</strong>
            <small>DTE {{ truck.dte || '-' }}</small>
          </div>
          <span :class="['status-pill', truckClassificationClass(truck)]">
            {{ truckClassificationLabel(truck) }}
          </span>
          <span :class="['status-pill', truckStatusClass(truck)]">
            {{ truckStatusLabel(truck) }}
          </span>
          <span>{{ truck.loteSenasa || '-' }}</span>
          <strong>{{ truckUseOrder(truck.id) }}</strong>
          <strong>{{ number(birdsFor(truck)) }}</strong>
          <span>{{ number(truck.muertos) }}</span>
          <span>{{ number(confiscationsFor(truck)) }}</span>
          <strong class="available">{{ number(availableForTruck(truck)) }}</strong>
        </div>
        <div class="raw-material-table-row raw-material-table-row--total">
          <div>
            <strong>Total</strong>
            <small>{{ activeTrucks.length }} camión{{ activeTrucks.length === 1 ? '' : 'es' }}</small>
          </div>
          <strong>{{ number(activeTotals.birds) }}</strong>
          <strong>{{ number(activeTotals.deaths) }}</strong>
          <strong>{{ number(activeTotals.confiscations) }}</strong>
          <strong class="available">{{ number(activeTotals.available) }}</strong>
        </div>
      </div>
    </div>
    <div class="production-stage-actions">
      <button class="primary-action" type="button" @click="$emit('confirm')">
        Continuar <ArrowRight :size="17" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight, Truck } from '@lucide/vue'
import {
  truckClassificationClass,
  truckClassificationLabel,
  truckStatusClass,
  truckStatusLabel,
} from '@/utils/balanza'

defineEmits(['confirm'])
defineProps({
  activeTrucks: { type: Array, required: true },
  activeTotals: { type: Object, required: true },
  number: { type: Function, required: true },
  birdsFor: { type: Function, required: true },
  confiscationsFor: { type: Function, required: true },
  availableForTruck: { type: Function, required: true },
  truckUseOrder: { type: Function, required: true },
})
</script>
