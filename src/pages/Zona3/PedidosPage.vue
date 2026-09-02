<template>
  <q-page class="page-shell">
    <div v-if="!showOrderFormPage" class="page-content zone3-page">
      <PageHeader title="Pedidos para expedición" description="Documentos que luego se preparan y asocian a una carga.">
        <template #actions><button class="primary-action" type="button" @click="openOrderForm"><Plus :size="18" /> Nuevo pedido</button></template>
      </PageHeader>

      <ResponsiveDataTable
        class="zone3-card"
        :rows="filteredOrders"
        :columns="orderColumns"
        :mobile-fields="orderCardFields"
        clickable
        @select="openOrderDetail"
      >
          <template #desktop-body="props">
            <q-tr :props="props" class="clickable-row" @click="openOrderDetail(props.row)">
              <q-td key="document" :props="props"
                ><strong>{{ props.row.documentType }} {{ props.row.documentNumber }}</strong></q-td
              >
              <q-td key="folio" :props="props">{{ props.row.folio || '-' }}</q-td>
              <q-td key="client" :props="props">
                <strong>{{ props.row.client }}</strong>
                <small v-if="props.row.clientCode" class="client-code">
                  ({{ props.row.clientCode }})
                </small>
              </q-td>
              <q-td key="destination" :props="props">{{ props.row.destination || '-' }}</q-td>
              <q-td key="status" :props="props">
                <span :class="['status-pill', orderStatusClass(props.row)]">{{
                  orderStatus(props.row)
                }}</span>
              </q-td>
            </q-tr>
          </template>
          <template #mobile-leading><span class="document-icon"><ClipboardList :size="19" /></span></template>
          <template #mobile-title="{ row }">{{ row.documentType }} {{ row.documentNumber }}</template>
          <template #mobile-subtitle="{ row }">{{ row.client }}{{ row.clientCode ? ` (${row.clientCode})` : '' }}</template>
          <template #mobile-status="{ row }"><span :class="['status-pill', orderStatusClass(row)]">{{ orderStatus(row) }}</span></template>
          <template #empty><div class="zone3-empty">
          <ClipboardList :size="36" />
          <strong>No hay pedidos para mostrar</strong>
          <span>Registra un pedido para iniciar el circuito de expedición.</span>
          </div></template>
      </ResponsiveDataTable>
    </div>

    <div v-else class="page-content page-content--form zone3-page">
      <PageHeader class="order-form-header" title="Nuevo pedido de expedición" description="Referencia documental para Expedición." />

      <q-form class="balanza-form" @submit.prevent="saveOrder">
        <div class="balanza-form-body">
          <section class="form-section">
            <div class="form-section-heading">
              <span>1</span>
              <div>
                <h3>Documento y cliente</h3>
                <p>Datos comerciales del pedido.</p>
              </div>
            </div>
            <div class="form-grid form-grid--dialog">
              <q-select
                v-model="orderForm.documentType"
                outlined
                dense
                :options="['REMITO', 'OV']"
                label="Tipo de documento"
                class="field-control"
              />
              <q-input
                v-model="orderForm.documentNumber"
                outlined
                dense
                label="Número de documento *"
                class="field-control"
              />
              <q-input
                v-model="orderForm.folio"
                outlined
                dense
                label="Número de folio"
                class="field-control"
              />
              <q-input
                v-model="orderForm.clientCode"
                outlined
                dense
                label="Código SAP cliente"
                class="field-control"
              />
              <q-input
                v-model="orderForm.client"
                outlined
                dense
                label="Cliente / razón social *"
                class="field-control"
              />
              <q-input
                v-model="orderForm.destination"
                outlined
                dense
                label="Destino de entrega"
                class="field-control"
              />
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-heading form-section-heading--action">
              <span>2</span>
              <div>
                <h3>Mercadería solicitada</h3>
                <p>Selecciona mercadería producida y luego uno de sus calibres disponibles.</p>
              </div>
              <button class="secondary-action" type="button" @click="addOrderLine">
                <Plus :size="16" /> Agregar renglón
              </button>
            </div>
            <div v-for="(line, index) in orderForm.lines" :key="line.id" class="order-line-form">
              <q-select
                v-model="line.merchandiseKey"
                :options="producedMerchandiseOptions"
                outlined
                dense
                emit-value
                map-options
                label="Mercadería producida *"
                class="field-control"
                @update:model-value="selectOrderMerchandise(line)"
              />
              <q-input
                v-model="line.article"
                outlined
                dense
                label="Artículo SAP (opcional)"
                class="field-control"
              />
              <q-select
                v-model="line.caliber"
                :options="caliberOptionsForLine(line)"
                outlined
                dense
                emit-value
                map-options
                label="Calibre"
                class="field-control"
                :disable="!line.merchandiseKey"
              />
              <NonNegativeInput
                v-model="line.quantity"
                :minimum="0"
                :maximum="availableForOrderLine(line)"
                type="number"
                outlined
                dense
                label="Cantidad"
                suffix="cajas"
                class="field-control"
                @update:model-value="updateOrderLineQuantity(line, $event)"
              />
              <button
                class="icon-action"
                type="button"
                :disabled="orderForm.lines.length === 1"
                @click="removeOrderLine(index)"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </section>
        </div>

        <footer class="balanza-form-footer order-form-footer">
          <button class="secondary-action" type="button" @click="goToOrders">Cancelar</button>
          <button class="primary-action" type="submit"><Save :size="19" /> Guardar pedido</button>
        </footer>
      </q-form>
    </div>

    <q-dialog v-model="orderDetailDialog">
      <q-card class="zone3-dialog order-detail-dialog">
        <header class="dialog-header">
          <div class="dialog-title-wrap">
            <span class="dialog-icon"><ClipboardList :size="20" /></span>
            <div class="dialog-heading">
              <h2 class="dialog-title">
                {{ selectedOrder?.documentType }} {{ selectedOrder?.documentNumber }}
              </h2>
              <span class="dialog-subtitle">Detalle del pedido de expedición.</span>
            </div>
          </div>
          <button class="icon-action" type="button" aria-label="Cerrar detalle" @click="orderDetailDialog = false">
            <X :size="20" />
          </button>
        </header>

        <div v-if="selectedOrder" class="zone3-dialog-body order-detail-body">
          <section class="order-detail-summary">
            <div>
              <span>Cliente</span>
              <strong>{{ selectedOrder.client }}</strong>
              <small v-if="selectedOrder.clientCode">({{ selectedOrder.clientCode }})</small>
            </div>
            <div>
              <span>Destino</span>
              <strong>{{ selectedOrder.destination || '-' }}</strong>
            </div>
            <div>
              <span>Folio</span>
              <strong>{{ selectedOrder.folio || '-' }}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{{ orderStatus(selectedOrder) }}</strong>
            </div>
            <div>
              <span>Cajas totales</span>
              <strong>{{ number(orderBoxes(selectedOrder)) }}</strong>
            </div>
          </section>

          <section class="order-detail-lines">
            <h3>Mercadería solicitada</h3>
            <article v-for="line in selectedOrder.lines" :key="line.id">
              <div>
                <strong>{{ lineLabel(line) }}</strong>
                <small v-if="line.article">Artículo {{ line.article }}</small>
              </div>
              <span>Calibre {{ line.caliber }}</span>
              <strong>{{ number(line.quantity) }} cajas</strong>
            </article>
          </section>
        </div>
      </q-card>
    </q-dialog>

    <div v-if="feedback.message" :class="['feedback-toast', `feedback-toast--${feedback.type}`]">
      <AlertCircle v-if="feedback.type === 'error'" :size="19" />
      <CheckCircle2 v-else :size="19" />
      <span>{{ feedback.message }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { AlertCircle, CheckCircle2, ClipboardList, Plus, Save, Trash2, X } from '@lucide/vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import { useZona3 } from '@/composables/useZona3'

const {
  showOrderFormPage,
  filteredOrders,
  orderColumns,
  orderForm,
  producedMerchandiseOptions,
  feedback,
  number,
  orderBoxes,
  orderStatus,
  orderStatusClass,
  lineLabel,
  openOrderForm,
  addOrderLine,
  removeOrderLine,
  selectOrderMerchandise,
  caliberOptionsForLine,
  availableForOrderLine,
  updateOrderLineQuantity,
  saveOrder,
  goToOrders,
} = useZona3()

const selectedOrder = ref(null)
const orderDetailDialog = ref(false)
const orderCardFields = [
  { label: 'Destino', value: (order) => order.destination || '-' },
  { label: 'Folio', value: (order) => order.folio || '-' },
  { label: 'Cajas', value: (order) => number(orderBoxes(order)) },
]

function openOrderDetail(order) {
  selectedOrder.value = order
  orderDetailDialog.value = true
}
</script>
