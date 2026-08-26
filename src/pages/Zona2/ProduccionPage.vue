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
                ><span>{{ number(historyDetail.consumption?.[truck.id]) }} aves consumidas</span>
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
        <header class="page-header">
          <div>
            <h1>Balance de masa</h1>
            <p>
              Balance diario generado desde Balanza y Producción, con detalle por lote de entrada.
            </p>
          </div>
          <div class="production-header-actions">
            <button
              v-if="!selectedMassBalance"
              class="primary-action"
              type="button"
              :disabled="balanceSourceTrucks.length === 0"
              @click="createMassBalance"
            >
              Crear balance del día
            </button>
            <button v-else class="secondary-action" type="button" @click="deleteMassBalance">
              Eliminar balance
            </button>
          </div>
        </header>

        <section v-if="selectedMassBalance" class="mass-balance-summary">
          <article>
            <span>Lotes de entrada</span><strong>{{ balanceLines.length }}</strong>
          </article>
          <article>
            <span>Aves consumidas</span><strong>{{ number(balanceTotals.birdsToProcess) }}</strong>
          </article>
          <article>
            <span>Kg de entrada</span><strong>{{ decimal(balanceTotals.inputKg) }} kg</strong>
          </article>
          <article>
            <span>Salida por balance</span
            ><strong>{{ decimal(balanceTotals.balanceOutputKg) }} kg</strong>
          </article>
          <article :class="{ 'mass-balance-difference': balanceTotals.differenceKg !== 0 }">
            <span>Diferencia</span
            ><strong>{{ signedDecimal(balanceTotals.differenceKg) }} kg</strong>
          </article>
        </section>

        <section v-if="selectedMassBalance" class="mass-balance-card data-card">
          <div class="data-card-header">
            <div>
              <h2>Lotes de entrada</h2>
              <p>
                Zona 1 aporta el DTE, lote, camión y novedades. Zona 2 aporta el consumo confirmado.
              </p>
            </div>
          </div>
          <div class="mass-balance-lines">
            <article
              v-for="line in balanceLines"
              :key="line.record.truckId"
              class="mass-balance-line"
            >
              <header>
                <div>
                  <strong>{{ line.source.loteSenasa || 'Sin lote' }}</strong
                  ><small
                    >DTE {{ line.source.dte || '-' }} ·
                    {{ line.source.chasis || 'Sin patente' }}</small
                  >
                </div>
                <span>{{ line.source.client || '-' }}</span>
              </header>
              <div class="mass-balance-source">
                <div>
                  <span>Aves DTE</span
                  ><strong>{{ number(line.source.avesOrigen || line.source.avesDte) }}</strong>
                </div>
                <div>
                  <span>Muertos</span><strong>{{ number(line.source.muertos) }}</strong>
                </div>
                <div>
                  <span>Decomisos</span><strong>{{ number(line.source.decomisos) }}</strong>
                </div>
                <div>
                  <span>Consumo Zona 2</span><strong>{{ number(line.birdsToProcess) }}</strong>
                </div>
              </div>
              <div class="mass-balance-inputs">
                <NonNegativeInput
                  v-model="line.record.averageWeight"
                  outlined
                  dense
                  label="Peso promedio"
                  suffix="kg"
                />
                <NonNegativeInput
                  v-model="line.record.yieldPercent"
                  outlined
                  dense
                  label="Rinde"
                  suffix="%"
                />
                <NonNegativeInput
                  v-model="line.record.absorptionPercent"
                  outlined
                  dense
                  label="Absorción"
                  suffix="%"
                />
                <NonNegativeInput
                  v-model="line.record.visceraPercent"
                  outlined
                  dense
                  label="Vísceras"
                  suffix="%"
                />
                <NonNegativeInput
                  v-model="line.record.featherPercent"
                  outlined
                  dense
                  label="Plumas"
                  suffix="%"
                />
              </div>
              <div class="mass-balance-line-results">
                <span
                  >Entrada <strong>{{ decimal(line.metrics.inputKg) }} kg</strong></span
                >
                <span
                  >Subproductos <strong>{{ decimal(line.metrics.byproductsKg) }} kg</strong></span
                >
                <span
                  >Decomiso <strong>{{ decimal(line.metrics.confiscationKg) }} kg</strong></span
                >
                <span
                  >Salida rinde <strong>{{ decimal(line.metrics.yieldOutputKg) }} kg</strong></span
                >
                <span
                  >Salida balance
                  <strong>{{ decimal(line.metrics.balanceOutputKg) }} kg</strong></span
                >
                <span :class="{ warning: line.metrics.differenceKg !== 0 }"
                  >Diferencia
                  <strong>{{ signedDecimal(line.metrics.differenceKg) }} kg</strong></span
                >
              </div>
            </article>
          </div>
        </section>

        <section v-if="selectedMassBalance" class="mass-balance-card data-card">
          <div class="data-card-header">
            <div>
              <h2>Producto terminado de Zona 2</h2>
              <p>
                Se muestra como registro del día; la maqueta todavía no distribuye esas cajas entre
                lotes de entrada.
              </p>
            </div>
          </div>
          <div v-if="dailyFinishedLots.length" class="mass-balance-finished">
            <div v-for="production in dailyFinishedLots" :key="production.id">
              <strong>{{ production.finished?.lot || 'Sin lote' }}</strong
              ><span>{{ production.brand }} · {{ production.product }}</span
              ><span>{{ number(totalBoxes(production.outputs)) }} cajas</span>
            </div>
          </div>
          <div v-else class="production-empty">
            <PackageCheck :size="30" /><strong>Sin lotes terminados registrados</strong
            ><span>Se completarán al cerrar la producción en Zona 2.</span>
          </div>
        </section>

        <section v-else class="data-card mass-balance-empty">
          <Calculator :size="36" />
          <strong>No hay balance creado</strong>
          <span v-if="balanceSourceTrucks.length"
            >Se generará con {{ balanceSourceTrucks.length }} lote{{
              balanceSourceTrucks.length === 1 ? '' : 's'
            }}
            de entrada de Zona 1.</span
          >
          <span v-else>No hay ingresos de Balanza finalizados para generar el balance.</span>
        </section>
      </template>

      <template v-else-if="showHistory">
        <header class="page-header">
          <div>
            <h1>Historial de producción</h1>
            <p>Trazabilidad completa de entradas, consumos y producto terminado.</p>
          </div>
          <button class="secondary-action" type="button" @click="goToDashboard">
            <ArrowLeft :size="17" /> Producciones del día
          </button>
        </header>

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
                <strong>{{ production.brand }}</strong>
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
        <header class="page-header production-day-header">
          <div>
            <h1>Producciones del día</h1>
            <p>Datos recibidos automáticamente desde Balanza.</p>
          </div>
        </header>

        <section class="data-card production-list-card">
          <q-table
            flat
            row-key="brand"
            :rows="dailyGroups"
            :columns="productionColumns"
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            class="operation-table"
          >
            <template #body="props">
              <q-tr :props="props" @click="openProduction(props.row)">
                <q-td key="brand" :props="props">
                  <div class="client-cell">
                    <span class="truck-avatar"><Truck :size="19" /></span>
                    <div>
                      <strong>{{ props.row.brand }}</strong>
                    </div>
                  </div>
                </q-td>
                <q-td key="trucks" :props="props">
                  <div class="production-truck-counts">
                    <strong>{{ number(props.row.trucks.length) }} total</strong>
                    <small
                      >{{ number(whiteTruckCount(props.row)) }} blancos ·
                      {{ number(blackTruckCount(props.row)) }} negros</small
                    >
                  </div>
                </q-td>
                <q-td key="processStatus" :props="props">
                  <span :class="['status-pill', processStatusClass(props.row)]">
                    {{ processStatusLabel(props.row) }}
                  </span>
                </q-td>
              </q-tr>
            </template>
          </q-table>
          <div v-if="dailyGroups.length === 0" class="production-empty">
            <Truck :size="36" />
            <strong>No hay camiones disponibles</strong>
            <span>Los ingresos aparecerán aquí cuando Zona 1 los registre en Balanza.</span>
          </div>
        </section>
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  History,
  PackageCheck,
  Search,
  Truck,
  X,
} from '@lucide/vue'
import { truckClassificationKey } from '@/utils/balanza'
import {
  DEFAULT_CALIBERS,
  consumedByTruck,
  createId,
  groupTrucksByBrand,
  productionDateForTruck,
  productionStatusLabel,
  totalOutputBoxes,
  truckAvailableBirds,
  truckBirds,
} from '@/utils/production'

