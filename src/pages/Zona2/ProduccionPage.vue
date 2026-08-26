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
            <span class="eyebrow"><Calculator :size="14" /> ZONA 2</span>
            <h1>Balance de masa</h1>
            <p>
              Balance diario generado desde Balanza y Producción, con detalle por lote de entrada.
            </p>
          </div>
          <div class="production-header-actions">
            <DateInput v-model="selectedDate" label="Fecha" />
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
          <strong>No hay balance creado para esta fecha</strong>
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
            <span class="eyebrow"><History :size="14" /> ZONA 2</span>
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

      <template v-else-if="!activeProduction">
        <header class="page-header production-day-header">
          <div>
            <span class="eyebrow"><Factory :size="14" /> ZONA 2</span>
            <h1>Producciones del día</h1>
            <p>{{ longDate(selectedDate) }} · Datos recibidos automáticamente desde Balanza.</p>
          </div>
          <div class="production-header-actions">
            <DateInput v-model="selectedDate" label="Fecha" />
            <button
              class="primary-action"
              type="button"
              :disabled="dailyGroups.length === 0"
              @click="startNextProduction"
            >
              <Play :size="17" /> Iniciar producción
            </button>
          </div>
        </header>

        <section class="data-card production-list-card">
          <div class="production-list-head">
            <span>Marca</span><span>Aves</span><span>Disponibles</span><span>Estado</span
            ><span></span>
          </div>
          <button
            v-for="group in dailyGroups"
            :key="group.brand"
            class="production-list-row"
            type="button"
            @click="openProduction(group)"
          >
            <span class="production-brand-mark">{{ initials(group.brand) }}</span>
            <span class="production-brand-copy"
              ><strong>{{ group.brand }}</strong
              ><small
                >{{ group.trucks.length }} camión{{ group.trucks.length === 1 ? '' : 'es' }}</small
              ></span
            >
            <strong class="production-birds">{{ number(groupBirds(group)) }}</strong>
            <strong class="production-available">{{ number(groupAvailable(group)) }}</strong>
            <span :class="['status-pill', statusClass(productionFor(group))]">{{
              statusLabel(productionFor(group))
            }}</span>
            <ChevronRight :size="19" />
          </button>
          <div v-if="dailyGroups.length === 0" class="production-empty">
            <Truck :size="36" />
            <strong>No hay camiones para esta fecha</strong>
            <span>Los ingresos aparecerán aquí cuando Zona 1 los registre en Balanza.</span>
          </div>
        </section>
      </template>

      <template v-else>
        <header class="production-flow-header">
          <button class="production-back" type="button" @click="goToDashboard">
            <ArrowLeft :size="18" /> Volver
          </button>
          <div>
            <span>{{ shortDate(activeProduction.date) }}</span>
            <h1>{{ activeProduction.brand }}</h1>
          </div>
          <span :class="['status-pill', statusClass(activeProduction)]">{{
            statusLabel(activeProduction)
          }}</span>
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

        <section v-if="currentStep === 'ingreso'" class="production-stage">
          <div class="production-stage-heading">
            <div>
              <span>01</span>
              <div>
                <h2>Ingreso / materia prima</h2>
                <p>Información consolidada desde Zona 1. No requiere una nueva carga.</p>
              </div>
            </div>
            <LockKeyhole :size="19" />
          </div>

          <div class="raw-material-grid">
            <article v-for="truck in activeTrucks" :key="truck.id" class="raw-material-card">
              <header>
                <span class="truck-avatar"><Truck :size="19" /></span>
                <div>
                  <strong>{{ truck.chasis || 'Sin patente' }}</strong
                  ><small>DTE {{ truck.dte || '-' }}</small>
                </div>
                <span>{{ truck.loteSenasa || '-' }}</span>
              </header>
              <div class="truck-use-order">
                <span>Orden de producción</span><strong>{{ truckUseOrder(truck.id) }}</strong>
              </div>
              <dl>
                <div>
                  <dt>Aves</dt>
                  <dd>{{ number(birdsFor(truck)) }}</dd>
                </div>
                <div>
                  <dt>Muertos</dt>
                  <dd>{{ number(truck.muertos) }}</dd>
                </div>
                <div>
                  <dt>Decomisos</dt>
                  <dd>{{ number(confiscationsFor(truck)) }}</dd>
                </div>
                <div class="available">
                  <dt>Disponibles</dt>
                  <dd>{{ number(availableForTruck(truck)) }}</dd>
                </div>
              </dl>
            </article>
          </div>

          <div class="production-totals">
            <div>
              <span>Total aves</span><strong>{{ number(activeTotals.birds) }}</strong>
            </div>
            <div>
              <span>Muertos</span><strong>{{ number(activeTotals.deaths) }}</strong>
            </div>
            <div>
              <span>Decomisos</span><strong>{{ number(activeTotals.confiscations) }}</strong>
            </div>
            <div class="accent">
              <span>Disponibles</span><strong>{{ number(activeTotals.available) }}</strong>
            </div>
          </div>
          <div class="production-stage-actions">
            <button class="primary-action" type="button" @click="confirmEntry">
              Continuar <ArrowRight :size="17" />
            </button>
          </div>
        </section>

        <section v-if="currentStep === 'carga'" class="production-stage">
          <div class="production-stage-heading">
            <div>
              <span>02</span>
              <div>
                <h2>Producción del día</h2>
                <p>Una sola carga genera internamente las órdenes necesarias por calibre.</p>
              </div>
            </div>
            <q-select
              v-model="activeProduction.product"
              outlined
              dense
              :options="productOptions"
              label="Producto"
            />
          </div>

          <div class="output-table">
            <div class="output-table-head"><span>Calibre</span><span>Cajas producidas</span></div>
            <div
              v-for="output in activeProduction.outputs"
              :key="output.caliber"
              class="output-table-row"
            >
              <div>
                <span class="caliber-dot"></span><strong>{{ output.caliber }}</strong>
              </div>
              <NonNegativeInput v-model="output.boxes" outlined dense suffix="cajas" />
            </div>
            <div class="output-table-total">
              <span>Total cajas</span
              ><strong>{{ number(totalBoxes(activeProduction.outputs)) }}</strong>
            </div>
          </div>

          <div class="production-stage-actions split-actions">
            <button class="secondary-action" type="button" @click="saveDraft">
              <Save :size="17" /> Guardar borrador
            </button>
            <button class="primary-action" type="button" @click="confirmOutput">
              Confirmar producción <ArrowRight :size="17" />
            </button>
          </div>
        </section>

        <section v-if="currentStep === 'consumo'" class="production-stage">
          <div class="production-stage-heading">
            <div>
              <span>03</span>
              <div>
                <h2>Consumo de materia prima</h2>
                <p>Propuesta automática según el orden de uso indicado para cada camión.</p>
              </div>
            </div>
          </div>

          <div class="consumption-meter">
            <label
              ><span>Aves necesarias</span
              ><NonNegativeInput
                v-model="activeProduction.requiredBirds"
                :minimum="1"
                outlined
                dense
                @change="applyFifo"
            /></label>
            <div>
              <span>Seleccionadas</span><strong>{{ number(selectedConsumption) }}</strong>
            </div>
            <div :class="{ warning: consumptionDifference !== 0 }">
              <span>Diferencia</span><strong>{{ signedNumber(consumptionDifference) }}</strong>
            </div>
          </div>

          <div class="consumption-list">
            <article v-for="truck in activeTrucks" :key="truck.id">
              <div class="consumption-truck">
                <span class="truck-avatar"><Truck :size="18" /></span>
                <div>
                  <strong>{{ truck.chasis || 'Sin patente' }}</strong
                  ><small>DTE {{ truck.dte || '-' }} · {{ truck.loteSenasa || 'Sin lote' }}</small>
                </div>
              </div>
              <div class="consumption-available">
                <span>Disponible</span><strong>{{ number(availableForTruck(truck)) }}</strong>
              </div>
              <div class="consumption-order">
                <span>Orden</span><strong>{{ truckUseOrder(truck.id) }}</strong>
              </div>
              <NonNegativeInput
                v-model="activeProduction.consumption[truck.id]"
                :max="availableForTruck(truck)"
                outlined
                dense
                label="Usar"
              />
            </article>
          </div>

          <div class="production-stage-actions">
            <button class="primary-action" type="button" @click="confirmConsumption">
              <CheckCircle2 :size="17" /> Confirmar consumo
            </button>
          </div>
        </section>

        <section v-if="currentStep === 'cierre'" class="production-stage closure-stage">
          <div class="production-stage-heading">
            <div>
              <span>04</span>
              <div>
                <h2>Cierre de producción</h2>
                <p>Revisión final antes de generar el stock terminado para Zona 3.</p>
              </div>
            </div>
          </div>

          <div class="closure-grid">
            <div class="closure-summary">
              <section>
                <h3>Entrada</h3>
                <div>
                  <span>Aves ingresadas</span><strong>{{ number(activeTotals.birds) }}</strong>
                </div>
                <div>
                  <span>Muertos</span><strong>{{ number(activeTotals.deaths) }}</strong>
                </div>
                <div>
                  <span>Decomisos</span><strong>{{ number(activeTotals.confiscations) }}</strong>
                </div>
              </section>
              <section>
                <h3>Consumo</h3>
                <div>
                  <span>Aves utilizadas</span><strong>{{ number(selectedConsumption) }}</strong>
                </div>
                <div>
                  <span>Aves restantes</span
                  ><strong>{{ number(activeTotals.available - selectedConsumption) }}</strong>
                </div>
              </section>
              <section>
                <h3>Producto terminado</h3>
                <div v-for="output in producedOutputs" :key="output.caliber">
                  <span>{{ output.caliber }}</span
                  ><strong>{{ number(output.boxes) }} cajas</strong>
                </div>
                <div class="closure-total">
                  <span>Total</span
                  ><strong>{{ number(totalBoxes(activeProduction.outputs)) }} cajas</strong>
                </div>
              </section>
            </div>
            <div class="finished-data">
              <h3>Identificación del lote</h3>
              <q-input
                v-model="activeProduction.finished.lot"
                outlined
                dense
                label="Lote"
                :readonly="activeProduction.status === 'completed'"
              />
              <q-input
                v-model="activeProduction.finished.clientCode"
                outlined
                dense
                label="Código de cliente"
                :readonly="activeProduction.status === 'completed'"
              />
              <DateInput
                v-model="activeProduction.finished.manufactureDate"
                label="Fabricación"
                :readonly="activeProduction.status === 'completed'"
              />
              <DateInput
                v-model="activeProduction.finished.expirationDate"
                label="Vencimiento"
                :readonly="activeProduction.status === 'completed'"
              />
              <div class="stock-callout">
                <PackageCheck :size="22" />
                <div>
                  <strong>Alta de stock automática</strong
                  ><span
                    >Se generarán {{ number(totalBoxes(activeProduction.outputs)) }} cajas trazadas
                    al lote {{ activeProduction.finished.lot || '-' }}.</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="production-stage-actions">
            <button
              class="primary-action"
              type="button"
              :disabled="activeProduction.status === 'completed'"
              @click="closeProduction"
            >
              <PackageCheck :size="17" />
              {{
                activeProduction.status === 'completed' ? 'Producción cerrada' : 'Cerrar producción'
              }}
            </button>
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
import DateInput from '@/components/DateInput.vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Factory,
  History,
  LockKeyhole,
  PackageCheck,
  Play,
  Save,
  Search,
  Truck,
  X,
} from '@lucide/vue'
import {
  DEFAULT_CALIBERS,
  consumedByTruck,
  createId,
  groupTrucksByBrand,
  productionDateForTruck,
  productionStatusLabel,
  proposeFifoConsumption,
  totalOutputBoxes,
  truckAvailableBirds,
  truckBirds,
} from '@/utils/production'

