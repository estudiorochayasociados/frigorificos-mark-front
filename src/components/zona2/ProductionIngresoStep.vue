<template>
  <section class="production-entry-step">
    <header class="production-mobile-heading">
      <span>01</span>
      <div><h2>Materia prima</h2><p>Revisa los ingresos disponibles antes de producir.</p></div>
    </header>
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
          <span data-label="Clasificación" :class="['status-pill', truckClassificationClass(truck)]">
            {{ truckClassificationLabel(truck) }}
          </span>
          <span data-label="Estado" :class="['status-pill', truckStatusClass(truck)]">
            {{ truckStatusLabel(truck) }}
          </span>
          <span data-label="Lote">{{ truck.loteSenasa || '-' }}</span>
          <strong data-label="Orden">{{ truckUseOrder(truck.id) }}</strong>
          <strong data-label="Aves">{{ number(birdsFor(truck)) }}</strong>
          <span data-label="Muertos">{{ number(truck.muertos) }}</span>
          <span data-label="Decomisos">{{ number(confiscationsFor(truck)) }}</span>
          <strong data-label="Disponibles" class="available">{{ number(availableForTruck(truck)) }}</strong>
        </div>
      </div>
      <dl class="production-entry-total">
        <div><dt>Camiones</dt><dd>{{ activeTrucks.length }}</dd></div>
        <div><dt>Aves</dt><dd>{{ number(activeTotals.birds) }}</dd></div>
        <div><dt>Bajas</dt><dd>{{ number(activeTotals.deaths + activeTotals.confiscations) }}</dd></div>
        <div class="available"><dt>Disponibles</dt><dd>{{ number(activeTotals.available) }}</dd></div>
      </dl>
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
