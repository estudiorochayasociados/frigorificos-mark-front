<template>
  <q-page class="page-shell">
    <div
      v-if="showHistoryDetailPage && historyDetail"
      class="page-content production-page page-content--narrow"
    >
      <section class="production-history-dialog page-panel">
        <header class="dialog-header">
          <div class="dialog-title-wrap">
            <span class="dialog-icon"><History :size="20" /></span>
            <div class="dialog-heading">
              <h2 class="dialog-title">{{ historyDetail.brand }}</h2>
              <span class="dialog-subtitle">Producción {{ shortDate(historyDetail.date) }}</span>
            </div>
          </div>
          <button class="icon-action" type="button" @click="goToHistory">
            <X :size="20" />
          </button>
        </header>
        <div class="history-detail-body">
          <div class="history-detail-metrics">
            <div>
              <span>Entrada</span><strong>{{ number(historyTotals.birds) }} aves</strong>
            </div>
            <div>
              <span>Consumo</span><strong>{{ number(historyConsumption) }} aves</strong>
            </div>
            <div>
              <span>Terminado</span
              ><strong>{{ number(totalBoxes(historyDetail.outputs)) }} cajas</strong>
            </div>
          </div>
          <section>
            <h3>Camiones y DTE</h3>
            <div class="history-trucks">
              <div v-for="truck in historyTrucks" :key="truck.id">
                <strong>{{ truck.chasis || '-' }}</strong
                ><span>DTE {{ truck.dte || '-' }}</span
                ><span>{{ number(consumptionFor(historyDetail, truck.id)) }} aves consumidas</span>
              </div>
            </div>
          </section>
          <section>
            <h3>Calibres producidos</h3>
            <div class="history-outputs">
              <div v-for="output in historyDetail.outputs" :key="output.caliber">
                <span>{{ output.caliber }}</span
                ><strong>{{ number(output.boxes) }} cajas</strong>
              </div>
            </div>
          </section>
          <section>
            <h3>Lote terminado</h3>
            <div class="history-lot">
              <strong>{{ historyDetail.finished?.lot || '-' }}</strong>
              <span
                >Fabricación {{ shortDate(historyDetail.finished?.manufactureDate) }} · Vencimiento
                {{ shortDate(historyDetail.finished?.expirationDate) }}</span
              >
            </div>
          </section>
          <section>
            <h3>Movimientos</h3>
            <div class="audit-timeline">
              <div v-for="event in [...(historyDetail.events || [])].reverse()" :key="event.id">
                <span></span>
                <div>
                  <strong>{{ event.label }}</strong
                  ><small>{{ event.actor }} · {{ dateTime(event.at) }}</small>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>

    <div v-else class="page-content production-page">
      <template v-if="showMassBalance">
        <PageHeader
          title="Balance de masa"
          description="Balance diario generado desde Balanza y Producción, con detalle por lote de entrada."
        >
          <template #actions>
            <button
              v-if="!selectedMassBalance"
              class="primary-action"
              type="button"
              :disabled="!singleDateSelected || balanceSourceTrucks.length === 0"
              @click="createMassBalance"
            >
              Crear balance del día
            </button>
            <button v-else class="secondary-action" type="button" @click="deleteMassBalance">
              Eliminar balance
            </button>
          </template>
        </PageHeader>

        <section class="date-range-filters" aria-label="Filtro de balance">
          <DateInput v-model="dateRange.desde" label="Desde" />
          <DateInput v-model="dateRange.hasta" label="Hasta" />
          <button class="secondary-action" type="button" @click="setTodayRange">Ver hoy</button>
          <span v-if="!dateRangeValid" class="date-range-error"
            >La fecha desde no puede ser posterior a la fecha hasta.</span
          >
        </section>

        <section v-if="selectedMassBalance" class="mass-balance-card data-card">
          <section class="mass-balance-summary-card" aria-label="Resumen del balance de masa">
            <div class="data-card-header">
              <div>
                <h2>Balance de masa</h2>
                <p>
                  Entrada + absorción − subproductos − decomiso, contrastado con la salida real.
                </p>
              </div>
            </div>
            <div class="mass-balance-metrics">
              <article>
                <span>Entrada</span><strong>{{ kgValue(balanceTotals.inputKg) }} kg</strong>
              </article>
              <article>
                <span>Absorción máxima 8%</span
                ><strong>{{ kgValue(balanceTotals.absorptionKg) }} kg</strong>
              </article>
              <article>
                <span>Subproductos</span><strong>{{ kgValue(balanceTotals.byproductsKg) }} kg</strong>
              </article>
              <article>
                <span>Decomiso</span><strong>{{ kgValue(balanceTotals.confiscationKg) }} kg</strong>
              </article>
              <article>
                <span>Salida</span><strong>{{ kgValue(balanceTotals.yieldOutputKg) }} kg</strong>
              </article>
            </div>
            <div class="mass-balance-details">
              <section class="mass-balance-details-head">
                <article class="mass-balance-output">
                  <span>Resultado del balance</span>
                  <strong>{{ kgValue(balanceTotals.balanceOutputKg) }} kg</strong>
                </article>
                <article
                  class="mass-balance-output"
                  :class="{
                    'mass-balance-reconciliation--difference': balanceTotals.differenceKg !== 0,
                  }"
                >
                  <span>Diferencia</span
                  ><strong>{{ signedKgValue(balanceTotals.differenceKg) }} kg</strong>
                </article>
                <header class="mass-balance-subproduct-heading">
                  <h4>Vísceras</h4>
                  <NonNegativeInput
                    v-model="selectedMassBalance.general.visceraPercent"
                    class="mass-balance-percent-input"
                    outlined
                    dense
                    hide-bottom-space
                    suffix="%"
                    aria-label="Porcentaje de vísceras"
                    :maximum="100"
                    @update:model-value="saveSubproductPercent('visceraPercent', $event)"
                    @blur="scheduleBalanceSave"
                  />
                </header>
                <header class="mass-balance-subproduct-heading">
                  <h4>Plumas</h4>
                  <NonNegativeInput
                    v-model="selectedMassBalance.general.featherPercent"
                    class="mass-balance-percent-input"
                    outlined
                    dense
                    hide-bottom-space
                    suffix="%"
                    aria-label="Porcentaje de plumas"
                    :maximum="100"
                    @update:model-value="saveSubproductPercent('featherPercent', $event)"
                    @blur="scheduleBalanceSave"
                  />
                </header>
              </section>
              <section class="mass-balance-subproducts">
                <div class="mass-balance-subproducts-grid">
                  <section class="mass-balance-subproduct-group">
                    <div class="mass-balance-subproduct-item">
                      <span>Harina de vísceras</span>
                      <strong>{{ kgValue(balanceTotals.visceraKg) }} kg</strong>
                      <small>Kg de entrada: {{ kgValue(balanceTotals.visceraInputKg) }} kg</small>
                    </div>
                    <div class="mass-balance-subproduct-item">
                      <span>Aceite de vísceras</span>
                      <strong>{{ kgValue(balanceTotals.oilKg) }} kg</strong>
                      <small>Base: {{ kgValue(balanceTotals.visceraInputKg) }} kg</small>
                    </div>
                  </section>
                  <section class="mass-balance-subproduct-group">
                    <div class="mass-balance-subproduct-item">
                      <span>Harina de plumas</span>
                      <strong>{{ kgValue(balanceTotals.featherKg) }} kg</strong>
                      <small>Kg de entrada: {{ kgValue(balanceTotals.featherInputKg) }} kg</small>
                    </div>
                  </section>
                </div>
              </section>
            </div>
          </section>
          <div class="data-card-header">
            <div>
              <h2>Trazabilidad de ingresos</h2>
              <p>Origen de las aves que integran el balance general del día.</p>
            </div>
          </div>
          <div class="mass-balance-trace-table gt-sm">
            <div class="mass-balance-trace-head">
              <span>Fecha de entrada</span><span>Lote</span><span>DTE</span><span>Camión</span
               ><span>Aves ingresadas</span><span>A faenar</span><span>Peso prom.</span
              ><span>Kg entrada</span><span>Rinde</span><span>KG SALIDA</span
              ><span>Decomisos</span>
            </div>
            <div
              v-for="line in paginatedBalanceLines"
              :key="line.record.truckId"
              class="mass-balance-trace-row"
            >
              <span>{{ shortDate(line.source.fechaEntrada) }}</span>
              <strong>{{ line.source.loteSenasa || '-' }}</strong>
              <span>{{ line.source.dte || '-' }}</span>
              <span>{{ line.source.chasis || '-' }}</span>
               <strong>{{ number(line.source.avesOrigen) }}</strong>
              <strong>{{ number(line.birdsToProcess) }}</strong>
              <span>{{ decimal(line.averagePlantWeight) }} kg</span>
              <strong>{{ decimal(line.inputKg) }} kg</strong>
              <div class="mass-balance-trace-yield">
                <NonNegativeInput
                  :model-value="yieldPercentFor(line)"
                  outlined
                  dense
                  hide-bottom-space
                  suffix="%"
                  aria-label="Rinde"
                  @update:model-value="updateBalanceYield(line, $event)"
                  @blur="scheduleBalanceSave"
                />
              </div>
              <strong>{{ line.outputKg === null ? '-' : `${decimal(line.outputKg)} kg` }}</strong>
              <span>{{ number(confiscationsFor(line.source)) }}</span>
            </div>
          </div>
          <ResponsiveDataTable
            class="mass-balance-trace-cards lt-md"
            :rows="paginatedBalanceLines"
            :columns="balanceTraceColumns"
            :row-key="(line) => line.record.truckId"
            :mobile-fields="balanceTraceCardFields"
          >
            <template #mobile-leading
              ><span class="truck-avatar"><Truck :size="18" /></span
            ></template>
            <template #mobile-title="{ row }">Lote {{ row.source.loteSenasa || '-' }}</template>
            <template #mobile-subtitle="{ row }"
              >DTE {{ row.source.dte || '-' }} · {{ row.source.chasis || 'Sin patente' }}</template
            >
            <template #mobile-actions="{ row }">
              <label class="mass-balance-trace-yield mass-balance-trace-yield--mobile">
                <span>Rinde</span>
                <NonNegativeInput
                  :model-value="yieldPercentFor(row)"
                  outlined
                  dense
                  hide-bottom-space
                  suffix="%"
                  aria-label="Rinde"
                  @update:model-value="updateBalanceYield(row, $event)"
                  @blur="scheduleBalanceSave"
                />
              </label>
            </template>
          </ResponsiveDataTable>
          <footer v-if="tracePageCount > 1" class="mass-balance-trace-pagination">
            <span>
              Mostrando {{ tracePageStart }}-{{ tracePageEnd }} de {{ balanceLines.length }} ingresos
            </span>
            <q-pagination
              v-model="tracePage"
              :max="tracePageCount"
              :max-pages="5"
              direction-links
              boundary-links
              color="primary"
            />
          </footer>
        </section>

        <section
          v-else-if="!singleDateSelected && massBalances.length"
          class="data-card date-range-results"
        >
          <div class="data-card-header">
            <div>
              <h2>Balances del período</h2>
              <p>Seleccioná un día para abrir su balance y editarlo.</p>
            </div>
          </div>
          <div class="date-range-result-list">
            <div v-for="balance in massBalances" :key="balance.id" class="date-range-result-row">
              <strong>{{ shortDate(balance.date) }}</strong>
              <span>{{ balance.lines.length }} lotes de entrada</span>
              <button
                class="secondary-action"
                type="button"
                @click="selectBalanceDate(balance.date)"
              >
                Abrir balance
              </button>
            </div>
          </div>
        </section>

        <section v-else class="data-card mass-balance-empty">
          <Calculator :size="36" />
          <strong>No hay balance creado</strong>
          <span v-if="!singleDateSelected"
            >Seleccioná una sola fecha para abrir o crear un balance diario.</span
          >
          <span v-else-if="balanceSourceTrucks.length"
            >Se generará con {{ balanceSourceTrucks.length }} lote{{
              balanceSourceTrucks.length === 1 ? '' : 's'
            }}
            de entrada de Zona 1.</span
          >
          <span v-else>No hay ingresos de Balanza finalizados para generar el balance.</span>
        </section>
      </template>

      <template v-else-if="showHistory">
        <PageHeader
          title="Historial de producción"
          description="Trazabilidad completa de entradas, consumos y producto terminado."
        >
          <template #actions
            ><button class="secondary-action" type="button" @click="goToDashboard">
              <ArrowLeft :size="17" /> Producciones del día
            </button></template
          >
        </PageHeader>

        <section class="production-filters">
          <q-input v-model="historySearch" outlined dense label="Buscar marca, lote o DTE">
            <template #prepend><Search :size="17" /></template>
          </q-input>
          <q-select
            v-model="historyStatus"
            outlined
            dense
            emit-value
            map-options
            label="Estado"
            :options="historyStatusOptions"
          />
        </section>

        <section class="data-card">
          <div class="data-card-header">
            <div class="title-row">
              <h2>Producciones registradas</h2>
              <span class="count-badge">{{ filteredHistory.length }}</span>
            </div>
          </div>
          <div v-if="filteredHistory.length" class="production-history-list">
            <button
              v-for="production in filteredHistory"
              :key="production.id"
              class="history-row"
              type="button"
              @click="openHistoryDetail(production)"
            >
              <span class="history-date">{{ shortDate(production.date) }}</span>
              <span class="history-main">
                <strong>{{ brandNameFor(production) }}</strong>
                <small>{{ production.product }} · {{ totalBoxes(production.outputs) }} cajas</small>
              </span>
              <span>{{ production.finished?.lot || 'Sin lote' }}</span>
              <span :class="['status-pill', statusClass(production)]">
                {{ statusLabel(production) }}
              </span>
              <ChevronRight :size="18" />
            </button>
          </div>
          <div v-else class="production-empty">
            <History :size="34" />
            <strong>Sin producciones para mostrar</strong>
            <span>Ajusta los filtros o inicia una producción.</span>
          </div>
        </section>
      </template>

      <template v-else>
        <PageHeader
          class="production-day-header"
          title="Producciones del día"
          description="Datos recibidos automáticamente desde Balanza."
        />

        <ResponsiveDataTable
          class="production-list-card"
          row-key="brand"
          :rows="dailyGroups"
          :columns="productionColumns"
          :mobile-fields="productionCardFields"
          clickable
          @select="openProduction"
        >
          <template #desktop-body="props">
            <q-tr :props="props" @click="openProduction(props.row)">
              <q-td key="brand" :props="props">
                <div class="client-cell">
                  <span class="truck-avatar"><Truck :size="19" /></span>
                  <div>
                    <strong>{{ props.row.brand }}</strong
                    ><small>Marca comercial</small>
                  </div>
                </div>
              </q-td>
              <q-td key="entryDate" :props="props">{{ shortDate(props.row.date) }}</q-td>
              <q-td key="blackTrucks" :props="props">
                {{ number(blackTruckCount(props.row)) }}
              </q-td>
              <q-td key="whiteTrucks" :props="props">
                {{ number(whiteTruckCount(props.row)) }}
              </q-td>
            </q-tr>
          </template>
          <template #mobile-leading
            ><span class="truck-avatar"><Truck :size="19" /></span
          ></template>
          <template #mobile-title="{ row }">{{ row.brand }}</template>
          <template #mobile-subtitle>Marca comercial</template>
          <template #empty
            ><div class="production-empty">
              <Truck :size="36" />
              <strong>No hay camiones disponibles</strong>
              <span>Los ingresos aparecerán aquí cuando Zona 1 los registre en Balanza.</span>
            </div></template
          >
        </ResponsiveDataTable>
      </template>
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
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import DateInput from '@/components/DateInput.vue'
import { useBalancesMasa } from '@/composables/useBalancesMasa'
import { useCamiones } from '@/composables/useCamiones'
import { useProducciones } from '@/composables/useProducciones'
import { calculateNet } from '@/utils/truckCalculations'
import {
  dateInRange,
  dateRangeFromQuery,
  isSingleDateRange,
  isValidDateRange,
  todayIsoDate,
} from '@/utils/date'
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  History,
  Search,
  Truck,
  X,
} from '@lucide/vue'
import { truckClassificationKey } from '@/utils/balanza'
import {
  DEFAULT_CALIBERS,
  calcularRindeProduccion,
  consumedByTruck,
  groupTrucksByBrand,
  outputRow,
  outputRows,
  productionDateForTruck,
  productionStatusLabel,
  totalOutputBoxes,
  truckAvailableBirds,
  truckBirds,
  truckConfiscations,
} from '@/utils/production'