const trucksKey = 'mark-frigorifico-operacion-v2'
const productionKey = 'mark-frigorifico-produccion-v2'
const finishedStockKey = 'mark-frigorifico-stock-terminado-v1'
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

const productOptions = ['Pollo entero']
const historyStatusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En proceso', value: 'in_process' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Finalizada', value: 'completed' },
]
const flowSteps = [
  { number: '1', value: 'ingreso', label: 'Ingreso' },
  { number: '2', value: 'carga', label: 'Producción' },
  { number: '3', value: 'consumo', label: 'Consumo' },
  { number: '4', value: 'cierre', label: 'Cierre' },
]

const showHistory = computed(() => route.query.view === 'historial')
const showMassBalance = computed(() => route.query.view === 'balance')
const showHistoryDetailPage = computed(
  () => showHistory.value && typeof route.query.id === 'string',
)
const activeProduction = computed(() =>
  showHistory.value
    ? undefined
    : productions.value.find((production) => production.id === route.query.id),
)
const currentStep = computed(() => {
  const requested = route.query.step
  if (flowSteps.some((step) => step.value === requested) && canOpenStep(requested)) return requested
  return activeProduction.value ? nextStepFor(activeProduction.value) : 'ingreso'
})
const dailyGroups = computed(() => groupTrucksByBrand(trucks.value, selectedDate.value))
const activeTrucks = computed(() => {
  if (!activeProduction.value) return []
  return activeProduction.value.truckIds
    .map((id) => truckDataFor(activeProduction.value, id))
    .filter(Boolean)
    .sort((left, right) => truckUseOrder(left.id) - truckUseOrder(right.id))
})
const priorConsumption = computed(() =>
  consumedByTruck(productions.value, activeProduction.value?.id),
)
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
    !activeProduction.value &&
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
    return showFeedback('No hay lotes de entrada disponibles para esta fecha', 'error')

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
  goToStep(nextStepFor(production), production.id)
}

