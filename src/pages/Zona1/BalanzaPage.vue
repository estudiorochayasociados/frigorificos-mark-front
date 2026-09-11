<template>
  <q-page class="page-shell">
    <div class="page-content">
      <PageHeader
        title="Balanza"
        description="Registra ingresos, pesos y documentacion de cada camion."
      >
        <template #actions>
          <button class="primary-action" type="button" @click="newTruck">
            <Plus :size="20" /> Nuevo camion
          </button>
        </template>
      </PageHeader>

      <section class="date-range-filters balanza-filters" aria-label="Filtro de balanza">
        <DateInput v-model="dateRange.desde" label="Desde" />
        <DateInput v-model="dateRange.hasta" label="Hasta" />
        <button class="secondary-action" type="button" @click="setTodayRange">Ver hoy</button>
        <span v-if="!dateRangeValid" class="date-range-error"
          >La fecha desde no puede ser posterior a la fecha hasta.</span
        >
      </section>

      <ResponsiveDataTable
        :rows="orderedTrucks"
        :columns="columns"
        :mobile-fields="truckCardFields"
        clickable
        @select="openTruckAction"
      >
        <template #desktop-body="props">
          <q-tr
            :props="props"
            :class="{
              'dragging-row': draggedTruckId === props.row.id,
              'selected-action-row': isTruckActionOpen(props.row),
            }"
            @click="openTruckAction(props.row)"
            @dragover.prevent
            @drop="dropTruck(props.row)"
          >
            <q-td key="productionOrder" :props="props" class="order-cell" @click.stop>
              <span
                class="drag-handle"
                :draggable="canReorder"
                title="Arrastrar para ordenar"
                @dragstart="startTruckDrag(props.row, $event)"
                @dragend="endTruckDrag"
              >
                <GripVertical :size="16" />
                <strong>{{ productionOrderForTruck(props.row) }}</strong>
              </span>
            </q-td>
            <q-td key="client" :props="props">
              <div class="client-cell">
                <span class="truck-avatar"><Truck :size="19" /></span>
                <div>
                  <strong>{{ props.row.client }}</strong
                  ><small>{{ props.row.dte || 'Sin DTE' }}</small>
                </div>
              </div>
            </q-td>
            <q-td key="patentes" :props="props">
              {{ props.row.chasis }} / {{ props.row.acoplado || '-' }}
            </q-td>
            <q-td key="classification" :props="props">
              <span :class="['status-pill', truckClassificationClass(props.row)]">
                {{ truckClassificationLabel(props.row) }}
              </span>
            </q-td>
            <q-td key="date" :props="props">{{ truckDate(props.row) }}</q-td>
            <q-td key="status" :props="props">
              <span :class="['status-pill', truckStatusClass(props.row)]">
                {{ truckStatusLabel(props.row) }}
              </span>
            </q-td>
            <q-td key="actions" :props="props" class="actions-cell" @click.stop>
              <button class="table-icon-action" type="button" @click="deleteTruck(props.row)">
                <Trash2 :size="16" />
                Eliminar
              </button>
            </q-td>
          </q-tr>
          <q-tr v-if="isTruckActionOpen(props.row)" :props="props" class="truck-action-row">
            <q-td colspan="100%">
              <div class="truck-inline-actions">
                <span>¿Qué querés hacer con este camión?</span>
                <button type="button" @click.stop="goToTruckEntry(props.row)">
                  <Pencil :size="16" /> Modificar ingreso
                </button>
                <button type="button" @click.stop="goToTruckFaena(props.row)">
                  <ClipboardCheck :size="16" /> Cargar faena
                </button>
              </div>
            </q-td>
          </q-tr>
        </template>
        <template #mobile-leading
          ><span class="truck-avatar"><Truck :size="20" /></span
        ></template>
        <template #mobile-title="{ row }">{{ row.client }}</template>
        <template #mobile-subtitle="{ row }">{{ row.chasis }} / {{ row.acoplado || '-' }}</template>
        <template #mobile-status="{ row }">
          <span :class="['status-pill', truckStatusClass(row)]">{{ truckStatusLabel(row) }}</span>
        </template>
        <template #mobile-actions="{ row }">
          <template v-if="isTruckActionOpen(row)">
            <button type="button" @click="goToTruckEntry(row)">
              <Pencil :size="16" /> Modificar
            </button>
            <button type="button" @click="goToTruckFaena(row)">
              <ClipboardCheck :size="16" /> Faena
            </button>
          </template>
          <button
            type="button"
            aria-label="Subir en el orden de producción"
            :disabled="!canReorder || productionOrderForTruck(row) === 1"
            @click="moveTruck(row, -1)"
          >
            <ArrowUp :size="16" />
          </button>
          <button
            type="button"
            aria-label="Bajar en el orden de producción"
            :disabled="!canReorder || productionOrderForTruck(row) === orderedTrucks.length"
            @click="moveTruck(row, 1)"
          >
            <ArrowDown :size="16" />
          </button>
          <button class="danger" type="button" @click="deleteTruck(row)">
            <Trash2 :size="16" /> Eliminar
          </button>
        </template>
      </ResponsiveDataTable>
    </div>

    <div v-if="feedback.message" :class="['feedback-toast', `feedback-toast--${feedback.type}`]">
      <CheckCircle2 :size="19" /><span>{{ feedback.message }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog } from 'quasar'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardCheck,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Truck,
} from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import DateInput from '@/components/DateInput.vue'
import { useCamiones } from '@/composables/useCamiones'
import { dateRangeFromQuery, isValidDateRange, todayIsoDate } from '@/utils/date'
import {
  compareProductionOrder,
  productionOrderFor,
  truckClassificationClass,
  truckClassificationLabel,
  truckDate,
  truckStatusClass,
  truckStatusLabel,
} from '@/utils/balanza'

