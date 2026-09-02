<template>
  <q-page class="page-shell">
    <div class="page-content zone3-page">
      <PageHeader class="stock-transfer-heading" title="Movimientos entre almacenes" description="Traslados internos de stock entre cámaras, depósitos o posiciones.">
        <template #actions><button class="secondary-action" type="button" @click="openWarehouseTransfer"><Warehouse :size="18" /> Movimiento entre almacenes</button></template>
      </PageHeader>

      <ResponsiveDataTable
        class="zone3-card stock-transfer-history"
        :rows="warehouseTransfers"
        :columns="movementColumns"
        :mobile-fields="movementCardFields"
      >
          <template #desktop-body="props">
            <q-tr :props="props">
              <q-td key="stock" :props="props"
                ><strong>{{ props.row.stockLabel }}</strong></q-td
              >
              <q-td key="quantity" :props="props">{{ number(props.row.quantity) }}</q-td>
              <q-td key="origin" :props="props">{{ transferOrigin(props.row) }}</q-td>
              <q-td key="destination" :props="props">{{ transferDestination(props.row) }}</q-td>
              <q-td key="createdAt" :props="props">{{ dateTime(props.row.createdAt) }}</q-td>
            </q-tr>
          </template>
          <template #mobile-leading><span class="document-icon"><Warehouse :size="19" /></span></template>
          <template #mobile-title="{ row }">{{ row.stockLabel }}</template>
          <template #mobile-subtitle="{ row }">{{ dateTime(row.createdAt) }}</template>
          <template #empty><div class="zone3-empty">
          <Warehouse :size="36" />
          <strong>Sin movimientos registrados</strong>
          <span>Usa el botón de la sección para registrar un traslado interno.</span>
          </div></template>
      </ResponsiveDataTable>
    </div>

    <q-dialog v-model="stockTransferDialog">
      <q-card class="zone3-dialog stock-transfer-dialog">
        <q-form @submit.prevent="saveWarehouseTransfer">
          <header class="dialog-header">
            <div class="dialog-title-wrap">
              <span class="dialog-icon"><Warehouse :size="20" /></span>
              <div class="dialog-heading">
                <h2 class="dialog-title">Movimiento entre almacenes</h2>
                <span class="dialog-subtitle"
                  >Movimiento interno de stock, sin pedido ni expedición.</span
                >
              </div>
            </div>
            <button class="icon-action" type="button" aria-label="Cerrar movimiento" @click="stockTransferDialog = false">
              <X :size="20" />
            </button>
          </header>
          <div class="zone3-dialog-body dialog-form-grid">
            <q-select
              v-model="stockTransferForm.stockRowId"
              outlined
              dense
              emit-value
              map-options
              :options="transferStockOptions"
              label="Lote de stock"
              class="field-span-2"
            />
            <NonNegativeInput
              v-model="stockTransferForm.quantity"
              :minimum="1"
              type="number"
              outlined
              dense
              label="Cantidad"
              suffix="cajas"
            />
            <q-input
              v-model="stockTransferForm.originWarehouse"
              outlined
              dense
              label="Almacén origen"
            />
            <q-input
              v-model="stockTransferForm.originLocation"
              outlined
              dense
              label="Ubicación origen"
            />
            <q-input
              v-model="stockTransferForm.destinationWarehouse"
              outlined
              dense
              label="Almacén destino"
            />
            <q-input
              v-model="stockTransferForm.destinationLocation"
              outlined
              dense
              label="Ubicación destino"
            />
          </div>
          <footer class="dialog-footer">
            <button class="secondary-action" type="button" @click="stockTransferDialog = false">
              Cancelar
            </button>
            <button class="primary-action" type="submit">
              <Save :size="17" /> Registrar movimiento
            </button>
          </footer>
        </q-form>
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
import { AlertCircle, CheckCircle2, Save, Warehouse, X } from '@lucide/vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import { useZona3 } from '@/composables/useZona3'

const {
  movementColumns,
  warehouseTransfers,
  stockTransferDialog,
  stockTransferForm,
  transferStockOptions,
  feedback,
  number,
  dateTime,
  transferOrigin,
  transferDestination,
  openWarehouseTransfer,
  saveWarehouseTransfer,
} = useZona3()

const movementCardFields = [
  { label: 'Cantidad', value: (movement) => `${number(movement.quantity)} cajas` },
  { label: 'Origen', value: (movement) => transferOrigin(movement) },
  { label: 'Destino', value: (movement) => transferDestination(movement) },
]
</script>