function startNextProduction() {
  const group =
    dailyGroups.value.find((item) => productionFor(item)?.status !== 'completed') ||
    dailyGroups.value[0]
  if (group) openProduction(group)
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

function saveDraft() {
  const production = activeProduction.value
  production.status = 'draft'
  production.updatedAt = new Date().toISOString()
  addEvent(production, 'Producción guardada como borrador')
  showFeedback('Borrador guardado')
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
    path: '/produccion',
    query: { id, step, ...(selectedDate.value === today ? {} : { date: selectedDate.value }) },
  })
}

function goToDashboard() {
  router.push({
    path: '/produccion',
    query: selectedDate.value === today ? {} : { date: selectedDate.value },
  })
}

function goToHistory() {
  router.push({ path: '/produccion', query: { view: 'historial' } })
}

function openHistoryDetail(production) {
  router.push({ path: '/produccion', query: { view: 'historial', id: production.id } })
}

function truckDataFor(production, truckId) {
  return production?.truckSnapshots?.[truckId] || trucks.value.find((truck) => truck.id === truckId)
}

function groupBirds(group) {
  return group.trucks.reduce((total, truck) => total + birdsFor(truck), 0)
}

function groupAvailable(group) {
  return group.trucks.reduce(
    (total, truck) =>
      total +
      Math.max(
        0,
        truckAvailableBirds(truck) - Number(consumedByTruck(productions.value)[truck.id] || 0),
      ),
    0,
  )
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
function signedNumber(value) {
  const numeric = Number(value || 0)
  return `${numeric > 0 ? '+' : ''}${numeric.toLocaleString('es-AR')}`
}
function shortDate(value) {
  if (!value) return '-'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR')
}
function longDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
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