const trucksKey = 'mark-frigorifico-operacion-v2'
const productionKey = 'mark-frigorifico-produccion-v2'
const massBalanceKey = 'mark-frigorifico-balance-masa-v1'
const actor = 'Operador Producción'
const route = useRoute()
const router = useRouter()
const today = new Date().toISOString().slice(0, 10)
const trucks = ref(loadArray(trucksKey))
const productions = ref(loadArray(productionKey).map(normalizeProduction))
const massBalances = ref(loadArray(massBalanceKey).map(normalizeMassBalance))
const selectedDate = ref(typeof route.query.date === 'string' ? route.query.date : today)
const historySearch = ref('')
const historyStatus = ref('all')
const feedback = reactive({ message: '', type: 'success' })

const historyStatusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En proceso', value: 'in_process' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Finalizada', value: 'completed' },
]
const productionColumns = [
  { name: 'brand', label: 'Marca', field: 'brand', align: 'left' },
  { name: 'trucks', label: 'Camiones', field: (row) => row.trucks.length, align: 'left' },
  { name: 'processStatus', label: 'Estado', field: (row) => processStatusLabel(row), align: 'left' },
]

const showHistory = computed(() => false)
const showMassBalance = computed(() => false)
const showHistoryDetailPage = computed(() => false)
const dailyGroups = computed(() => groupTrucksByBrand(trucks.value))
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
      return `${production.brand} ${production.finished?.lot || ''} ${truckTerms}`
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
  Object.values(historyDetail.value?.consumption || {}).reduce(
    (total, value) => total + Number(value || 0),
    0,
  ),
)
const balanceSourceTrucks = computed(() =>
  trucks.value
    .filter(
      (truck) =>
        productionDateForTruck(truck) === selectedDate.value &&
        Boolean(truck.lineConfirmedAt || truck.fin),
    )
    .sort((left, right) => Number(left.productionOrder || 0) - Number(right.productionOrder || 0)),
)
const selectedMassBalance = computed(() =>
  massBalances.value.find((balance) => balance.date === selectedDate.value),
)
const confirmedConsumption = computed(() => consumedByTruck(productions.value))
const balanceLines = computed(() =>
  (selectedMassBalance.value?.lines || []).map((line) => {
    const source = trucks.value.find((truck) => truck.id === line.truckId) || line.source
    const birdsToProcess = Number(confirmedConsumption.value[line.truckId] || 0)
    return {
      record: line,
      source,
      birdsToProcess,
      metrics: calculateBalanceLine({ ...line, birdsToProcess, decomisos: source?.decomisos }),
    }
  }),
)
const balanceTotals = computed(() =>
  balanceLines.value.reduce(
    (totals, line) => {
      totals.birdsToProcess += line.birdsToProcess
      totals.inputKg += line.metrics.inputKg
      totals.balanceOutputKg += line.metrics.balanceOutputKg
      totals.differenceKg += line.metrics.differenceKg
      return totals
    },
    { birdsToProcess: 0, inputKg: 0, balanceOutputKg: 0, differenceKg: 0 },
  ),
)
const dailyFinishedLots = computed(() =>
  productions.value.filter(
    (production) => production.date === selectedDate.value && production.status === 'completed',
  ),
)

