<template>
  <q-page class="page-shell">
    <div class="page-content production-page">
      <template v-if="activeProduction">
        <header class="production-flow-header">
          <button class="production-back" type="button" @click="goToDashboard">
            <ArrowLeft :size="18" /> Volver
          </button>
          <div class="production-flow-title">
            <span class="truck-avatar"><Truck :size="19" /></span>
            <div>
              <h1>{{ activeProduction.brand }}</h1>
              <small>Paso {{ currentStepMeta.number }} de {{ flowSteps.length }} · {{ currentStepMeta.label }}</small>
            </div>
          </div>
        </header>

        <nav class="production-steps" aria-label="Etapas de producción">
          <button
            v-for="step in flowSteps"
            :key="step.value"
            type="button"
            :class="{ active: currentStep === step.value, done: isStepDone(step.value) }"
            :disabled="!canOpenStep(step.value)"
            @click="goToStep(step.value)"
          >
            <span>{{ step.number }}</span>
            <small>{{ step.label }}</small>
          </button>
        </nav>

        <ProductionIngresoStep
          v-if="currentStep === 'ingreso'"
          :active-trucks="activeTrucks"
          :active-totals="activeTotals"
          :number="number"
          :birds-for="birdsFor"
          :confiscations-for="confiscationsFor"
          :available-for-truck="availableForTruck"
          :truck-use-order="truckUseOrder"
          @confirm="confirmEntry"
        />

        <ProductionCargaStep
          v-if="currentStep === 'carga'"
          :production="activeProduction"
          :product-options="productOptions"
          :number="number"
          :total-boxes="totalBoxes"
          @confirm-output="confirmOutput"
          @update-output-boxes="updateOutputBoxes"
          @update-product="updateProduct"
        />

        <ProductionConsumoStep
          v-if="currentStep === 'consumo'"
          :production="activeProduction"
          :active-trucks="activeTrucks"
          :selected-consumption="selectedConsumption"
          :consumption-difference="consumptionDifference"
          :number="number"
          :signed-number="signedNumber"
          :available-for-truck="availableForTruck"
          :truck-use-order="truckUseOrder"
          @apply-fifo="applyFifo"
          @confirm-consumption="confirmConsumption"
          @update-consumption="updateConsumption"
          @update-required-birds="updateRequiredBirds"
        />

        <ProductionCierreStep
          v-if="currentStep === 'cierre'"
          :production="activeProduction"
          :active-totals="activeTotals"
          :produced-outputs="producedOutputs"
          :selected-consumption="selectedConsumption"
          :number="number"
          :total-boxes="totalBoxes"
          @close-production="closeProduction"
          @update-finished="updateFinished"
        />
      </template>

      <section v-else class="data-card production-empty">
        <Truck :size="36" />
        <strong>Producción no encontrada</strong>
        <span>Volvé al listado y seleccioná una marca comercial.</span>
        <button class="secondary-action" type="button" @click="goToDashboard">Volver</button>
      </section>
    </div>

    <div v-if="feedback.message" :class="['feedback-toast', `feedback-toast--${feedback.type}`]">
      <AlertCircle v-if="feedback.type === 'error'" :size="19" />
      <CheckCircle2 v-else :size="19" />
      <span>{{ feedback.message }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductionCargaStep from '@/components/zona2/ProductionCargaStep.vue'
import ProductionCierreStep from '@/components/zona2/ProductionCierreStep.vue'
import ProductionConsumoStep from '@/components/zona2/ProductionConsumoStep.vue'
import ProductionIngresoStep from '@/components/zona2/ProductionIngresoStep.vue'
import { AlertCircle, ArrowLeft, CheckCircle2, Truck } from '@lucide/vue'
import {
  DEFAULT_CALIBERS,
  consumedByTruck,
  createId,
  proposeFifoConsumption,
  totalOutputBoxes,
  truckAvailableBirds,
  truckBirds,
} from '@/utils/production'

const trucksKey = 'mark-frigorifico-operacion-v2'
const productionKey = 'mark-frigorifico-produccion-v2'
const finishedStockKey = 'mark-frigorifico-stock-terminado-v1'
const actor = 'Operador Producción'
const route = useRoute()
const router = useRouter()
const today = new Date().toISOString().slice(0, 10)
const trucks = ref(loadArray(trucksKey))
const productions = ref(loadArray(productionKey).map(normalizeProduction))
const selectedDate = ref(typeof route.query.date === 'string' ? route.query.date : today)
const feedback = reactive({ message: '', type: 'success' })

const productOptions = ['Pollo entero']
const flowSteps = [
  { number: '1', value: 'ingreso', label: 'Ingreso' },
  { number: '2', value: 'carga', label: 'Producción' },
  { number: '3', value: 'consumo', label: 'Consumo' },
  { number: '4', value: 'cierre', label: 'Cierre' },
]

const activeProduction = computed(() =>
  productions.value.find((production) => production.id === route.query.id),
)
const currentStep = computed(() => {
  const requested = route.query.step
  if (flowSteps.some((step) => step.value === requested) && canOpenStep(requested)) return requested
  return activeProduction.value ? nextStepFor(activeProduction.value) : 'ingreso'
})
const currentStepMeta = computed(
  () => flowSteps.find((step) => step.value === currentStep.value) || flowSteps[0],
)
const activeTrucks = computed(() => {
  if (!activeProduction.value) return []
  return activeProduction.value.truckIds
    .map((id) => truckDataFor(activeProduction.value, id))
    .filter(Boolean)
    .sort((left, right) => truckUseOrder(left.id) - truckUseOrder(right.id))
})
const priorConsumption = computed(() => consumedByTruck(productions.value, activeProduction.value?.id))
const activeTotals = computed(() => totalsFor(activeTrucks.value))
const selectedConsumption = computed(() =>
  Object.values(activeProduction.value?.consumption || {}).reduce(
    (total, value) => total + Math.max(0, Number(value || 0)),
    0,
  ),
)
const consumptionDifference = computed(
  () => selectedConsumption.value - Number(activeProduction.value?.requiredBirds || 0),
)
const producedOutputs = computed(() =>
  (activeProduction.value?.outputs || []).filter((output) => Number(output.boxes || 0) > 0),
)

watch(productions, (value) => localStorage.setItem(productionKey, JSON.stringify(value)), {
  deep: true,
})
watch(
  () => route.query.date,
  (date) => {
    const nextDate = typeof date === 'string' ? date : today
    if (selectedDate.value !== nextDate) selectedDate.value = nextDate
  },
)

function normalizeProduction(production) {
  return {
    ...production,
    product: production.product || 'Pollo entero',
    outputs: DEFAULT_CALIBERS.map(
      (caliber) =>
        production.outputs?.find((item) => item.caliber === caliber) || { caliber, boxes: 0 },
    ),
    consumption: production.consumption || {},
    truckOrder:
      production.truckOrder ||
      Object.fromEntries(
        (production.truckIds || []).map((id, index) => [
          id,
          Number(production.truckSnapshots?.[id]?.productionOrder) || index + 1,
        ]),
      ),
    events: production.events || [],
    truckSnapshots: production.truckSnapshots || {},
    finished: production.finished || defaultFinished(production.date || today, production.brand || ''),
  }
}

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function nextStepFor(production) {
  if (production.status === 'completed' || production.consumptionConfirmedAt) return 'cierre'
  if (production.productionConfirmedAt) return 'consumo'
  if (production.entryConfirmedAt) return 'carga'
  return 'ingreso'
}

function confirmEntry() {
  const production = activeProduction.value
  if (!production || activeTrucks.value.length === 0)
    return showFeedback('No hay camiones asociados a esta producción', 'error')
  if (!production.entryConfirmedAt) {
    production.truckSnapshots = Object.fromEntries(
      production.truckIds
        .map((id) => trucks.value.find((truck) => truck.id === id))
        .filter(Boolean)
        .map((truck) => [truck.id, { ...truck }]),
    )
    production.entryConfirmedAt = new Date().toISOString()
    addEvent(production, 'Ingreso de materia prima confirmado')
  }
  goToStep('carga')
}

function updateProduct(value) {
  activeProduction.value.product = value
}

function updateOutputBoxes(caliber, value) {
  const output = activeProduction.value.outputs.find((item) => item.caliber === caliber)
  if (output) output.boxes = value
}

function updateRequiredBirds(value) {
  activeProduction.value.requiredBirds = value
}

function updateConsumption(truckId, value) {
  activeProduction.value.consumption[truckId] = value
}

function updateFinished(field, value) {
  activeProduction.value.finished[field] = value
}

function confirmOutput() {
  const production = activeProduction.value
  const invalidOutput = production.outputs.some(
    (output) => !Number.isInteger(Number(output.boxes)) || Number(output.boxes) < 0,
  )
  if (invalidOutput) return showFeedback('Las cajas deben ser números enteros positivos', 'error')
  if (totalBoxes(production.outputs) <= 0)
    return showFeedback('Ingresa al menos una caja producida', 'error')
  production.status = 'in_process'
  production.productionConfirmedAt = new Date().toISOString()
  production.requiredBirds = Number(production.requiredBirds || activeTotals.value.available)
  addEvent(production, 'Producción por calibre confirmada')
  applyFifo(false)
  goToStep('consumo')
}

function applyFifo(notify = true) {
  const production = activeProduction.value
  if (!production) return
  production.consumption = proposeFifoConsumption(
    activeTrucks.value,
    production.requiredBirds,
    priorConsumption.value,
    production.truckOrder,
  )
  if (notify) showFeedback('Consumo FIFO recalculado')
}

function confirmConsumption() {
  const production = activeProduction.value
  const required = Number(production.requiredBirds || 0)
  if (!Number.isInteger(required) || required <= 0)
    return showFeedback('Las aves necesarias deben ser un número entero positivo', 'error')
  const invalid = activeTrucks.value.some(
    (truck) =>
      !Number.isInteger(Number(production.consumption[truck.id] || 0)) ||
      Number(production.consumption[truck.id] || 0) < 0 ||
      Number(production.consumption[truck.id] || 0) > availableForTruck(truck),
  )
  if (invalid)
    return showFeedback('El consumo no puede superar la disponibilidad de cada camión', 'error')
  if (selectedConsumption.value !== required)
    return showFeedback('Las aves seleccionadas deben coincidir con las necesarias', 'error')
  production.consumptionConfirmedAt = new Date().toISOString()
  production.finished = {
    ...defaultFinished(production.date, production.brand),
    ...production.finished,
  }
  addEvent(production, 'Consumo de materia prima confirmado')
  goToStep('cierre')
}

function closeProduction() {
  const production = activeProduction.value
  const finished = production.finished
  if (
    !production.entryConfirmedAt ||
    !production.productionConfirmedAt ||
    !production.consumptionConfirmedAt ||
    totalBoxes(production.outputs) <= 0
  )
    return showFeedback('Completa todas las etapas antes de cerrar la producción', 'error')
  if (!finished.lot || !finished.manufactureDate || !finished.expirationDate)
    return showFeedback('Completa lote y fechas antes de cerrar', 'error')
  if (finished.expirationDate < finished.manufactureDate)
    return showFeedback('El vencimiento debe ser posterior a la fabricación', 'error')
  if (production.status === 'completed') return
  const closedAt = new Date().toISOString()
  const stock = loadArray(finishedStockKey)
  if (!stock.some((item) => item.productionId === production.id)) {
    stock.push({
      id: createId(),
      productionId: production.id,
      brand: production.brand,
      product: production.product,
      lot: finished.lot,
      manufactureDate: finished.manufactureDate,
      expirationDate: finished.expirationDate,
      clientCode: finished.clientCode,
      outputs: producedOutputs.value.map((output) => ({ ...output })),
      totalBoxes: totalBoxes(production.outputs),
      createdAt: closedAt,
    })
    try {
      localStorage.setItem(finishedStockKey, JSON.stringify(stock))
    } catch {
      return showFeedback('No se pudo generar el stock terminado. Intenta nuevamente.', 'error')
    }
  }
  production.status = 'completed'
  production.closedAt = closedAt
  addEvent(production, 'Producción cerrada y stock terminado generado')
  showFeedback('Producción cerrada y stock terminado generado')
}

function addEvent(production, label) {
  production.events.push({ id: createId(), label, actor, at: new Date().toISOString() })
  production.updatedAt = new Date().toISOString()
}

function defaultFinished(date, brand, sequence = 1) {
  const expiration = new Date(`${date}T12:00:00`)
  expiration.setDate(expiration.getDate() + 7)
  const compactDate = date.split('-').reverse().join('').slice(0, 6)
  return {
    lot: `${compactDate}-${initials(brand).slice(0, 1) || 'P'}${String(sequence).padStart(2, '0')}`,
    clientCode: '',
    manufactureDate: date,
    expirationDate: expiration.toISOString().slice(0, 10),
  }
}

function canOpenStep(step) {
  const production = activeProduction.value
  if (!production) return false
  if (production.status === 'completed') return step === 'cierre'
  if (step === 'ingreso') return true
  if (step === 'carga') return Boolean(production.entryConfirmedAt)
  if (step === 'consumo') return Boolean(production.productionConfirmedAt)
  return Boolean(production.consumptionConfirmedAt)
}

function isStepDone(step) {
  const production = activeProduction.value
  if (step === 'ingreso') return Boolean(production?.entryConfirmedAt)
  if (step === 'carga') return Boolean(production?.productionConfirmedAt)
  if (step === 'consumo') return Boolean(production?.consumptionConfirmedAt)
  return production?.status === 'completed'
}

function goToStep(step, id = activeProduction.value?.id) {
  router.push({
    path: '/produccion/proceso',
    query: { id, step, ...(selectedDate.value === today ? {} : { date: selectedDate.value }) },
  })
}

function goToDashboard() {
  router.push({
    path: '/produccion',
    query: selectedDate.value === today ? {} : { date: selectedDate.value },
  })
}

function truckDataFor(production, truckId) {
  return production?.truckSnapshots?.[truckId] || trucks.value.find((truck) => truck.id === truckId)
}

function availableForTruck(truck) {
  return Math.max(0, truckAvailableBirds(truck) - Number(priorConsumption.value[truck.id] || 0))
}

function truckUseOrder(truckId) {
  const order = Number(activeProduction.value?.truckOrder?.[truckId] || 0)
  if (Number.isInteger(order) && order > 0) return order
  return (activeProduction.value?.truckIds.indexOf(truckId) ?? 0) + 1
}

function totalsFor(list) {
  return list.reduce(
    (totals, truck) => {
      totals.birds += birdsFor(truck)
      totals.deaths += Math.max(0, Number(truck.muertos || 0))
      totals.confiscations += confiscationsFor(truck)
      totals.available += availableForTruck(truck)
      return totals
    },
    { birds: 0, deaths: 0, confiscations: 0, available: 0 },
  )
}

function birdsFor(truck) {
  return truckBirds(truck)
}

function confiscationsFor(truck) {
  return Math.max(0, Number(truck.decomisos || 0))
}

function totalBoxes(outputs) {
  return totalOutputBoxes(outputs)
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function number(value) {
  return nonNegative(value).toLocaleString('es-AR')
}

function nonNegative(value) {
  return Math.max(0, Number(value || 0))
}

function signedNumber(value) {
  const numeric = Number(value || 0)
  return `${numeric > 0 ? '+' : ''}${numeric.toLocaleString('es-AR')}`
}

function showFeedback(message, type = 'success') {
  feedback.message = message
  feedback.type = type
  window.setTimeout(() => {
    feedback.message = ''
  }, 3000)
}
</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .production-flow-header {
    gap: 10px;
    margin-bottom: 16px;
  }

  .production-back {
    width: 42px;
    min-height: 42px;
    flex: 0 0 auto;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: #fff;
  }

  .production-flow-title {
    gap: 11px;
  }

  .production-flow-title .truck-avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px;
  }

  .production-flow-title h1 {
    font-size: 21px;
  }

  .production-flow-title small {
    display: block;
    font-size: 12px;
  }

  .production-steps {
    position: relative;
    gap: 0;
    margin: 0 0 22px;
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .production-steps::before {
    position: absolute;
    top: 16px;
    right: 12.5%;
    left: 12.5%;
    height: 2px;
    background: #dededc;
    content: '';
  }

  .production-steps button,
  .production-steps button:disabled,
  .production-steps button.active {
    min-height: 52px;
    gap: 6px;
    padding: 0 2px;
    border: 0;
    background: transparent;
  }

  .production-steps button > span {
    z-index: 1;
    width: 32px;
    height: 32px;
    border: 3px solid var(--canvas);
    background: #e8e8e6;
    color: #777;
    font-size: 11px;
  }

  .production-steps button.active > span,
  .production-steps button.done > span {
    background: var(--brand);
    color: #fff;
  }

  .production-steps button small,
  .production-steps button:disabled small {
    color: #8b8b88;
    font-size: 11px;
    font-weight: 650;
  }

  .production-steps button.active small {
    color: var(--brand-dark);
  }

  :deep(.production-mobile-heading) {
    display: flex;
    gap: 11px;
    align-items: center;
    margin-bottom: 12px;
  }

  :deep(.production-mobile-heading > span) {
    color: var(--brand);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  :deep(.production-mobile-heading h2) {
    margin: 0;
    font-size: 17px;
    letter-spacing: -0.02em;
  }

  :deep(.production-mobile-heading p) {
    margin: 2px 0 0;
    color: var(--muted);
    font-size: 12px;
  }

  :deep(.raw-material-compact) {
    gap: 10px;
    padding: 0;
  }

  :deep(.raw-material-table),
  :deep(.consumption-table) {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  :deep(.raw-material-table-row:not(.raw-material-table-row--total)),
  :deep(.consumption-table-row:not(.consumption-table-row--total)) {
    gap: 13px 18px;
    padding: 15px;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 4px 16px rgb(0 0 0 / 4%);
  }

  :deep(.raw-material-table-row strong),
  :deep(.consumption-table-row > span) {
    font-size: 14px;
  }

  :deep(.raw-material-table-row [data-label]::before),
  :deep(.consumption-table-row [data-label]::before) {
    font-size: 11px;
  }

  :deep(.production-entry-total) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-radius: 15px;
  }

  :deep(.production-entry-total > div) {
    padding: 13px 14px;
    border-bottom: 1px solid var(--line);
  }

  :deep(.production-entry-total > div:nth-child(even)) {
    border-right: 0;
  }

  :deep(.production-entry-total > div:nth-last-child(-n + 2)) {
    border-bottom: 0;
  }

  :deep(.production-entry-total dt) {
    font-size: 11px;
  }

  :deep(.production-entry-total dd) {
    font-size: 17px;
  }

  :deep(.production-step-toolbar) {
    margin-bottom: 10px;
  }

  :deep(.production-step-toolbar .q-field) {
    width: 100%;
  }

  :deep(.output-table) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  :deep(.output-table-head) {
    display: none;
  }

  :deep(.output-table-row:not(.output-table-row--total)) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    min-height: 0;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: #fff;
  }

  :deep(.output-caliber-label) {
    font-size: 13px;
  }

  :deep(.output-quantity-cell .q-field),
  :deep(.output-quantity-input) {
    width: 100%;
  }

  :deep(.output-quantity-input .q-field__control),
  :deep(.output-quantity-input .q-field__native),
  :deep(.output-quantity-input .q-field__marginal) {
    min-height: 40px;
    height: 40px;
  }

  :deep(.output-table-row--total) {
    grid-column: 1 / -1;
    grid-template-columns: 1fr auto;
    min-height: 52px;
    padding: 0 15px;
    border: 1px solid var(--line);
    border-radius: 13px;
  }

  :deep(.output-table-row--total strong) {
    font-size: 17px;
  }

  :deep(.consumption-summary) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  :deep(.consumption-summary > label) {
    grid-column: 1 / -1;
  }

  :deep(.consumption-summary > div),
  :deep(.consumption-summary > label) {
    min-height: 58px;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: #fff;
  }

  :deep(.consumption-summary-input) {
    width: 126px;
  }

  :deep(.consumption-summary-input .q-field__control),
  :deep(.consumption-summary-input .q-field__native),
  :deep(.consumption-summary-input .q-field__marginal),
  :deep(.consumption-quantity-input .q-field__control),
  :deep(.consumption-quantity-input .q-field__native),
  :deep(.consumption-quantity-input .q-field__marginal) {
    min-height: 40px;
    height: 40px;
  }

  :deep(.consumption-table-row .consumption-quantity-input) {
    margin-top: 2px;
  }

  :deep(.consumption-table-row--total) {
    grid-template-columns: 1fr auto;
    min-height: 54px;
    padding: 0 15px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #fff;
  }

  :deep(.consumption-table-row--total > :nth-child(2)),
  :deep(.consumption-table-row--total > :nth-child(3)) {
    display: none;
  }

  :deep(.closure-grid) {
    gap: 10px;
  }

  :deep(.closure-summary),
  :deep(.finished-data) {
    border-radius: 15px;
  }

  :deep(.closure-summary-section h3) {
    padding: 12px 14px;
    background: #fff;
    color: var(--brand-dark);
    font-size: 12px;
  }

  :deep(.closure-summary-row) {
    grid-template-columns: 1fr auto;
    min-height: 46px;
    padding: 5px 14px;
  }

  :deep(.finished-data) {
    gap: 12px;
    padding: 15px;
  }

  :deep(.closure-input .q-field__control),
  :deep(.closure-input .q-field__native),
  :deep(.closure-input .q-field__marginal),
  :deep(.finished-data .date-input .q-field__control),
  :deep(.finished-data .date-input .q-field__native),
  :deep(.finished-data .date-input .q-field__marginal) {
    min-height: 44px;
    height: 44px;
  }

  :deep(.stock-callout) {
    padding: 14px;
    border-radius: 13px;
  }

  :deep(.production-entry-step .production-stage-actions),
  :deep(.production-output-step .production-stage-actions),
  :deep(.production-consumption-step .production-stage-actions),
  :deep(.production-closure-step .production-stage-actions) {
    position: sticky;
    bottom: 0;
    z-index: 2;
    margin: 12px -10px -14px;
    padding: 10px 10px max(10px, env(safe-area-inset-bottom));
    background: linear-gradient(to top, var(--canvas) 75%, transparent);
  }

  :deep(.production-stage-actions .primary-action) {
    min-height: 48px;
    border-radius: 13px;
    box-shadow: 0 8px 22px rgb(239 61 53 / 22%);
  }
}
</style>