const route = useRoute()
const router = useRouter()
const today = todayIsoDate()
const { camiones: trucks, listarCamiones } = useCamiones()
const { listarProducciones, crearProduccion, agregarCamiones } = useProducciones()
const { listarBalances, crearBalance, actualizarBalance, eliminarBalance } = useBalancesMasa()
const productions = ref([])
const massBalances = ref([])
const dateRange = reactive(dateRangeFromQuery(route.query, today))
const historySearch = ref('')
const historyStatus = ref('all')
const feedback = reactive({ message: '', type: 'success' })
const dateRangeValid = computed(() => isValidDateRange(dateRange.desde, dateRange.hasta))
const singleDateSelected = computed(() => isSingleDateRange(dateRange))
const ABSORPTION_RATE = 0.08
const DEFAULT_VISCERA_PERCENT = 15
const DEFAULT_FEATHER_PERCENT = 8
const VISCERA_MEAL_RATE = 0.2
const OIL_FROM_VISCERA_RATE = 0.1
const FEATHER_MEAL_RATE = 0.3
const TRACE_ROWS_PER_PAGE = 30
let balancesReady = false
let balanceSaveTimer = null
const tracePage = ref(1)

onMounted(async () => {
  await loadDateData()
  balancesReady = true
})

const historyStatusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En proceso', value: 'in_process' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Finalizada', value: 'completed' },
]
const productionColumns = [
  { name: 'brand', label: 'Marca comercial', field: 'brand', align: 'left' },
  {
    name: 'entryDate',
    label: 'Fecha de entrada',
    field: (row) => shortDate(row.date),
    align: 'left',
  },
  {
    name: 'blackTrucks',
    label: 'Camiones Via 2',
    field: (row) => blackTruckCount(row),
    align: 'left',
  },
  {
    name: 'whiteTrucks',
    label: 'Camiones Via 1',
    field: (row) => whiteTruckCount(row),
    align: 'left',
  },
]
const productionCardFields = [
  { label: 'Fecha de entrada', value: (group) => shortDate(group.date) },
  { label: 'Camiones Via 1', value: (group) => number(whiteTruckCount(group)) },
  { label: 'Camiones Via 2', value: (group) => number(blackTruckCount(group)) },
]
const balanceTraceColumns = [
  { name: 'lot', label: 'Lote', field: (line) => line.source.loteSenasa, align: 'left' },
]
const balanceTraceCardFields = [
  { label: 'Aves ingresadas', value: (line) => number(line.source.avesOrigen) },
  { label: 'A faenar', value: (line) => number(line.birdsToProcess) },
  { label: 'Peso promedio', value: (line) => `${decimal(line.averagePlantWeight)} kg` },
  { label: 'Kg entrada', value: (line) => `${decimal(line.inputKg)} kg` },
  {
    label: 'KG SALIDA',
    value: (line) => (line.outputKg === null ? '-' : `${decimal(line.outputKg)} kg`),
  },
  { label: 'Decomisos', value: (line) => number(confiscationsFor(line.source)) },
]