watch(productions, (value) => localStorage.setItem(productionKey, JSON.stringify(value)), {
  deep: true,
})
watch(massBalances, (value) => localStorage.setItem(massBalanceKey, JSON.stringify(value)), {
  deep: true,
})
watch(
  selectedDate,
  (date) =>
    !showHistory.value &&
    !showMassBalance.value &&
    router.replace({ path: '/produccion', query: date === today ? {} : { date } }),
)
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
    finished:
      production.finished || defaultFinished(production.date || today, production.brand || ''),
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

function normalizeMassBalance(balance) {
  return {
    ...balance,
    lines: (balance.lines || []).map((line) => ({
      ...line,
      source: line.source || {},
      averageWeight: nonNegative(line.averageWeight),
      yieldPercent: nonNegative(line.yieldPercent),
      absorptionPercent: nonNegative(line.absorptionPercent || 8),
      visceraPercent: nonNegative(line.visceraPercent || 15),
      featherPercent: nonNegative(line.featherPercent || 8),
    })),
  }
}

function createMassBalance() {
  if (selectedMassBalance.value) return
  if (balanceSourceTrucks.value.length === 0)
    return showFeedback('No hay lotes de entrada disponibles', 'error')

  massBalances.value.push(
    normalizeMassBalance({
      id: createId(),
      date: selectedDate.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: balanceSourceTrucks.value.map((truck) => ({
        truckId: truck.id,
        source: { ...truck },
        averageWeight: 0,
        yieldPercent: 0,
        absorptionPercent: 8,
        visceraPercent: 15,
        featherPercent: 8,
      })),
    }),
  )
  showFeedback('Balance diario creado con los lotes de Balanza')
}

function deleteMassBalance() {
  const index = massBalances.value.findIndex((balance) => balance.date === selectedDate.value)
  if (index < 0) return
  massBalances.value.splice(index, 1)
  showFeedback('Balance diario eliminado')
}

