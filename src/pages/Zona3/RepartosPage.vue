<template>
  <q-page class="page-shell">
    <div v-if="!showLoadFormPage" class="page-content zone3-page">
      <template v-if="!activeLoad">
        <header class="page-header">
          <div>
            <h1>Repartos</h1>
            <p>Repartos definidos por Comercial/Logística para preparar y despachar.</p>
          </div>
          <div class="page-header-actions">
            <button
              class="primary-action"
              type="button"
              :disabled="!pendingOrders.length"
              @click="openLoadDialog"
            >
              <Plus :size="18" /> Nuevo reparto
            </button>
          </div>
        </header>

        <section class="data-card zone3-card">
          <q-table
            v-if="filteredLoads.length"
            flat
            row-key="id"
            :rows="filteredLoads"
            :columns="loadColumns"
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            class="operation-table"
          >
            <template #body="props">
              <q-tr :props="props" @click="openLoad(props.row)">
                <q-td key="code" :props="props"
                  ><strong>{{ repartoNumber(props.row) }}</strong></q-td
                >
                <q-td key="plate" :props="props">{{ props.row.plate || '-' }}</q-td>
                <q-td key="destination" :props="props">{{
                  loadDestinations(props.row).join(' / ') || '-'
                }}</q-td>
                <q-td key="clients" :props="props">{{ loadClients(props.row).length }}</q-td>
                <q-td key="boxes" :props="props"
                  ><strong>{{ number(loadRequestedBoxes(props.row)) }}</strong></q-td
                >
                <q-td key="status" :props="props"
                  ><span :class="['status-pill', loadStatusClass(props.row.status)]">{{
                    loadStatusLabel(props.row.status)
                  }}</span></q-td
                >
              </q-tr>
            </template>
          </q-table>
          <div v-else class="zone3-empty">
            <Truck :size="36" /><strong>Sin repartos pendientes</strong>
            <span v-if="pendingOrders.length"
              >Crea un nuevo reparto con los pedidos pendientes.</span
            >
            <span v-else>Primero crea un pedido para poder armar un reparto.</span>
            <button
              v-if="!pendingOrders.length"
              class="secondary-action"
              type="button"
              @click="openOrderForm"
            >
              <ClipboardList :size="16" /> Crear pedido
            </button>
          </div>
        </section>
      </template>

      <template v-else>
        <header class="production-flow-header">
          <button class="production-back" type="button" @click="goToLoads">
            <ArrowLeft :size="18" /> Volver
          </button>
          <div class="production-flow-title">
            <span class="truck-avatar"><Truck :size="19" /></span>
            <div>
              <h1>{{ repartoNumber(activeLoad) }}</h1>
            </div>
          </div>
          <span :class="['status-pill', loadStatusClass(activeLoad.status)]">{{
            loadStatusLabel(activeLoad.status)
          }}</span>
        </header>

        <nav class="production-steps load-steps" aria-label="Etapas del reparto">
          <button
            v-for="step in loadSteps"
            :key="step.value"
            type="button"
            :class="{ active: currentLoadStep === step.value, done: loadStepDone(step.value) }"
            :disabled="!canOpenLoadStep(step.value)"
            @click="goToLoadStep(step.value)"
          >
            <span>{{ step.number }}</span
            ><small>{{ step.label }}</small>
          </button>
        </nav>

        <section v-if="currentLoadStep === 'detalle'" class="load-step-section">
          <div class="romaneo-table allocation-table">
            <div class="romaneo-head allocation-table-head">
              <span>Documento / cliente</span><span>Ubicación</span><span>Producto</span
              ><span>Lote de Zona 2</span><span>Reservar</span>
            </div>
            <div
              v-for="item in activeAllocationRows"
              :key="item.key"
              class="romaneo-row allocation-table-row"
            >
              <div>
                <strong>{{ item.order.documentType }} {{ item.order.documentNumber }}</strong
                ><span>{{ item.order.client }} · {{ item.order.destination || '-' }}</span>
              </div>
              <div>
                <strong>{{
                  loadPositionLabel(activeLoad.orderDetails?.[item.order.id]?.position)
                }}</strong
                ><span>{{ number(activeLoad.orderDetails?.[item.order.id]?.weightKg) }} kg</span>
              </div>
              <div>
                <strong>{{ lineLabel(item.line) }}</strong
                ><span
                  >Calibre {{ item.line.caliber }} · {{ number(item.line.quantity) }} cajas</span
                >
              </div>
              <q-select
                v-model="item.allocation.stockRowId"
                outlined
                dense
                emit-value
                map-options
                :options="stockOptions"
                label="Lote"
              />
              <NonNegativeInput
                v-model="item.allocation.planned"
                type="number"
                outlined
                dense
                label="Reservar"
                suffix="cajas"
              />
            </div>
          </div>
          <div v-if="!stockRows.length" class="inline-warning">
            <AlertCircle :size="19" /><span
              >No hay stock terminado. Debe cerrarse una producción en Zona 2 antes de confirmar la
              preparación.</span
            >
          </div>
          <div class="production-stage-actions">
            <button
              class="primary-action"
              type="button"
              :disabled="activeLoad.status === 'dispatched'"
              @click="confirmPreparation"
            >
              Iniciar romaneo <ArrowRight :size="17" />
            </button>
          </div>
        </section>

        <section
          v-if="currentLoadStep === 'romaneo'"
          class="load-step-section load-step-section--form"
        >
          <div class="loading-fields">
            <q-input
              v-model="activeLoad.loading.start"
              type="time"
              outlined
              dense
              label="Inicio de carga"
            />
            <q-input
              v-model="activeLoad.loading.end"
              type="time"
              outlined
              dense
              label="Fin de carga"
            />
            <NonNegativeInput
              v-model="activeLoad.loading.pallets"
              type="number"
              outlined
              dense
              label="Pallets"
            />
            <q-input
              v-model="activeLoad.loading.responsible"
              outlined
              dense
              label="Responsable de carga"
            />
          </div>
          <div class="romaneo-table">
            <div class="romaneo-head">
              <span>Documento / cliente</span><span>Producto y lote</span><span>Planificado</span
              ><span>Cargado</span>
            </div>
            <div v-for="item in activeAllocationRows" :key="item.key" class="romaneo-row">
              <div>
                <strong>{{ item.order.documentNumber }}</strong
                ><span>{{ item.order.client }}</span>
              </div>
              <div>
                <strong>{{ lineLabel(item.line) }}</strong
                ><span>{{ stockLabel(item.allocation.stockRowId) }}</span>
              </div>
              <strong>{{ number(item.allocation.planned) }}</strong>
              <NonNegativeInput
                v-model="item.allocation.loaded"
                type="number"
                outlined
                dense
                suffix="cajas"
              />
            </div>
          </div>
          <div class="production-stage-actions split-actions">
            <button class="secondary-action" type="button" @click="copyPlannedToLoaded">
              <CopyCheck :size="17" /> Copiar planificado
            </button>
            <button
              class="primary-action"
              type="button"
              :disabled="activeLoad.status === 'dispatched'"
              @click="confirmLoading"
            >
              Confirmar romaneo <ArrowRight :size="17" />
            </button>
          </div>
        </section>

        <section v-if="currentLoadStep === 'documentacion'" class="load-step-section">
          <div class="romaneo-table documentation-table">
            <div class="romaneo-head documentation-table-head">
              <span>Cliente</span><span>Documento</span><span>Cargado</span><span>Remito</span
              ><span>Salida</span>
            </div>
            <div
              v-for="order in activeOrders"
              :key="order.id"
              class="romaneo-row documentation-table-row"
            >
              <div>
                <strong>{{ order.client }}</strong
                ><span>{{ order.destination || '-' }}</span>
              </div>
              <div>
                <strong>{{ order.documentType }} {{ order.documentNumber }}</strong
                ><span>Folio {{ order.folio || '-' }}</span>
              </div>
              <strong>{{ number(loadedForOrder(order.id)) }}</strong>
              <q-input
                v-model="dispatchFor(order).remito"
                outlined
                dense
                label="Número de remito"
                :readonly="activeLoad.status === 'dispatched'"
              />
              <q-select
                v-model="dispatchFor(order).mode"
                outlined
                dense
                emit-value
                map-options
                :options="dispatchOptions(order)"
                label="Salida"
                :readonly="activeLoad.status === 'dispatched'"
              />
              <div v-if="dispatchFor(order).mode === 'dmf'" class="dmf-note documentation-dmf-note">
                <PackageCheck :size="17" /><span>Serie DMF · Despacho Mercadería Fason</span>
              </div>
            </div>
          </div>
          <div class="dispatch-total">
            <div>
              <span>Cajas cargadas</span><strong>{{ number(loadLoadedBoxes(activeLoad)) }}</strong>
            </div>
            <div>
              <span>Pallets</span><strong>{{ number(activeLoad.loading.pallets) }}</strong>
            </div>
            <div>
              <span>Remitos</span><strong>{{ activeOrders.length }}</strong>
            </div>
          </div>
          <div class="production-stage-actions">
            <button
              class="primary-action"
              type="button"
              :disabled="activeLoad.status === 'dispatched'"
              @click="confirmDocumentation"
            >
              {{ activeLoad.status === 'dispatched' ? 'Salida confirmada' : 'Confirmar salida' }}
              <ArrowRight :size="17" />
            </button>
          </div>
        </section>
      </template>
    </div>

    <div v-else class="page-content page-content--form zone3-page">
      <header class="page-header order-form-header">
        <div>
          <h1>Nuevo reparto</h1>
          <p>Agrupa pedidos en un mismo reparto.</p>
        </div>
      </header>
      <q-form class="balanza-form" @submit.prevent="createLoad">
        <div class="balanza-form-body balanza-form-body--two-cols load-form-grid">
          <section class="form-section load-transport-section">
            <div class="form-section-heading">
              <span>1</span>
              <div>
                <h3>Transporte</h3>
                <p>Fecha, camión y dock de carga.</p>
              </div>
            </div>
            <div class="form-grid form-grid--two">
              <DateInput v-model="loadForm.date" label="Fecha" class="field-control" />
              <q-select
                v-model="loadForm.truckType"
                outlined
                dense
                :options="truckTypeOptions"
                label="Tipo de camión"
                class="field-control"
                @update:model-value="updateTruckCapacity"
              />
              <NonNegativeInput
                v-model="loadForm.capacityKg"
                outlined
                dense
                label="Capacidad"
                suffix="kg"
                class="field-control"
              />
              <q-input
                v-model="loadForm.plate"
                outlined
                dense
                label="Patente"
                class="field-control"
              />
              <q-input
                v-model="loadForm.driver"
                outlined
                dense
                label="Chofer"
                class="field-control"
              />
              <q-input
                v-model="loadForm.transport"
                outlined
                dense
                label="Transporte"
                class="field-control"
              />
              <q-input
                v-model="loadForm.dock"
                outlined
                dense
                label="Dock de carga"
                class="field-control"
              />
            </div>
          </section>
          <section class="form-section load-orders-section">
            <div class="form-section-heading">
              <span>2</span>
              <div>
                <h3>Pedidos disponibles</h3>
                <p>Selecciona uno o más documentos para el flete.</p>
              </div>
            </div>
            <div class="pending-order-picker">
              <label
                v-for="order in pendingOrders"
                :key="order.id"
                :class="['pending-order-card', { selected: loadForm.orderIds.includes(order.id) }]"
              >
                <q-checkbox v-model="loadForm.orderIds" :val="order.id" color="red" />
                <span class="pending-order-main">
                  <strong>{{ order.documentType }} {{ order.documentNumber }}</strong>
                  <small>{{ order.client }}</small>
                </span>
                <span class="pending-order-meta">
                  <strong>{{ number(orderBoxes(order)) }}</strong>
                  <small>cajas</small>
                </span>
              </label>
              <div v-if="!pendingOrders.length" class="load-build-empty">
                No hay pedidos pendientes para armar un reparto.
              </div>
            </div>
          </section>
          <section class="form-section load-summary-section">
            <div class="form-section-heading">
              <span>3</span>
              <div>
                <h3>Armado de reparto</h3>
                <p>Orden de descarga y ocupación del camión.</p>
              </div>
            </div>
            <div class="load-build-summary">
              <div class="load-build-overview">
                <div class="load-build-truck">
                  <span>Reparto</span><strong>{{ repartoPreviewNumber }}</strong>
                  <dl>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{{ loadForm.truckType }}</dd>
                    </div>
                    <div>
                      <dt>Capacidad</dt>
                      <dd>{{ number(loadForm.capacityKg) }} kg</dd>
                    </div>
                    <div>
                      <dt>Patente</dt>
                      <dd>{{ loadForm.plate || '-' }}</dd>
                    </div>
                    <div>
                      <dt>Chofer</dt>
                      <dd>{{ loadForm.driver || '-' }}</dd>
                    </div>
                  </dl>
                </div>
                <div class="load-build-bar">
                  <span>Ocupación estimada</span>
                  <div><span :style="{ width: `${loadWeightPercent}%` }"></span></div>
                  <strong>
                    {{ number(loadFormWeightKg) }} / {{ number(loadForm.capacityKg) }} kg
                  </strong>
                </div>
              </div>

              <div class="selected-order-list">
                <article v-for="item in selectedLoadOrders" :key="item.order.id">
                  <div class="selected-order-copy">
                    <span>{{ item.order.documentType }} {{ item.order.documentNumber }}</span>
                    <strong>{{ item.order.client }}</strong>
                    <small>{{ item.order.destination || 'Sin destino informado' }}</small>
                  </div>
                  <div class="selected-order-stats">
                    <div>
                      <span>Cajas</span>
                      <strong>{{ number(orderBoxes(item.order)) }}</strong>
                    </div>
                    <div>
                      <span>Renglones</span>
                      <strong>{{ item.order.lines.length }}</strong>
                    </div>
                  </div>
                  <div class="selected-order-fields">
                    <q-select
                      v-model="item.detail.position"
                      outlined
                      dense
                      emit-value
                      map-options
                      :options="loadPositionOptions"
                      label="Orden de descarga"
                    />
                    <NonNegativeInput
                      v-model="item.detail.weightKg"
                      outlined
                      dense
                      label="Peso estimado"
                      suffix="kg"
                    />
                  </div>
                </article>
                <div v-if="!selectedLoadOrders.length" class="load-build-empty">
                  Marcá pedidos en la sección 2 para completar el orden de descarga y el peso.
                </div>
              </div>
            </div>
          </section>
        </div>
        <footer class="balanza-form-footer order-form-footer">
          <button class="secondary-action" type="button" @click="goToLoads">Cancelar</button>
          <button class="primary-action" type="submit"><Truck :size="19" /> Crear reparto</button>
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
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CopyCheck,
  PackageCheck,
  Plus,
  Truck,
} from '@lucide/vue'
import DateInput from '@/components/DateInput.vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { useZona3 } from './useZona3'
import './Zona3.css'

const {
  showLoadFormPage,
  activeLoad,
  pendingOrders,
  filteredLoads,
  loadColumns,
  loadSteps,
  currentLoadStep,
  activeAllocationRows,
  stockOptions,
  stockRows,
  activeOrders,
  loadForm,
  truckTypeOptions,
  selectedLoadOrders,
  loadWeightPercent,
  repartoPreviewNumber,
  loadPositionOptions,
  feedback,
  number,
  openLoadDialog,
  openLoad,
  openOrderForm,
  goToLoads,
  goToLoadStep,
  loadStepDone,
  canOpenLoadStep,
  repartoNumber,
  loadDestinations,
  loadClients,
  loadRequestedBoxes,
  loadStatusClass,
  loadStatusLabel,
  loadPositionLabel,
  lineLabel,
  stockLabel,
  confirmPreparation,
  copyPlannedToLoaded,
  confirmLoading,
  dispatchFor,
  dispatchOptions,
  confirmDocumentation,
  loadedForOrder,
  loadLoadedBoxes,
  createLoad,
  updateTruckCapacity,
  orderBoxes,
} = useZona3()
</script>
