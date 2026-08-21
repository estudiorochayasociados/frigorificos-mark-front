<template>
  <q-page class="page-shell">
    <div class="page-content zone2-page">
      <header class="page-header">
        <div>
          <h1>Produccion</h1>
          <p>Gestion de mercaderia, ordenes por calibre, liberacion y recibo de produccion.</p>
        </div>
      </header>

      <div class="zone2-flow">
        <section class="zone2-card">
          <div class="zone2-card-head">
            <span class="step-badge">1</span>
            <div>
              <h2>Entrada de mercaderia</h2>
              <p>Seleccion de camiones por marca comercial y producto.</p>
            </div>
          </div>

          <div class="production-brand-select">
            <q-select
              v-model="selectedBrand"
              :options="brandOptions"
              label="Marca comercial"
              outlined
              dense
              emit-value
              map-options
              class="field-control"
            />
          </div>

          <div class="zone2-table-wrap">
            <table class="zone2-table">
              <thead>
                <tr>
                  <th>Referencia DTE/Remito</th>
                  <th>Lote informado</th>
                  <th>Codigo</th>
                  <th>Aves registradas</th>
                  <th>Muertos</th>
                  <th>Decomisos</th>
                  <th>Decomisos vísceras</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="brandTrucks.length === 0">
                  <td colspan="7" class="empty-cell">No hay camiones cargados para esta marca.</td>
                </tr>
                <tr v-for="truck in brandTrucks" :key="truck.id">
                  <td>{{ truck.dte || '-' }} / {{ truck.remito || '-' }}</td>
                  <td>{{ lotForTruck(truck) }}</td>
                  <td>{{ truck.codigoSn || '-' }}</td>
                  <td>{{ Number(truck.avesOrigen || 0).toLocaleString('es-AR') }}</td>
                  <td>{{ truck.muertos || 0 }}</td>
                  <td>{{ truck.decomisos || 0 }}</td>
                  <td>{{ truck.decomisosVisc || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="zone2-card">
          <div class="zone2-card-head">
            <span class="step-badge">2</span>
            <div>
              <h2>Orden de fabricacion</h2>
              <p>Carga de cajas por calibre para la marca seleccionada.</p>
            </div>
          </div>

          <div class="zone2-entry-grid">
            <q-input v-model="orderForm.productCode" label="Nro producto" outlined dense />
            <q-input v-model="orderForm.caliber" label="Calibre / producto" outlined dense />
            <q-input
              v-model.number="orderForm.boxes"
              type="number"
              label="Cajas de la orden"
              outlined
              dense
            />
            <q-input
              v-model.number="orderForm.birdsNeeded"
              type="number"
              label="Aves necesarias"
              outlined
              dense
            />
            <q-input :model-value="clientCode" label="Cliente" outlined dense readonly />
            <button class="primary-action" type="button" @click="addOrder">
              <Plus :size="17" /> {{ editingOrderId ? 'Guardar' : 'Agregar' }}
            </button>
          </div>

          <div class="zone2-table-wrap">
            <table class="zone2-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Calibre</th>
                  <th>Cajas</th>
                  <th>Aves necesarias</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="brandOrders.length === 0">
                  <td colspan="7" class="empty-cell">Todavia no hay ordenes para esta marca.</td>
                </tr>
                <tr v-for="order in brandOrders" :key="order.id">
                  <td>{{ order.productCode }}</td>
                  <td>{{ order.caliber }}</td>
                  <td>{{ Number(order.boxes || 0).toLocaleString('es-AR') }}</td>
                  <td>{{ Number(order.birdsNeeded || 0).toLocaleString('es-AR') }}</td>
                  <td>{{ order.clientCode }}</td>
                  <td>{{ orderStatus(order) }}</td>
                  <td>
                    <button
                      class="table-action"
                      type="button"
                      :disabled="order.emitted"
                      @click="editOrder(order)"
                    >
                      Editar
                    </button>
                    <button
                      class="table-action"
                      type="button"
                      :disabled="order.emitted"
                      @click="removeOrder(order)"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="zone2-card">
          <div class="zone2-card-head">
            <span class="step-badge">3</span>
            <div>
              <h2>Lista de partida abierta</h2>
              <p>Liberacion de ordenes planificadas.</p>
            </div>
          </div>
          <div class="zone2-table-wrap">
            <table class="zone2-table">
              <thead>
                <tr>
                  <th>Seleccionar</th>
                  <th>Producto</th>
                  <th>Calibre</th>
                  <th>Cajas</th>
                  <th>Cliente</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="releasableOrders.length === 0">
                  <td colspan="5" class="empty-cell">No hay ordenes planificadas para liberar.</td>
                </tr>
                <tr v-for="order in releasableOrders" :key="`release-${order.id}`">
                  <td><input v-model="releaseSelection" type="checkbox" :value="order.id" /></td>
                  <td>{{ order.productCode }}</td>
                  <td>{{ order.caliber }}</td>
                  <td>{{ Number(order.boxes || 0).toLocaleString('es-AR') }}</td>
                  <td>{{ order.clientCode }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            class="primary-action"
            type="button"
            :disabled="releaseSelection.length === 0"
            @click="releaseOrders"
          >
            <CheckCircle2 :size="17" /> Liberar seleccionadas ({{ releaseSelection.length }})
          </button>
        </section>

        <section class="zone2-card">
          <div class="zone2-card-head">
            <span class="step-badge">4</span>
            <div>
              <h2>Emision para la produccion</h2>
              <p>Consumo de aves faenadas para crear cajas por calibre.</p>
            </div>
          </div>

          <div class="zone2-table-wrap">
            <table class="zone2-table">
              <thead>
                <tr>
                  <th>Seleccionar</th>
                  <th>Producto</th>
                  <th>Calibre</th>
                  <th>Cajas</th>
                  <th>Aves necesarias</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="emittableOrders.length === 0">
                  <td colspan="5" class="empty-cell">No hay ordenes liberadas para emitir.</td>
                </tr>
                <tr v-for="order in emittableOrders" :key="`emit-${order.id}`">
                  <td><input v-model="emissionOrderIds" type="checkbox" :value="order.id" /></td>
                  <td>{{ order.productCode }}</td>
                  <td>{{ order.caliber }}</td>
                  <td>{{ Number(order.boxes || 0).toLocaleString('es-AR') }}</td>
                  <td>{{ Number(order.birdsNeeded || 0).toLocaleString('es-AR') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="zone2-meters">
            <div>
              <span>Total necesitado</span>
              <strong>{{ neededBirds.toLocaleString('es-AR') }}</strong>
            </div>
            <div>
              <span>Total seleccionado</span>
              <strong>{{ selectedBirds.toLocaleString('es-AR') }}</strong>
            </div>
            <div>
              <span>Disponible</span>
              <strong>{{ totalBirds.toLocaleString('es-AR') }}</strong>
            </div>
          </div>

          <div class="zone2-table-wrap">
            <table class="zone2-table">
              <thead>
                <tr>
                  <th>Camion / lote</th>
                  <th>Aves sin asignar</th>
                  <th>Seleccionado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="brandTrucks.length === 0">
                  <td colspan="4" class="empty-cell">Sin camiones disponibles.</td>
                </tr>
                <tr v-for="truck in brandTrucks" :key="`consume-${truck.id}`">
                  <td>{{ truck.client }} · {{ lotForTruck(truck) }}</td>
                  <td>{{ availableBirdsForTruck(truck).toLocaleString('es-AR') }}</td>
                  <td>
                    <q-input
                      v-model.number="consumption[truck.id]"
                      type="number"
                      :min="0"
                      outlined
                      dense
                      class="zone2-inline-input"
                    />
                  </td>
                  <td>
                    <button class="table-action" type="button" @click="consumeAll(truck)">
                      Usar disponible
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            class="primary-action"
            type="button"
            :disabled="emissionOrderIds.length === 0"
            @click="confirmEmission"
          >
            <CheckCircle2 :size="17" /> Confirmar emision
          </button>
        </section>

        <section class="zone2-card">
          <div class="zone2-card-head">
            <span class="step-badge">5</span>
            <div>
              <h2>Recibo de produccion</h2>
              <p>Completa los datos reales del calibre finalizado.</p>
            </div>
          </div>

          <div class="zone2-table-wrap">
            <table class="zone2-table">
              <thead>
                <tr>
                  <th>Calibre</th>
                  <th>Lote</th>
                  <th>Codigo</th>
                  <th>Fabricacion</th>
                  <th>Vencimiento</th>
                  <th>Cajas recibidas</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="receiptOrders.length === 0">
                  <td colspan="7" class="empty-cell">
                    No hay ordenes emitidas pendientes de recibo.
                  </td>
                </tr>
                <tr v-for="order in receiptOrders" :key="`receipt-${order.id}`">
                  <td>{{ order.caliber }}</td>
                  <td>
                    <q-input
                      v-model="receiptFor(order).lot"
                      dense
                      outlined
                      class="zone2-table-input"
                    />
                  </td>
                  <td>
                    <q-input
                      v-model="receiptFor(order).code"
                      dense
                      outlined
                      class="zone2-table-input"
                    />
                  </td>
                  <td>
                    <q-input
                      v-model="receiptFor(order).manufactureDate"
                      type="date"
                      dense
                      outlined
                      class="zone2-table-input"
                    />
                  </td>
                  <td>
                    <q-input
                      v-model="receiptFor(order).expirationDate"
                      type="date"
                      dense
                      outlined
                      class="zone2-table-input"
                    />
                  </td>
                  <td>
                    <q-input
                      v-model.number="receiptFor(order).boxes"
                      type="number"
                      dense
                      outlined
                      class="zone2-table-input"
                    />
                  </td>
                  <td>
                    <button class="table-action" type="button" @click="confirmReceipt(order)">
                      Confirmar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div v-if="feedback" class="feedback-toast">
        <CheckCircle2 :size="19" /><span>{{ feedback }}</span>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { CheckCircle2, Plus } from '@lucide/vue'

const trucksKey = 'mark-frigorifico-operacion-v2'
const zone2Key = 'mark-frigorifico-zona2-v1'
const trucks = ref(loadTrucks())
const saved = loadZone2()
const selectedBrand = ref(saved.selectedBrand || firstBrand(trucks.value))
const orders = ref(
  (saved.orders || []).map((order) => ({
    ...order,
    birdsNeeded: Number(order.birdsNeeded || 0),
    released: Boolean(order.released),
    emitted: Boolean(order.emitted),
    received: Boolean(order.received),
  })),
)
const consumption = reactive(saved.consumption || {})
const receipts = reactive(saved.receipts || {})
const emissions = ref(saved.emissions || [])
const feedback = ref('')
const editingOrderId = ref(null)
const releaseSelection = ref([])
const emissionOrderIds = ref([])
const orderForm = reactive({ productCode: '', caliber: '', boxes: 0, birdsNeeded: 0 })

const brandOptions = computed(() => {
  const brands = [...new Set(trucks.value.map((truck) => truck.client).filter(Boolean))]
  return brands.map((brand) => ({ label: brand, value: brand }))
})

const brandTrucks = computed(() =>
  trucks.value.filter((truck) => !selectedBrand.value || truck.client === selectedBrand.value),
)

const brandOrders = computed(() =>
  orders.value.filter((order) => !selectedBrand.value || order.brand === selectedBrand.value),
)
const releasableOrders = computed(() => brandOrders.value.filter((order) => !order.released))
const emittableOrders = computed(() =>
  brandOrders.value.filter((order) => order.released && !order.emitted),
)
const selectedEmissionOrders = computed(() =>
  emittableOrders.value.filter((order) => emissionOrderIds.value.includes(order.id)),
)
const receiptOrders = computed(() =>
  brandOrders.value.filter((order) => order.emitted && !order.received),
)

const clientCode = computed(() => brandTrucks.value[0]?.codigoSn || '')
const totalBirds = computed(() =>
  brandTrucks.value.reduce((total, truck) => total + availableBirdsForTruck(truck), 0),
)
const neededBirds = computed(() =>
  selectedEmissionOrders.value.reduce((total, order) => total + Number(order.birdsNeeded || 0), 0),
)
const selectedBirds = computed(() =>
  brandTrucks.value.reduce((total, truck) => total + Number(consumption[truck.id] || 0), 0),
)

watch(
  [selectedBrand, orders, consumption, receipts, emissions],
  () => {
    localStorage.setItem(
      zone2Key,
      JSON.stringify({
        selectedBrand: selectedBrand.value,
        orders: orders.value,
        consumption: { ...consumption },
        receipts: { ...receipts },
        emissions: emissions.value,
      }),
    )
  },
  { deep: true },
)

function loadTrucks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(trucksKey) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadZone2() {
  try {
    const parsed = JSON.parse(localStorage.getItem(zone2Key) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function addOrder() {
  if (!selectedBrand.value) {
    showFeedback('Selecciona una marca comercial')
    return
  }

  if (!orderForm.productCode || !orderForm.caliber || !Number(orderForm.boxes)) {
    showFeedback('Completa producto, calibre y cajas de la orden')
    return
  }
  if (!Number(orderForm.birdsNeeded)) {
    showFeedback('Indica las aves necesarias para esta orden')
    return
  }

  const nextOrder = {
    brand: selectedBrand.value,
    productCode: orderForm.productCode,
    caliber: orderForm.caliber,
    boxes: Number(orderForm.boxes || 0),
    birdsNeeded: Number(orderForm.birdsNeeded || 0),
    clientCode: clientCode.value,
    released: false,
    emitted: false,
    received: false,
  }
  if (editingOrderId.value) {
    const order = orders.value.find((item) => item.id === editingOrderId.value)
    if (order) Object.assign(order, nextOrder)
    showFeedback('Orden actualizada')
  } else {
    orders.value.push({ id: createId(), ...nextOrder })
    showFeedback('Orden agregada')
  }
  editingOrderId.value = null
  orderForm.productCode = ''
  orderForm.caliber = ''
  orderForm.boxes = 0
  orderForm.birdsNeeded = 0
}

function firstBrand(nextTrucks) {
  return nextTrucks.find((truck) => truck.client)?.client || ''
}

function releaseOrders() {
  releasableOrders.value
    .filter((order) => releaseSelection.value.includes(order.id))
    .forEach((order) => {
      order.released = true
    })
  releaseSelection.value = []
  showFeedback('Ordenes seleccionadas liberadas')
}

function consumeAll(truck) {
  consumption[truck.id] = availableBirdsForTruck(truck)
}

function receiptFor(order) {
  if (!receipts[order.id]) {
    receipts[order.id] = {
      lot: '',
      code: '',
      manufactureDate: '',
      expirationDate: '',
      boxes: 0,
      done: false,
    }
  }
  return receipts[order.id]
}

function editOrder(order) {
  editingOrderId.value = order.id
  Object.assign(orderForm, {
    productCode: order.productCode,
    caliber: order.caliber,
    boxes: Number(order.boxes || 0),
    birdsNeeded: Number(order.birdsNeeded || 0),
  })
}

function removeOrder(order) {
  orders.value = orders.value.filter((item) => item.id !== order.id)
  delete receipts[order.id]
  showFeedback('Orden eliminada')
}

function orderStatus(order) {
  if (order.received) return 'Recibida'
  if (order.emitted) return 'Emitida'
  return order.released ? 'Liberada' : 'Planif.'
}

function confirmedConsumptionForTruck(truckId) {
  return emissions.value.reduce(
    (total, emission) => total + Number(emission.consumption?.[truckId] || 0),
    0,
  )
}

function availableBirdsForTruck(truck) {
  return Math.max(0, Number(truck.avesOrigen || 0) - confirmedConsumptionForTruck(truck.id))
}

function confirmEmission() {
  if (selectedEmissionOrders.value.length === 0) {
    showFeedback('Selecciona al menos una orden liberada')
    return
  }
  const hasInvalidConsumption = brandTrucks.value.some((truck) => {
    const value = Number(consumption[truck.id] || 0)
    return value < 0 || value > availableBirdsForTruck(truck)
  })
  if (hasInvalidConsumption) {
    showFeedback('Revisa las cantidades por camion: no pueden superar las aves sin asignar')
    return
  }
  if (selectedBirds.value !== neededBirds.value) {
    showFeedback('El total seleccionado debe coincidir con las aves necesarias')
    return
  }

  emissions.value.push({
    id: createId(),
    orderIds: [...emissionOrderIds.value],
    consumption: Object.fromEntries(
      brandTrucks.value
        .filter((truck) => Number(consumption[truck.id] || 0) > 0)
        .map((truck) => [truck.id, Number(consumption[truck.id])]),
    ),
    createdAt: new Date().toISOString(),
  })
  selectedEmissionOrders.value.forEach((order) => {
    order.emitted = true
  })
  brandTrucks.value.forEach((truck) => delete consumption[truck.id])
  emissionOrderIds.value = []
  showFeedback('Emision confirmada y aves asignadas por camion/lote')
}

function confirmReceipt(order) {
  const receipt = receiptFor(order)
  if (!receipt.lot || !receipt.code || !receipt.manufactureDate || !receipt.expirationDate) {
    showFeedback('Completa lote, codigo y fechas antes de confirmar')
    return
  }
  if (!Number(receipt.boxes)) {
    showFeedback('Indica las cajas recibidas')
    return
  }
  receipt.done = true
  order.received = true
  showFeedback(`Recibo confirmado para calibre ${order.caliber}`)
}

function lotForTruck(truck) {
  return [truck.loteSenasa, truck.codigoSn].filter(Boolean).join(' - ') || '-'
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function showFeedback(message) {
  feedback.value = message
  window.setTimeout(() => {
    feedback.value = ''
  }, 2400)
}
</script>