function calculateBalanceLine(line) {
  const birdsToProcess = nonNegative(line.birdsToProcess)
  const averageWeight = nonNegative(line.averageWeight)
  const inputKg = birdsToProcess * averageWeight
  const absorptionKg = inputKg * (nonNegative(line.absorptionPercent) / 100)
  const visceraKg = inputKg * (nonNegative(line.visceraPercent) / 100)
  const featherKg = inputKg * (nonNegative(line.featherPercent) / 100)
  const byproductsKg = visceraKg + featherKg
  const confiscationKg = averageWeight * nonNegative(line.decomisos)
  const yieldOutputKg = inputKg * (nonNegative(line.yieldPercent) / 100)
  const balanceOutputKg = inputKg + absorptionKg - byproductsKg - confiscationKg
  return {
    inputKg,
    absorptionKg,
    visceraKg,
    featherKg,
    byproductsKg,
    confiscationKg,
    yieldOutputKg,
    balanceOutputKg,
    differenceKg: balanceOutputKg - yieldOutputKg,
  }
}

function productionFor(group) {
  const matches = productions.value.filter(
    (production) => production.date === selectedDate.value && production.brand === group.brand,
  )
  const openProduction = matches.find((production) => production.status !== 'completed')
  if (openProduction) return openProduction
  const assignedIds = new Set(matches.flatMap((production) => production.truckIds))
  if (group.trucks.some((truck) => !assignedIds.has(truck.id))) return undefined
  return matches.at(-1)
}

function openProduction(group) {
  let production = productionFor(group)
  if (!production) {
    const previousProductions = productions.value.filter(
      (item) => item.date === selectedDate.value && item.brand === group.brand,
    )
    const assignedIds = new Set(previousProductions.flatMap((item) => item.truckIds))
    const productionTrucks = group.trucks.filter((truck) => !assignedIds.has(truck.id))
    const sequence = previousProductions.length + 1
    production = normalizeProduction({
      id: createId(),
      date: selectedDate.value,
      brand: group.brand,
      truckIds: productionTrucks.map((truck) => truck.id),
      truckOrder: Object.fromEntries(
        productionTrucks.map((truck, index) => [
          truck.id,
          Number(truck.productionOrder) || index + 1,
        ]),
      ),
      truckSnapshots: Object.fromEntries(productionTrucks.map((truck) => [truck.id, { ...truck }])),
      status: 'in_process',
      requiredBirds: 0,
      finished: defaultFinished(selectedDate.value, group.brand, sequence),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    addEvent(production, 'Producción iniciada')
    productions.value.push(production)
  } else if (production.status !== 'completed') {
    const addedTrucks = group.trucks.filter((truck) => !production.truckIds.includes(truck.id))
    production.truckIds.push(...addedTrucks.map((truck) => truck.id))
    addedTrucks.forEach((truck) => {
      production.truckSnapshots[truck.id] = { ...truck }
      production.truckOrder[truck.id] =
        Number(truck.productionOrder) || Object.keys(production.truckOrder).length + 1
    })
  }
  router.push({
    path: '/produccion/proceso',
    query: {
      id: production.id,
      step: nextStepFor(production),
      ...(selectedDate.value === today ? {} : { date: selectedDate.value }),
    },
  })
}

function nextStepFor(production) {
  if (production.status === 'completed' || production.consumptionConfirmedAt) return 'cierre'
  if (production.productionConfirmedAt) return 'consumo'
  if (production.entryConfirmedAt) return 'carga'
  return 'ingreso'
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

function goToDashboard() {
  router.push({
    path: '/produccion',
    query: selectedDate.value === today ? {} : { date: selectedDate.value },
  })
}

function goToHistory() {
  router.push({ path: '/produccion/historial' })
}

function openHistoryDetail(production) {
  router.push({ path: '/produccion/historial', query: { id: production.id } })
}

function truckDataFor(production, truckId) {
  return production?.truckSnapshots?.[truckId] || trucks.value.find((truck) => truck.id === truckId)
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
  return Math.max(0, Number(truck.decomisos || 0))
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
      : production.status === 'draft'
        ? 'status-neutral'
        : 'status-active'
}
function processStatusLabel(group) {
  const production = productionFor(group)
  if (production?.status === 'completed') return 'Finalizada'
  const step = production ? nextStepFor(production) : 'ingreso'
  return {
    ingreso: 'Ingreso',
    carga: 'Producción',
    consumo: 'Consumo',
    cierre: 'Cierre',
  }[step]
}
function processStatusClass(group) {
  const production = productionFor(group)
  if (production?.status === 'completed') return 'status-success'
  const step = production ? nextStepFor(production) : 'ingreso'
  return step === 'ingreso' ? 'status-warning' : step === 'cierre' ? 'status-success' : 'status-active'
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
function decimal(value) {
  return nonNegative(value).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}
function signedDecimal(value) {
  const numeric = Number(value || 0)
  return `${numeric > 0 ? '+' : ''}${numeric.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })}`
}
function nonNegative(value) {
  return Math.max(0, Number(value || 0))
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