const showHistory = computed(() => false)
const showMassBalance = computed(() => true)
const showHistoryDetailPage = computed(() => false)
const dailyGroups = computed(() => groupTrucksByBrand(trucks.value, dateRange))
const filteredHistory = computed(() => {
  const term = historySearch.value.trim().toLocaleLowerCase('es')
  return [...productions.value]
    .filter(
      (production) => historyStatus.value === 'all' || production.status === historyStatus.value,
    )
    .filter((production) => {
      if (!term) return true
      const truckTerms = production.truckIds
        .map((id) => truckDataFor(production, id)?.dte || '')
        .join(' ')
      return `${brandNameFor(production)} ${production.finished?.lot || ''} ${truckTerms}`
        .toLocaleLowerCase('es')
        .includes(term)
    })
    .sort((left, right) =>
      `${right.date}${right.updatedAt}`.localeCompare(`${left.date}${left.updatedAt}`),
    )
})
const historyDetail = computed(() =>
  productions.value.find((production) => production.id === route.query.id),
)
const historyTrucks = computed(
  () =>
    historyDetail.value?.truckIds
      .map((id) => truckDataFor(historyDetail.value, id))
      .filter(Boolean) || [],
)
const historyTotals = computed(() => totalsFor(historyTrucks.value))
const historyConsumption = computed(() =>
  (historyDetail.value?.consumption || []).reduce(
    (total, item) => total + Number(item.birds || 0),
    0,
  ),
)
const balanceSourceTrucks = computed(() =>
  trucks.value
    .filter(
      (truck) =>
        dateInRange(productionDateForTruck(truck), dateRange) &&
        Boolean(truck.lineConfirmedAt) &&
        truckClassificationKey(truck) === 'blanco',
    )
    .sort((left, right) => Number(left.productionOrder || 0) - Number(right.productionOrder || 0)),
)
const selectedMassBalance = computed(() =>
  singleDateSelected.value
    ? massBalances.value.find((balance) => balance.date === dateRange.desde)
    : undefined,
)
const confirmedConsumption = computed(() => consumedByTruck(productions.value))
const balanceLines = computed(() =>
  (selectedMassBalance.value?.lines || []).map((line) => {
    const source = trucks.value.find((truck) => truck.id === line.truckId) || line.source
    const birdsToProcess = Number(confirmedConsumption.value[line.truckId] || 0)
    const sourceBirds = truckBirds(source)
    const plantNetKg = Math.max(0, calculateNet(source?.brutoPlanta, source?.taraPlanta))
    const averagePlantWeight = sourceBirds > 0 ? plantNetKg / sourceBirds : 0
    const productionYieldRate = productionYieldForTruck(line.truckId)
    const yieldRate =
      line.yieldPercent === null || line.yieldPercent === undefined
        ? productionYieldRate
        : nonNegative(line.yieldPercent) / 100
    const inputKg = birdsToProcess * averagePlantWeight
    return {
      record: line,
      source,
      birdsToProcess,
      plantNetKg,
      averagePlantWeight,
      inputKg,
      yieldRate,
      confiscationKg: confiscationsFor(source) * averagePlantWeight,
      outputKg: yieldRate === null ? null : inputKg * yieldRate,
    }
  }),
)
const tracePageCount = computed(() =>
  Math.max(1, Math.ceil(balanceLines.value.length / TRACE_ROWS_PER_PAGE)),
)
const paginatedBalanceLines = computed(() => {
  const page = Math.min(tracePage.value, tracePageCount.value)
  const start = (page - 1) * TRACE_ROWS_PER_PAGE
  return balanceLines.value.slice(start, start + TRACE_ROWS_PER_PAGE)
})
const tracePageStart = computed(() =>
  balanceLines.value.length ? (Math.min(tracePage.value, tracePageCount.value) - 1) * TRACE_ROWS_PER_PAGE + 1 : 0,
)
const tracePageEnd = computed(() =>
  Math.min(tracePageStart.value + TRACE_ROWS_PER_PAGE - 1, balanceLines.value.length),
)
const balanceTotals = computed(() => {
  const inputKg = balanceLines.value.reduce((total, line) => total + line.inputKg, 0)
  const absorptionKg = inputKg * ABSORPTION_RATE
  const visceraPercent = nonNegative(selectedMassBalance.value?.general?.visceraPercent)
  const featherPercent = nonNegative(selectedMassBalance.value?.general?.featherPercent)
  const visceraInputKg = inputKg * (visceraPercent / 100)
  const featherInputKg = inputKg * (featherPercent / 100)
  const visceraKg = visceraInputKg * VISCERA_MEAL_RATE
  const oilKg = visceraInputKg * OIL_FROM_VISCERA_RATE
  const featherKg = featherInputKg * FEATHER_MEAL_RATE
  const byproductsKg = visceraInputKg + featherInputKg
  const confiscationKg = balanceLines.value.reduce((total, line) => total + line.confiscationKg, 0)
  const yieldOutputKg = balanceLines.value.length
    ? balanceLines.value.reduce((total, line) => total + Number(line.outputKg || 0), 0)
    : null
  const balanceOutputKg = inputKg + absorptionKg - byproductsKg - confiscationKg

  return {
    inputKg,
    absorptionKg,
    visceraPercent,
    featherPercent,
    visceraInputKg,
    featherInputKg,
    visceraKg,
    featherKg,
    oilKg,
    byproductsKg,
    confiscationKg,
    yieldOutputKg,
    balanceOutputKg,
    differenceKg: yieldOutputKg === null ? null : balanceOutputKg - yieldOutputKg,
  }
})
watch(selectedMassBalance, () => scheduleBalanceSave(), { deep: true })
watch(tracePageCount, (pageCount) => {
  if (tracePage.value > pageCount) tracePage.value = pageCount
})
watch(
  () => [
    dateRange.desde,
    dateRange.hasta,
    balanceSourceTrucks.value.map((truck) => truck.id).join('|'),
  ],
  () => syncMassBalanceSources(),
  { immediate: true },
)
watch(
  () => [dateRange.desde, dateRange.hasta],
  async (range, previousRange) => {
    if (range.join('|') === previousRange.join('|') || !dateRangeValid.value) return
    await loadDateData()
    router.replace({
      path: '/produccion/balance',
      query:
        dateRange.desde === today && dateRange.hasta === today
          ? {}
          : { desde: dateRange.desde, hasta: dateRange.hasta },
    })
  },
)
watch(
  () => [route.query.desde, route.query.hasta, route.query.date],
  () => {
    const nextRange = dateRangeFromQuery(route.query, today)
    if (dateRange.desde !== nextRange.desde) dateRange.desde = nextRange.desde
    if (dateRange.hasta !== nextRange.hasta) dateRange.hasta = nextRange.hasta
  },
)

