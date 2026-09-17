<template>
  <section class="production-entry-step">
    <header class="production-mobile-heading">
      <span>01</span>
      <div>
        <h2>Materia prima</h2>
        <p>Revisa los ingresos disponibles antes de producir.</p>
      </div>
    </header>
    <div class="raw-material-compact">
      <div class="raw-material-table">
        <div class="raw-material-table-head">
          <span>Orden</span><span>Camión</span><span>Vía</span><span>Estado</span><span>Lote</span
          ><span>Aves origen</span><span>Aves planta</span><span>Neto granja</span
          ><span>Neto planta</span><span>Merma</span><span>Muertos</span><span>Decomisos</span
          ><span>Disponibles</span>
        </div>
        <template v-for="truck in activeTrucks" :key="truck.id">
          <div
            :class="[
              'raw-material-table-row',
              { 'raw-material-table-row--active': isTruckActionOpen(truck) },
            ]"
            @click="!readonly && toggleTruckActions(truck)"
          >
            <span data-label="Orden">{{ truckUseOrder(truck.id) }}</span>
            <div class="truck-cell">
              <span class="truck-avatar"><Truck :size="17" /></span>
              <strong>{{ truck.vehiculo?.chasis || 'Sin patente' }}</strong>
              <small>DTE {{ truck.comercial?.documentos?.dte || '-' }}</small>
            </div>
            <span data-label="Vía" :class="['status-pill', truckClassificationClass(truck)]">
              {{ truckClassificationLabel(truck) }}
            </span>
            <span data-label="Estado" :class="['status-pill', truckStatusClass(truck)]">
              {{ truckStatusLabel(truck) }}
            </span>
            <span data-label="Lote">{{ truck.comercial?.loteSenasa || '-' }}</span>
            <span data-label="Aves origen">{{ number(truck.aves?.origen) }}</span>
            <span data-label="Aves planta">{{ number(birdsFor(truck)) }}</span>
            <span data-label="Neto granja">{{ kg(metricsFor(truck).netoGranja) }}</span>
            <span data-label="Neto planta">{{ kg(metricsFor(truck).netoPlanta) }}</span>
            <span data-label="Merma">{{ kg(metricsFor(truck).diferenciaNetaGranjaPlanta) }}</span>
            <span data-label="Muertos">{{ number(truck.faena?.novedades?.muertas) }}</span>
            <span data-label="Decomisos">{{ number(confiscationsFor(truck)) }}</span>
            <strong data-label="Disponibles" class="available">{{
              number(availableForTruck(truck))
            }}</strong>
          </div>
          <div v-if="!readonly && isTruckActionOpen(truck)" class="raw-material-action-row">
            <div class="truck-inline-actions">
              <span>¿Qué querés hacer con este camión?</span>
              <button type="button" @click.stop="editTruck(truck, 1)">
                <Pencil :size="16" /> Modificar ingreso
              </button>
              <button type="button" @click.stop="editTruck(truck, 2)">
                <ClipboardCheck :size="16" /> Cargar faena
              </button>
            </div>
          </div>
        </template>
        <div class="raw-material-table-row raw-material-table-row--total">
          <span></span>
          <strong>Totales</strong>
          <span></span><span></span><span></span>
          <strong>{{ number(tableTotals.originBirds) }}</strong>
          <strong>{{ number(tableTotals.plantBirds) }}</strong>
          <strong>{{ kg(tableTotals.farmNetKg) }}</strong>
          <strong>{{ kg(tableTotals.plantNetKg) }}</strong>
          <strong>{{ kg(tableTotals.lossKg) }}</strong>
          <strong>{{ number(tableTotals.deaths) }}</strong>
          <strong>{{ number(tableTotals.confiscations) }}</strong>
          <strong class="available">{{ number(tableTotals.available) }}</strong>
        </div>
      </div>
      <dl class="production-entry-total">
        <div>
          <dt>Camiones</dt>
          <dd>{{ activeTrucks.length }}</dd>
        </div>
        <div>
          <dt>Aves</dt>
          <dd>{{ number(activeTotals.birds) }}</dd>
        </div>
        <div>
          <dt>Muertes + decomisos</dt>
          <dd>{{ number(activeTotals.deaths + activeTotals.confiscations) }}</dd>
        </div>
        <div class="available">
          <dt>Disponibles</dt>
          <dd>{{ number(activeTotals.available) }}</dd>
        </div>
      </dl>
    </div>
    <div v-if="!readonly" class="production-stage-actions">
      <button class="primary-action" type="button" @click="$emit('confirm')">
        Continuar <ArrowRight :size="17" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight, ClipboardCheck, Pencil, Truck } from '@lucide/vue'
import { computed, ref } from 'vue'
import {
  truckClassificationClass,
  truckClassificationLabel,
  truckStatusClass,
  truckStatusLabel,
} from '@/utils/balanza'
import { calculateTruckMetrics, formatKg } from '@/utils/truckCalculations'

const emit = defineEmits(['confirm', 'edit-truck'])
const expandedTruckId = ref('')
const props = defineProps({
  activeTrucks: { type: Array, required: true },
  activeTotals: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  number: { type: Function, required: true },
  birdsFor: { type: Function, required: true },
  confiscationsFor: { type: Function, required: true },
  availableForTruck: { type: Function, required: true },
  truckUseOrder: { type: Function, required: true },
})

const tableTotals = computed(() =>
  props.activeTrucks.reduce(
    (totals, truck) => {
      const metrics = metricsFor(truck)
      totals.originBirds += Number(truck.aves?.origen || 0)
      totals.plantBirds += Number(props.birdsFor(truck) || 0)
      totals.farmNetKg += metrics.netoGranja
      totals.plantNetKg += metrics.netoPlanta
      totals.lossKg += metrics.diferenciaNetaGranjaPlanta
      totals.deaths += Number(truck.faena?.novedades?.muertas || 0)
      totals.confiscations += Number(props.confiscationsFor(truck) || 0)
      totals.available += Number(props.availableForTruck(truck) || 0)
      return totals
    },
    {
      originBirds: 0,
      plantBirds: 0,
      farmNetKg: 0,
      plantNetKg: 0,
      lossKg: 0,
      deaths: 0,
      confiscations: 0,
      available: 0,
    },
  ),
)

function editTruck(truck, step) {
  expandedTruckId.value = ''
  emit('edit-truck', { truck, step })
}

function toggleTruckActions(truck) {
  const truckId = String(truck.id)
  expandedTruckId.value = expandedTruckId.value === truckId ? '' : truckId
}

function isTruckActionOpen(truck) {
  return expandedTruckId.value === String(truck.id)
}

function metricsFor(truck) {
  return calculateTruckMetrics(truck)
}

function kg(value) {
  return formatKg(value)
}
</script>
