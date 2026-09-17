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
              <h1>{{ activeBrandName }}</h1>
              <small
                >Paso {{ currentStepMeta.number }} de {{ flowSteps.length }} ·
                {{ currentStepMeta.label }}</small
              >
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
          :readonly="isReadOnly"
          :number="number"
          :birds-for="birdsFor"
          :confiscations-for="confiscationsFor"
          :available-for-truck="availableForTruck"
          :truck-use-order="truckUseOrder"
          @confirm="confirmEntry"
          @edit-truck="goToTruckEntry"
        />

        <ProductionCargaStep
          v-if="currentStep === 'carga'"
          :production="activeProduction"
          :number="number"
          :percentage="percentage"
          :total-boxes="totalBoxes"
          :yield-summary="yieldSummary"
          @confirm-output="confirmOutput"
          @reset-output-birds="resetOutputBirds"
          @update-output-b-boxes="updateOutputBBoxes"
          @update-output-b-trozado-boxes="updateOutputBTrozadoBoxes"
          @update-output-birds="updateOutputBirds"
          @update-output-boxes="updateOutputBoxes"
        />

        <ProductionCierreStep
          v-if="currentStep === 'cierre'"
          :production="activeProduction"
          :active-totals="activeTotals"
          :produced-outputs="producedOutputs"
          :produced-outputs-b="producedOutputsB"
          :produced-outputs-b-trozado="producedOutputsBTrozado"
          :selected-consumption="selectedConsumption"
          :yield-summary="yieldSummary"
          :number="number"
          :percentage="percentage"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductionCargaStep from '@/components/zona2/ProductionCargaStep.vue'
import ProductionCierreStep from '@/components/zona2/ProductionCierreStep.vue'
import ProductionIngresoStep from '@/components/zona2/ProductionIngresoStep.vue'
import { useCamiones } from '@/composables/useCamiones'
import { useProducciones } from '@/composables/useProducciones'
import { dateFromQuery, todayIsoDate } from '@/utils/date'
import { AlertCircle, ArrowLeft, CheckCircle2, Truck } from '@lucide/vue'
import {
  calcularRindeProduccion,
  consumedByTruck,
  outputRowsByType,
  totalOutputBoxes,
  truckAvailableBirds,
  truckBirds,
  truckConfiscations,
} from '@/utils/production'

const route = useRoute()
const router = useRouter()
const today = todayIsoDate()
const { camiones: trucks, obtenerCamion } = useCamiones()
const {
  listarProducciones,
  obtenerProduccion,
  confirmarIngreso,
  confirmarProduccion,
  cerrarProduccion,
} = useProducciones()
const productions = ref([])
const selectedDate = ref(dateFromQuery(route.query.date, today))
const feedback = reactive({ message: '', type: 'success' })

onMounted(async () => {
  try {
    const disponibles = await listarProducciones(selectedDate.value)
    productions.value = disponibles.map(productionViewModel)
    if (!activeProduction.value && route.query.id) {
      const production = await obtenerProduccion(route.query.id)
      productions.value = [productionViewModel(production)]
    }
    trucks.value = await Promise.all(
      (activeProduction.value?.entries || []).map(({ truckId }) => obtenerCamion(truckId)),
    )
  } catch (error) {
    showFeedback(error.message, 'error')
  }
})

const flowSteps = [
  { number: '1', value: 'ingreso', label: 'Ingreso' },
  { number: '2', value: 'carga', label: 'Producción' },
  { number: '3', value: 'cierre', label: 'Cierre' },
]

const activeProduction = computed(() =>
  productions.value.find((production) => production.id === route.query.id),
)
const activeBrandName = computed(() => activeProduction.value?.context?.brand?.nombre || '-')
const isReadOnly = computed(() => activeProduction.value?.status === 'completed')
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
  return activeProduction.value.entries
    .map(({ truckId }) => truckDataFor(activeProduction.value, truckId))
    .filter(Boolean)
    .sort((left, right) => truckUseOrder(left.id) - truckUseOrder(right.id))
})
const priorConsumption = computed(() =>
  consumedByTruck(productions.value, activeProduction.value?.id),
)
const activeTotals = computed(() => ({
  ...totalsFor(activeTrucks.value),
  available: activeTrucks.value.reduce((total, truck) => total + availableForTruck(truck), 0),
}))
const selectedConsumption = computed(() =>
  (activeProduction.value?.entries || []).reduce(
    (total, entry) => total + Math.max(0, Number(entry.consumedBirds || 0)),
    0,
  ),
)
const producedOutputs = computed(() =>
  (activeProduction.value?.normalOutputs || []).filter((output) => Number(output.boxes || 0) > 0),
)
const producedOutputsB = computed(() =>
  (activeProduction.value?.bOutputs || []).filter((output) => Number(output.boxes || 0) > 0),
)
const producedOutputsBTrozado = computed(() =>
  (activeProduction.value?.bTrozadoOutputs || []).filter((output) => Number(output.boxes || 0) > 0),
)
const yieldSummary = computed(() =>
  calcularRindeProduccion(activeTrucks.value, activeProduction.value?.outputs),
)