async function loadDateData() {
  productions.value = []
  massBalances.value = []
  try {
    const [camiones, producciones, balances] = await Promise.all([
      listarCamiones(dateRange),
      listarProducciones(dateRange),
      listarBalances(dateRange),
    ])
    productions.value = producciones.map(productionViewModel)
    massBalances.value = balances.map(balanceViewModel)
    return camiones
  } catch (error) {
    showFeedback(error.message, 'error')
    return []
  }
}

function setTodayRange() {
  dateRange.desde = today
  dateRange.hasta = today
}

function selectBalanceDate(date) {
  dateRange.desde = date
  dateRange.hasta = date
}

function productionViewModel(production) {
  return {
    ...production,
    outputs: DEFAULT_CALIBERS.map((caliber) => outputRow(production.outputs, caliber)),
    outputsB: outputRows(production.outputsB),
    outputsBTrozado: DEFAULT_CALIBERS.map((caliber) => outputRow(production.outputsBTrozado, caliber)),
    consumption: production.consumption,
  }
}

function balanceViewModel(balance) {
  return {
    ...balance,
    general: balanceGeneral(balance.general),
    lines: (balance.lines || []).map((line) => ({
      ...line,
      source: line.source || {},
      averageWeight: optionalNumber(line.averageWeight),
      yieldPercent: optionalNumber(line.yieldPercent),
      absorptionPercent: optionalNumber(line.absorptionPercent),
      visceraPercent: optionalNumber(line.visceraPercent),
      featherPercent: optionalNumber(line.featherPercent),
    })),
  }
}