const router = useRouter()
const route = useRoute()
const today = todayIsoDate()
const dateRange = reactive(dateRangeFromQuery(route.query, today))
const {
  camiones,
  listarCamiones,
  eliminarCamion: eliminarCamionApi,
  ordenarCamiones,
} = useCamiones()
const trucks = camiones
const draggedTruckId = ref(null)
const feedback = reactive({ message: '', type: 'success' })
const selectedTruckId = ref('')
const dateRangeValid = computed(() => isValidDateRange(dateRange.desde, dateRange.hasta))
const canReorder = computed(() => dateRangeValid.value && dateRange.desde === dateRange.hasta)

const columns = [
  { name: 'productionOrder', label: 'Orden', field: 'productionOrder', align: 'left' },
  { name: 'client', label: 'Cliente', field: 'client', align: 'left' },
  { name: 'patentes', label: 'Patentes', field: 'chasis', align: 'left' },
  { name: 'classification', label: 'Vía', field: 'classification', align: 'left' },
  { name: 'date', label: 'Fecha de entrada', field: (row) => truckDate(row), align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' },
]

const orderedTrucks = computed(() => [...trucks.value].sort(compareProductionOrder(trucks.value)))
const truckCardFields = [
  { label: 'Fecha de entrada', value: (truck) => truckDate(truck) },
  { label: 'Orden', value: (truck) => productionOrderForTruck(truck) },
  { label: 'Vía', value: (truck) => truckClassificationLabel(truck) },
  { label: 'DTE', value: (truck) => truck.dte || 'Sin DTE' },
]

onMounted(async () => {
  try {
    await listarCamiones(dateRange)
  } catch (error) {
    showFeedback(error.message, 'error')
  }
})

watch(
  () => [dateRange.desde, dateRange.hasta],
  async (range, previousRange) => {
    if (range.join('|') === previousRange.join('|') || !dateRangeValid.value) return
    try {
      await listarCamiones(dateRange)
      await router.replace({
        path: '/balanza',
        query:
          dateRange.desde === today && dateRange.hasta === today
            ? {}
            : { desde: dateRange.desde, hasta: dateRange.hasta },
      })
    } catch (error) {
      showFeedback(error.message, 'error')
    }
  },
)

watch(
  () => [route.query.desde, route.query.hasta, route.query.fecha],
  () => {
    const nextRange = dateRangeFromQuery(route.query, today)
    if (dateRange.desde !== nextRange.desde) dateRange.desde = nextRange.desde
    if (dateRange.hasta !== nextRange.hasta) dateRange.hasta = nextRange.hasta
  },
)

function setTodayRange() {
  dateRange.desde = today
  dateRange.hasta = today
}

function productionOrderForTruck(truck) {
  return productionOrderFor(trucks.value, truck)
}

function newTruck() {
  router.push('/balanza/form1')
}

function openTruckAction(truck) {
  const truckId = String(truck.id)
  selectedTruckId.value = selectedTruckId.value === truckId ? '' : truckId
}

function isTruckActionOpen(truck) {
  return selectedTruckId.value === String(truck.id)
}

function goToTruckEntry(truck) {
  router.push({ name: 'balanza-form1', params: { id: String(truck.id) } })
}

function goToTruckFaena(truck) {
  router.push({ name: 'balanza-form2', params: { id: String(truck.id) } })
}

function deleteTruck(truck) {
  Dialog.create({
    title: 'Eliminar camión',
    message: `¿Eliminar el camión de ${truck.client}?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await eliminarCamionApi(truck.id)
      const remaining = orderedTrucks.value
        .filter((item) => item.id !== truck.id)
        .map((item, index) => (canReorder.value ? { ...item, productionOrder: index + 1 } : item))
      trucks.value = remaining
      if (remaining.length && canReorder.value) {
        await ordenarCamiones(
          remaining.map((item) => item.id),
          dateRange.desde,
        )
      }
      showFeedback('Camión eliminado correctamente')
    } catch (error) {
      showFeedback(error.message, 'error')
    }
  })
}

function startTruckDrag(truck, event) {
  if (!canReorder.value) return
  draggedTruckId.value = truck.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', truck.id)
}

async function dropTruck(targetTruck) {
  if (!canReorder.value) return endTruckDrag()
  const draggedId = draggedTruckId.value
  if (!draggedId || draggedId === targetTruck.id) return endTruckDrag()

  const reorderedTrucks = [...orderedTrucks.value]
  const fromIndex = reorderedTrucks.findIndex((truck) => truck.id === draggedId)
  const toIndex = reorderedTrucks.findIndex((truck) => truck.id === targetTruck.id)
  if (fromIndex < 0 || toIndex < 0) return endTruckDrag()

  const [draggedTruck] = reorderedTrucks.splice(fromIndex, 1)
  reorderedTrucks.splice(toIndex, 0, draggedTruck)
  const reordered = reorderedTrucks.map((truck, index) => ({
    ...truck,
    productionOrder: index + 1,
  }))
  trucks.value = reordered
  try {
    await ordenarCamiones(
      reordered.map((truck) => truck.id),
      dateRange.desde,
    )
  } catch (error) {
    showFeedback(error.message, 'error')
    await listarCamiones(dateRange)
  }
  endTruckDrag()
}

function endTruckDrag() {
  draggedTruckId.value = null
}

async function moveTruck(truck, offset) {
  if (!canReorder.value) return
  const reorderedTrucks = [...orderedTrucks.value]
  const fromIndex = reorderedTrucks.findIndex((item) => item.id === truck.id)
  const toIndex = fromIndex + offset
  if (fromIndex < 0 || toIndex < 0 || toIndex >= reorderedTrucks.length) return
  const [movedTruck] = reorderedTrucks.splice(fromIndex, 1)
  reorderedTrucks.splice(toIndex, 0, movedTruck)
  const reordered = reorderedTrucks.map((item, index) => ({ ...item, productionOrder: index + 1 }))
  trucks.value = reordered
  try {
    await ordenarCamiones(
      reordered.map((item) => item.id),
      dateRange.desde,
    )
  } catch (error) {
    showFeedback(error.message, 'error')
    await listarCamiones(dateRange)
  }
}

function showFeedback(message, type = 'success') {
  feedback.message = message
  feedback.type = type
  window.setTimeout(() => {
    feedback.message = ''
  }, 2800)
}
</script>
