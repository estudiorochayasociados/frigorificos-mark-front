<template>
  <q-page class="page-shell">
    <div class="page-content zone3-page">
      <header class="page-header stock-transfer-heading">
        <div>
          <h1>Movimientos entre almacenes</h1>
          <p>Traslados internos de stock entre cámaras, depósitos o posiciones.</p>
        </div>
        <button class="secondary-action" type="button" @click="openWarehouseTransfer">
          <Warehouse :size="18" /> Movimiento entre almacenes
        </button>
      </header>

      <section class="data-card zone3-card stock-transfer-history">
        <q-table
          v-if="warehouseTransfers.length"
          flat
          row-key="id"
          :rows="warehouseTransfers"
          :columns="movementColumns"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="operation-table"
        >
          <template #body="props">
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
        </q-table>
        <div v-else class="zone3-empty">
          <Warehouse :size="36" />
          <strong>Sin movimientos registrados</strong>
          <span>Usa el botón de la sección para registrar un traslado interno.</span>
        </div>
      </section>
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
            <button class="icon-action" type="button" @click="stockTransferDialog = false">
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
import { useZona3 } from './useZona3'
import './Zona3.css'

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
</script>