watch(
  () => route.query.date,
  (date) => {
    const nextDate = dateFromQuery(date, today)
    if (selectedDate.value !== nextDate) selectedDate.value = nextDate
  },
)

function productionViewModel(production) {
  const outputs = [...(production.outputs || [])]
  ;['normal', 'b', 'b_trozado'].forEach((type) => {
    outputRowsByType(outputs, type).forEach((output) => {
      if (!outputs.includes(output)) outputs.push(output)
    })
  })
  return {
    ...production,
    context: production.context || { date: '', brand: {} },
    entries: production.entries || [],
    outputs,
    normalOutputs: outputRowsByType(outputs, 'normal'),
    bOutputs: outputRowsByType(outputs, 'b'),
    bTrozadoOutputs: outputRowsByType(outputs, 'b_trozado'),
    finished: production.finished || {},
  }
}

function nextStepFor(production) {
  if (production.status === 'completed' || production.productionConfirmedAt) return 'cierre'
  if (production.entryConfirmedAt) return 'carga'
  return 'ingreso'
}

async function confirmEntry() {
  const production = activeProduction.value
  if (isReadOnly.value) return
  if (!production || activeTrucks.value.length === 0)
    return showFeedback('No hay camiones asociados a esta producción', 'error')
  if (production.entryConfirmedAt) return goToStep('carga')
  try {
    replaceProduction(await confirmarIngreso(production.id))
    goToStep('carga')
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

function updateOutputBoxes(caliber, value) {
  if (isReadOnly.value) return
  const output = activeProduction.value.normalOutputs.find((item) => item.caliber === caliber)
  if (output) output.boxes = value
}

function updateOutputBBoxes(caliber, value) {
  if (isReadOnly.value) return
  const output = activeProduction.value.bOutputs.find((item) => item.caliber === caliber)
  if (output) output.boxes = value
}

function updateOutputBTrozadoBoxes(caliber, value) {
  if (isReadOnly.value) return
  const output = activeProduction.value.bTrozadoOutputs.find((item) => item.caliber === caliber)
  if (output) output.boxes = value
}

function updateOutputBirds(type, caliber, value) {
  if (isReadOnly.value) return
  const outputs =
    type === 'normal'
      ? activeProduction.value.normalOutputs
      : type === 'b'
        ? activeProduction.value.bOutputs
        : activeProduction.value.bTrozadoOutputs
  const output = outputs.find((item) => item.caliber === caliber)
  if (!output) return
  output.birds = value
  output.birdsManual = true
}

function resetOutputBirds(type, caliber) {
  if (isReadOnly.value) return
  const outputs =
    type === 'normal'
      ? activeProduction.value.normalOutputs
      : type === 'b'
        ? activeProduction.value.bOutputs
        : activeProduction.value.bTrozadoOutputs
  const output = outputs.find((item) => item.caliber === caliber)
  if (!output) return
  delete output.birds
  output.birdsManual = false
}

function updateFinished(field, value) {
  if (isReadOnly.value) return
  activeProduction.value.finished[field] = value
}

async function confirmOutput() {
  const production = activeProduction.value
  if (isReadOnly.value) return
  const invalidOutput = production.normalOutputs.some(
    (output) => !Number.isInteger(Number(output.boxes)) || Number(output.boxes) < 0,
  )
  if (invalidOutput) return showFeedback('Las cajas deben ser números enteros positivos', 'error')
  const invalidOutputB = production.bOutputs.some(
    (output) => !Number.isInteger(Number(output.boxes)) || Number(output.boxes) < 0,
  )
  if (invalidOutputB)
    return showFeedback('Las cajas B deben ser números enteros positivos', 'error')
  const invalidOutputBTrozado = production.bTrozadoOutputs.some(
    (output) => !Number.isInteger(Number(output.boxes)) || Number(output.boxes) < 0,
  )
  if (invalidOutputBTrozado)
    return showFeedback('Las cajas B de pollo trozado deben ser números enteros positivos', 'error')
  const invalidBirdAdjustment = [
    ...production.normalOutputs,
    ...production.bOutputs,
    ...production.bTrozadoOutputs,
  ].some(
    (output) =>
      output.birdsManual && (!Number.isInteger(Number(output.birds)) || Number(output.birds) < 0),
  )
  if (invalidBirdAdjustment)
    return showFeedback('Las aves ajustadas deben ser números enteros positivos', 'error')
  if (totalBoxes(production.normalOutputs) <= 0)
    return showFeedback('Ingresa al menos una caja producida', 'error')
  try {
    const updated = await confirmarProduccion(production.id, {
      outputs: production.outputs.filter(hasBoxes).map(outputPayload),
    })
    replaceProduction(updated)
    goToStep('cierre')
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

function outputPayload(output) {
  return {
    type: output.type,
    caliber: output.caliber,
    boxes: Number(output.boxes || 0),
    ...(output.birdsManual ? { birds: Number(output.birds || 0), birdsManual: true } : {}),
  }
}

function hasBoxes(output) {
  return Number(output.boxes) > 0
}

async function closeProduction() {
  const production = activeProduction.value
  if (isReadOnly.value) return
  const finished = production.finished
  if (
    !production.entryConfirmedAt ||
    !production.productionConfirmedAt ||
    totalBoxes(production.normalOutputs) <= 0
  )
    return showFeedback('Completa todas las etapas antes de cerrar la producción', 'error')
  if (!finished.lot || !finished.manufactureDate || !finished.expirationDate)
    return showFeedback('Completa lote y fechas antes de cerrar', 'error')
  if (finished.expirationDate < finished.manufactureDate)
    return showFeedback('El vencimiento debe ser posterior a la fabricación', 'error')
  if (production.status === 'completed') return
  try {
    await cerrarProduccion(production.id, { finished })
    goToDashboard()
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

function replaceProduction(production) {
  const normalized = productionViewModel(production)
  const index = productions.value.findIndex((item) => item.id === normalized.id)
  if (index < 0) productions.value.push(normalized)
  else productions.value[index] = normalized
}

function canOpenStep(step) {
  const production = activeProduction.value
  if (!production) return false
  if (production.status === 'completed') return true
  if (step === 'ingreso') return true
  if (step === 'carga') return Boolean(production.entryConfirmedAt)
  return Boolean(production.productionConfirmedAt)
}

function isStepDone(step) {
  const production = activeProduction.value
  if (step === 'ingreso') return Boolean(production?.entryConfirmedAt)
  if (step === 'carga') return Boolean(production?.productionConfirmedAt)
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

function goToTruckEntry({ truck, step }) {
  if (isReadOnly.value) return
  router.push({
    name: step === 2 ? 'balanza-form2' : 'balanza-form1',
    params: { id: String(truck.id) },
    query: { returnTo: route.fullPath },
  })
}

function truckDataFor(production, truckId) {
  return trucks.value.find((truck) => truck.id === truckId)
}

function availableForTruck(truck) {
  return Math.max(0, truckAvailableBirds(truck) - Number(priorConsumption.value[truck.id] || 0))
}

function truckUseOrder(truckId) {
  const order = Number(
    activeProduction.value?.entries.find((entry) => entry.truckId === truckId)?.order || 0,
  )
  if (Number.isInteger(order) && order > 0) return order
  return (activeProduction.value?.entries.findIndex((entry) => entry.truckId === truckId) ?? 0) + 1
}

function totalsFor(list) {
  return list.reduce(
    (totals, truck) => {
      totals.birds += birdsFor(truck)
      totals.deaths += Math.max(0, Number(truck.faena?.novedades?.muertas || 0))
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
  return truckConfiscations(truck)
}

function totalBoxes(outputs) {
  return totalOutputBoxes(outputs)
}

function number(value) {
  return nonNegative(value).toLocaleString('es-AR')
}

function nonNegative(value) {
  return Math.max(0, Number(value || 0))
}

function percentage(value) {
  return value === null
    ? '-'
    : value.toLocaleString('es-AR', { style: 'percent', minimumFractionDigits: 2 })
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
    right: 16.6667%;
    left: 16.6667%;
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

  :deep(.raw-material-table) {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  :deep(.raw-material-table-row:not(.raw-material-table-row--total)) {
    gap: 13px 18px;
    padding: 15px;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 4px 16px rgb(0 0 0 / 4%);
  }

  :deep(.raw-material-table-row strong) {
    font-size: 14px;
  }

  :deep(.raw-material-table-row [data-label]::before) {
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
    grid-template-columns: 1fr auto auto;
    min-height: 52px;
    padding: 0 15px;
    border: 1px solid var(--line);
    border-radius: 13px;
  }

  :deep(.output-table-row--total strong) {
    font-size: 17px;
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
