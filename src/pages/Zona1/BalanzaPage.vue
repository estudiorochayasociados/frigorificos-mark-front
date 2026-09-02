<template>
  <q-page class="page-shell">
    <div class="page-content">
      <PageHeader title="Balanza" description="Registra ingresos, pesos y documentacion de cada camion.">
        <template #actions>
          <button class="primary-action" type="button" @click="newTruck"><Plus :size="20" /> Nuevo camion</button>
        </template>
      </PageHeader>

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
                  draggable="true"
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
          <template #mobile-leading><span class="truck-avatar"><Truck :size="20" /></span></template>
          <template #mobile-title="{ row }">{{ row.client }}</template>
          <template #mobile-subtitle="{ row }">{{ row.chasis }} / {{ row.acoplado || '-' }}</template>
          <template #mobile-status="{ row }">
            <span :class="['status-pill', truckStatusClass(row)]">{{ truckStatusLabel(row) }}</span>
          </template>
          <template #mobile-actions="{ row }">
            <template v-if="isTruckActionOpen(row)">
              <button type="button" @click="goToTruckEntry(row)"><Pencil :size="16" /> Modificar</button>
              <button type="button" @click="goToTruckFaena(row)"><ClipboardCheck :size="16" /> Faena</button>
            </template>
            <button
              type="button"
              aria-label="Subir en el orden de producción"
              :disabled="productionOrderForTruck(row) === 1"
              @click="moveTruck(row, -1)"
            >
              <ArrowUp :size="16" />
            </button>
            <button
              type="button"
              aria-label="Bajar en el orden de producción"
              :disabled="productionOrderForTruck(row) === orderedTrucks.length"
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

    <div v-if="feedback" class="feedback-toast">
      <CheckCircle2 :size="19" /><span>{{ feedback }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import {
  compareProductionOrder,
  loadBalanzaTrucks,
  productionOrderFor,
  saveBalanzaTrucks,
  truckClassificationClass,
  truckClassificationLabel,
  truckDate,
  truckStatusClass,
  truckStatusLabel,
} from '@/utils/balanza'

const router = useRouter()
const trucks = ref(loadBalanzaTrucks())
const draggedTruckId = ref(null)
const feedback = ref('')
const selectedTruckId = ref('')

const columns = [
  { name: 'productionOrder', label: 'Orden', field: 'productionOrder', align: 'left' },
  { name: 'client', label: 'Cliente', field: 'client', align: 'left' },
  { name: 'patentes', label: 'Patentes', field: 'chasis', align: 'left' },
  { name: 'classification', label: 'Tipo', field: 'classification', align: 'left' },
  { name: 'date', label: 'Fecha', field: (row) => truckDate(row), align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' },
]

const orderedTrucks = computed(() => [...trucks.value].sort(compareProductionOrder(trucks.value)))
const truckCardFields = [
  { label: 'Fecha', value: (truck) => truckDate(truck) },
  { label: 'Orden', value: (truck) => productionOrderForTruck(truck) },
  { label: 'Tipo', value: (truck) => truckClassificationLabel(truck) },
  { label: 'DTE', value: (truck) => truck.dte || 'Sin DTE' },
]

watch(trucks, (nextTrucks) => saveBalanzaTrucks(nextTrucks), { deep: true })

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
  if (!window.confirm(`Eliminar el camión de ${truck.client}?`)) return

  trucks.value = orderedTrucks.value
    .filter((item) => item.id !== truck.id)
    .map((item, index) => ({ ...item, productionOrder: index + 1 }))
  showFeedback('Camión eliminado correctamente')
}

function startTruckDrag(truck, event) {
  draggedTruckId.value = truck.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', truck.id)
}

function dropTruck(targetTruck) {
  const draggedId = draggedTruckId.value
  if (!draggedId || draggedId === targetTruck.id) return endTruckDrag()

  const reorderedTrucks = [...orderedTrucks.value]
  const fromIndex = reorderedTrucks.findIndex((truck) => truck.id === draggedId)
  const toIndex = reorderedTrucks.findIndex((truck) => truck.id === targetTruck.id)
  if (fromIndex < 0 || toIndex < 0) return endTruckDrag()

  const [draggedTruck] = reorderedTrucks.splice(fromIndex, 1)
  reorderedTrucks.splice(toIndex, 0, draggedTruck)
  trucks.value = reorderedTrucks.map((truck, index) => ({ ...truck, productionOrder: index + 1 }))
  endTruckDrag()
}

function endTruckDrag() {
  draggedTruckId.value = null
}

function moveTruck(truck, offset) {
  const reorderedTrucks = [...orderedTrucks.value]
  const fromIndex = reorderedTrucks.findIndex((item) => item.id === truck.id)
  const toIndex = fromIndex + offset
  if (fromIndex < 0 || toIndex < 0 || toIndex >= reorderedTrucks.length) return
  const [movedTruck] = reorderedTrucks.splice(fromIndex, 1)
  reorderedTrucks.splice(toIndex, 0, movedTruck)
  trucks.value = reorderedTrucks.map((item, index) => ({ ...item, productionOrder: index + 1 }))
}

function showFeedback(message) {
  feedback.value = message
  window.setTimeout(() => {
    feedback.value = ''
  }, 2800)
}
</script>