async function createMassBalance() {
  if (selectedMassBalance.value) return
  if (!singleDateSelected.value)
    return showFeedback('Seleccioná una sola fecha para crear el balance diario', 'error')
  if (balanceSourceTrucks.value.length === 0)
    return showFeedback('No hay lotes de entrada disponibles', 'error')

  try {
    const balance = await crearBalance({
      date: dateRange.desde,
      general: balanceGeneral(),
      lines: balanceSourceTrucks.value.map((truck) => balanceLineFromTruck(truck)),
    })
    massBalances.value.push(balanceViewModel(balance))
    showFeedback('Balance diario creado y guardado en la base de datos')
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

async function deleteMassBalance() {
  const index = massBalances.value.findIndex((balance) => balance.date === dateRange.desde)
  if (index < 0) return
  try {
    await eliminarBalance(massBalances.value[index].id)
    massBalances.value.splice(index, 1)
    showFeedback('Balance diario eliminado')
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

function productionFor(group) {
  const matches = productions.value.filter(
    (production) => production.date === group.date && production.brandId === group.brandId,
  )
  const openProduction = matches.find((production) => production.status !== 'completed')
  if (openProduction) return openProduction
  const assignedIds = new Set(matches.flatMap((production) => production.truckIds))
  if (group.trucks.some((truck) => !assignedIds.has(truck.id))) return undefined
  return matches.at(-1)
}

async function openProduction(group) {
  let production = productionFor(group)
  if (!production) {
    const previousProductions = productions.value.filter(
        (item) => item.date === group.date && item.brandId === group.brandId,
    )
    const assignedIds = new Set(previousProductions.flatMap((item) => item.truckIds))
    const productionTrucks = group.trucks.filter((truck) => !assignedIds.has(truck.id))
    try {
      production = productionViewModel(
        await crearProduccion({
          date: group.date,
          brandId: group.brandId,
          product: 'Pollo entero',
          truckIds: productionTrucks.map((truck) => truck.id),
        }),
      )
      productions.value.push(production)
    } catch (error) {
      showFeedback(error.message, 'error')
      return
    }
  } else if (production.status !== 'completed') {
    const occupiedTruckIds = new Set(productions.value.flatMap((item) => item.truckIds))
    const addedTrucks = group.trucks.filter(
      (truck) => !production.truckIds.includes(truck.id) && !occupiedTruckIds.has(truck.id),
    )
    if (addedTrucks.length) {
      try {
        production = productionViewModel(
          await agregarCamiones(production.id, [
            ...production.truckIds,
            ...addedTrucks.map((truck) => truck.id),
          ]),
        )
        const index = productions.value.findIndex((item) => item.id === production.id)
        if (index >= 0) productions.value[index] = production
      } catch (error) {
        showFeedback(error.message, 'error')
        return
      }
    }
  }
  router.push({
    path: '/produccion/proceso',
    query: {
      id: production.id,
      step: nextStepFor(production),
      ...(group.date === today ? {} : { date: group.date }),
    },
  })
}

function balanceGeneral(values = {}) {
  return {
    subproductsKg: optionalNumber(values.subproductsKg),
    yieldPercent: optionalNumber(values.yieldPercent),
    absorptionPercent: optionalNumber(values.absorptionPercent),
    visceraPercent: percentageOrDefault(values.visceraPercent, DEFAULT_VISCERA_PERCENT),
    featherPercent: percentageOrDefault(values.featherPercent, DEFAULT_FEATHER_PERCENT),
  }
}

function syncMassBalanceSources() {
  const balance = selectedMassBalance.value
  if (!balance) return

  const savedLines = new Map((balance.lines || []).map((line) => [line.truckId, line]))
  const nextLines = balanceSourceTrucks.value.map((truck) =>
    balanceLineFromTruck(truck, savedLines.get(truck.id)),
  )
  const hasSameSources =
    nextLines.length === balance.lines.length &&
    nextLines.every((line, index) => line.truckId === balance.lines[index]?.truckId)

  if (!hasSameSources) {
    balance.lines = nextLines
    balance.updatedAt = new Date().toISOString()
  }
}

function scheduleBalanceSave() {
  if (!balancesReady || !selectedMassBalance.value) return
  if (balanceSaveTimer) window.clearTimeout(balanceSaveTimer)
  balanceSaveTimer = window.setTimeout(async () => {
    const balance = selectedMassBalance.value
    if (!balance) return
    try {
      await actualizarBalance(balance.id, {
        general: balance.general,
        lines: balance.lines,
      })
    } catch (error) {
      showFeedback(error.message, 'error')
    }
  }, 350)
}

function saveSubproductPercent(field, value) {
  if (!selectedMassBalance.value) return
  selectedMassBalance.value.general[field] = nonNegative(value)
  scheduleBalanceSave()
}

function updateBalanceYield(line, value) {
  if (!line?.record) return
  line.record.yieldPercent = nonNegative(value)
  scheduleBalanceSave()
}

function yieldPercentFor(line) {
  return Math.round(nonNegative(line?.yieldRate) * 10000) / 100
}

function balanceLineFromTruck(truck, savedLine = null) {
  return {
    ...savedLine,
    truckId: truck.id,
    source: { ...truck },
    averageWeight: optionalNumber(savedLine?.averageWeight),
    yieldPercent: optionalNumber(savedLine?.yieldPercent),
    absorptionPercent: optionalNumber(savedLine?.absorptionPercent),
    visceraPercent: optionalNumber(savedLine?.visceraPercent),
    featherPercent: optionalNumber(savedLine?.featherPercent),
  }
}

function nextStepFor(production) {
  if (production.status === 'completed' || production.consumptionConfirmedAt) return 'cierre'
  if (production.productionConfirmedAt) return 'cierre'
  if (production.entryConfirmedAt) return 'carga'
  return 'ingreso'
}

function goToDashboard() {
  router.push({
    path: '/produccion',
    query:
      dateRange.desde === today && dateRange.hasta === today
        ? {}
        : { desde: dateRange.desde, hasta: dateRange.hasta },
  })
}

function goToHistory() {
  router.push({ path: '/produccion/historial' })
}

function openHistoryDetail(production) {
  router.push({ path: '/produccion/historial', query: { id: production.id } })
}

function truckDataFor(production, truckId) {
  return trucks.value.find((truck) => truck.id === truckId)
}
function consumptionFor(production, truckId) {
  return production?.consumption?.find((item) => item.truckId === truckId)?.birds || 0
}

function productionYieldForTruck(truckId) {
  const production = productions.value.find(
    (item) => item.productionConfirmedAt && item.truckIds.includes(truckId),
  )
  if (!production) return null
  const productionTrucks = production.truckIds
    .map((id) => truckDataFor(production, id))
    .filter(Boolean)
  return calcularRindeProduccion(
    productionTrucks,
    production.outputs,
    production.outputsB,
    production.outputsBTrozado,
  ).rindePlanta
}

function blackTruckCount(group) {
  return truckTypeCount(group, 'negro')
}

function whiteTruckCount(group) {
  return truckTypeCount(group, 'blanco')
}

function truckTypeCount(group, type) {
  return group.trucks.filter((truck) => truckClassificationKey(truck) === type).length
}

function totalsFor(list) {
  return list.reduce(
    (totals, truck) => {
      totals.birds += birdsFor(truck)
      totals.deaths += Math.max(0, Number(truck.muertos || 0))
      totals.confiscations += confiscationsFor(truck)
      totals.available += truckAvailableBirds(truck)
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
function statusLabel(production) {
  return productionStatusLabel(production)
}
function statusClass(production) {
  return !production
    ? 'status-warning'
    : production.status === 'completed'
      ? 'status-success'
      : 'status-active'
}
function brandNameFor(production) {
  const truck = production.truckIds.map((id) => truckDataFor(production, id)).find(Boolean)
  return truck?.marcaComercial?.nombre || '-'
}
function number(value) {
  return nonNegative(value).toLocaleString('es-AR')
}
function decimal(value) {
  return nonNegative(value).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}
function kgValue(value) {
  return value === null || value === undefined ? '-' : decimal(value)
}
function signedKgValue(value) {
  if (value === null || value === undefined) return '-'
  return Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}
function nonNegative(value) {
  return Math.max(0, Number(value || 0))
}
function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null
  return nonNegative(value)
}
function percentageOrDefault(value, defaultValue) {
  const normalized = optionalNumber(value)
  return normalized === null ? defaultValue : normalized
}
function shortDate(value) {
  if (!value) return '-'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR')
}
function dateTime(value) {
  return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}
function showFeedback(message, type = 'success') {
  feedback.message = message
  feedback.type = type
  window.setTimeout(() => {
    feedback.message = ''
  }, 3000)
}
</script>
