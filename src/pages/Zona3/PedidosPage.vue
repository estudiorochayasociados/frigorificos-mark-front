<template>
  <q-page class="page-shell">
    <div v-if="!showOrderFormPage" class="page-content zone3-page">
      <header class="page-header">
        <div>
          <h1>Pedidos para expedición</h1>
          <p>Documentos que luego se preparan y asocian a una carga.</p>
        </div>
        <button class="primary-action" type="button" @click="openOrderForm">
          <Plus :size="18" /> Nuevo pedido
        </button>
      </header>

      <section class="data-card zone3-card">
        <q-table
          v-if="filteredOrders.length"
          flat
          row-key="id"
          :rows="filteredOrders"
          :columns="orderColumns"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="operation-table"
        >
          <template #body="props">
            <q-tr :props="props">
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
              <q-td key="boxes" :props="props"
                ><strong>{{ number(orderBoxes(props.row)) }}</strong></q-td
              >
              <q-td key="lines" :props="props">{{ (props.row.lines || []).length }}</q-td>
              <q-td key="status" :props="props">
                <span :class="['status-pill', orderStatusClass(props.row)]">{{
                  orderStatus(props.row)
                }}</span>
              </q-td>
            </q-tr>
          </template>
        </q-table>
        <div v-else class="zone3-empty">
          <ClipboardList :size="36" />
          <strong>No hay pedidos para mostrar</strong>
          <span>Registra un pedido para iniciar el circuito de expedición.</span>
        </div>
      </section>
    </div>

    <div v-else class="page-content page-content--form zone3-page">
      <header class="page-header order-form-header">
        <div>
          <h1>Nuevo pedido de expedición</h1>
          <p>Referencia documental para Expedición.</p>
        </div>
      </header>

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
                <p>Artículo, calibre y cantidad. La descripción es opcional.</p>
              </div>
              <button class="secondary-action" type="button" @click="addOrderLine">
                <Plus :size="16" /> Agregar renglón
              </button>
            </div>
            <div v-for="(line, index) in orderForm.lines" :key="line.id" class="order-line-form">
              <q-input
                v-model="line.article"
                outlined
                dense
                label="Artículo SAP"
                class="field-control"
              />
              <q-input
                v-model="line.description"
                outlined
                dense
                label="Descripción (opcional)"
                class="field-control"
              />
              <q-select
                v-model="line.caliber"
                :options="caliberOptions"
                outlined
                dense
                label="Calibre"
                class="field-control"
              />
              <NonNegativeInput
                v-model="line.quantity"
                :minimum="1"
                type="number"
                outlined
                dense
                label="Cantidad"
                suffix="cajas"
                class="field-control"
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

    <div v-if="feedback.message" :class="['feedback-toast', `feedback-toast--${feedback.type}`]">
      <AlertCircle v-if="feedback.type === 'error'" :size="19" />
      <CheckCircle2 v-else :size="19" />
      <span>{{ feedback.message }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { AlertCircle, CheckCircle2, ClipboardList, Plus, Save, Trash2 } from '@lucide/vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { useZona3 } from './useZona3'
import './Zona3.css'

const {
  showOrderFormPage,
  filteredOrders,
  orderColumns,
  orderForm,
  caliberOptions,
  feedback,
  number,
  orderBoxes,
  orderStatus,
  orderStatusClass,
  openOrderForm,
  addOrderLine,
  removeOrderLine,
  saveOrder,
  goToOrders,
} = useZona3()
</script>
