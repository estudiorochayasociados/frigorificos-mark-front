<template>
  <q-page class="page-shell">
    <div v-if="!showOrderFormPage && !showLoadFormPage" class="page-content zone3-page">
      <template v-if="showOrders">
        <header class="page-header">
          <div>
            <span class="eyebrow"><ClipboardList :size="14" /> ZONA 3 · EXPEDICIÓN</span>
            <h1>Pedidos para expedición</h1>
            <p>Documentos que luego se preparan y asocian a una carga.</p>
          </div>
          <button class="primary-action" type="button" @click="openOrderDialog">
            <Plus :size="18" /> Nuevo pedido
          </button>
        </header>

        <section class="zone3-metrics">
          <article>
            <span>Pendientes</span><strong>{{ pendingOrders.length }}</strong>
          </article>
          <article>
            <span>Asignados</span><strong>{{ assignedOrders.length }}</strong>
          </article>
          <article>
            <span>Despachados</span><strong>{{ dispatchedOrders.length }}</strong>
          </article>
          <article>
            <span>Cajas solicitadas</span><strong>{{ number(totalRequested) }}</strong>
          </article>
        </section>

        <section class="data-card zone3-card">
          <div class="zone3-toolbar">
            <div>
              <h2>Documentos para cargar</h2>
              <p>El número de documento y el folio conservan la referencia con SAP.</p>
            </div>
            <q-input v-model="orderSearch" outlined dense label="Buscar documento o cliente">
              <template #prepend><Search :size="17" /></template>
            </q-input>
          </div>

          <div v-if="filteredOrders.length" class="order-list">
            <article v-for="order in filteredOrders" :key="order.id" class="order-row">
              <div class="order-document">
                <span class="document-icon"><FileText :size="19" /></span>
                <div>
                  <strong>{{ order.documentType }} {{ order.documentNumber }}</strong>
                  <small>Folio {{ order.folio || 'sin informar' }}</small>
                </div>
              </div>
              <div>
                <span>Cliente</span>
                <strong>{{ order.client }}</strong>
                <small>SAP {{ order.clientCode || '-' }}</small>
              </div>
              <div>
                <span>Destino</span>
                <strong>{{ order.destination || '-' }}</strong>
              </div>
              <div>
                <span>Mercadería</span>
                <strong>{{ number(orderBoxes(order)) }} cajas</strong>
                <small>{{ order.lines.length }} renglones</small>
              </div>
              <span :class="['status-pill', orderStatusClass(order)]">{{
                orderStatus(order)
              }}</span>
            </article>
          </div>
          <div v-else class="zone3-empty">
            <ClipboardList :size="36" />
            <strong>No hay pedidos para mostrar</strong>
            <span>Registra un pedido para iniciar el circuito de expedición.</span>
          </div>
        </section>
      </template>

      <template v-else-if="showStock">
        <header class="page-header">
          <div>
            <h1>Stock del día</h1>
            <p>Producto terminado recibido desde Zona 2, agrupado por marca comercial.</p>
          </div>
          <button class="secondary-action" type="button" @click="openWarehouseTransfer">
            <Warehouse :size="18" /> Movimiento entre almacenes
          </button>
        </header>

        <section class="data-card zone3-card">
          <q-table
            flat
            row-key="brand"
            :rows="dailyStockGroups"
            :columns="stockColumns"
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            class="operation-table"
          >
            <template #body="props">
              <q-tr :props="props" class="stock-brand-row" @click="toggleStockBrand(props.row.brand)">
                <q-td key="brand" :props="props">
                  <div class="client-cell">
                    <button class="stock-expand-action" type="button" @click.stop="toggleStockBrand(props.row.brand)">
                      <ChevronRight :class="{ open: isStockBrandOpen(props.row.brand) }" :size="16" />
                    </button>
                    <span class="document-icon"><PackageCheck :size="18" /></span>
                    <div>
                      <strong>{{ props.row.brand }}</strong>
                    </div>
                  </div>
                </q-td>
                <q-td key="product" :props="props">
                  <strong>Todos</strong>
                </q-td>
                <q-td key="caliber" :props="props">
                  <strong>Total</strong>
                </q-td>
                <q-td key="lot" :props="props">
                  <span class="stock-summary-text">{{ props.row.lots.join(', ') }}</span>
                </q-td>
                <q-td key="boxes" :props="props">
                  <strong>{{ number(props.row.boxes) }}</strong>
                </q-td>
              </q-tr>
              <template v-for="product in props.row.productGroups" :key="product.name">
                <q-tr
                  v-show="isStockBrandOpen(props.row.brand)"
                  :props="props"
                  class="stock-product-row"
                >
                  <q-td key="brand" :props="props"></q-td>
                  <q-td key="product" :props="props"><strong>{{ product.name }}</strong></q-td>
                  <q-td key="caliber" :props="props">Total producto</q-td>
                  <q-td key="lot" :props="props">{{ product.lots.join(', ') }}</q-td>
                  <q-td key="boxes" :props="props"><strong>{{ number(product.boxes) }}</strong></q-td>
                </q-tr>
                <q-tr
                  v-for="row in product.rows"
                  v-show="isStockBrandOpen(props.row.brand)"
                  :key="row.id"
                  :props="props"
                  class="stock-caliber-row"
                >
                  <q-td key="brand" :props="props"></q-td>
                  <q-td key="product" :props="props"></q-td>
                  <q-td key="caliber" :props="props">Calibre {{ row.caliber }}</q-td>
                  <q-td key="lot" :props="props">{{ row.lot }}</q-td>
                  <q-td key="boxes" :props="props">{{ number(row.boxes) }}</q-td>
                </q-tr>
              </template>
            </template>
          </q-table>
          <div v-if="dailyStockGroups.length === 0" class="zone3-empty">
            <PackageCheck :size="36" />
            <strong>Sin stock producido hoy</strong>
            <span>Cierra una producción en Zona 2 para generar stock terminado.</span>
          </div>
        </section>

        <section v-if="warehouseTransfers.length" class="data-card zone3-card stock-transfer-history">
          <div class="zone3-toolbar">
            <div>
              <h2>Movimientos entre almacenes</h2>
              <p>Registro independiente de las órdenes y cargas de expedición.</p>
            </div>
          </div>
          <div v-for="movement in warehouseTransfers" :key="movement.id" class="stock-transfer-row">
            <div><strong>{{ movement.stockLabel }}</strong><small>{{ number(movement.quantity) }} cajas</small></div>
            <span>{{ movement.originWarehouse }} → {{ movement.destinationWarehouse }}</span>
            <small>{{ dateTime(movement.createdAt) }}</small>
          </div>
        </section>
      </template>

      <template v-else-if="!activeLoad">
        <header class="page-header">
          <div>
            <span class="eyebrow"><Truck :size="14" /> ZONA 3 · EXPEDICIÓN</span>
            <h1>Cargas y despachos</h1>
            <p>Fletes armados con pedidos y stock terminado de Zona 2.</p>
          </div>
          <button
            class="primary-action"
            type="button"
            :disabled="!pendingOrders.length"
            @click="openLoadDialog"
          >
            <Plus :size="18" /> Nueva carga
          </button>
        </header>

        <section class="zone3-metrics">
          <article>
            <span>Pedidos disponibles</span><strong>{{ pendingOrders.length }}</strong>
          </article>
          <article>
            <span>En preparación</span><strong>{{ openLoads.length }}</strong>
          </article>
          <article>
            <span>Despachadas</span><strong>{{ dispatchedLoads.length }}</strong>
          </article>
          <article>
            <span>Stock disponible</span><strong>{{ number(totalAvailableStock) }}</strong>
          </article>
        </section>

        <section class="data-card zone3-card">
          <div class="zone3-toolbar">
            <div>
              <h2>Fletes</h2>
              <p>Cada carga puede contener varios documentos y clientes.</p>
            </div>
            <q-input v-model="loadSearch" outlined dense label="Buscar carga, patente o cliente">
              <template #prepend><Search :size="17" /></template>
            </q-input>
          </div>
          <div v-if="filteredLoads.length" class="load-grid">
            <button
              v-for="load in filteredLoads"
              :key="load.id"
              class="load-card"
              type="button"
              @click="openLoad(load)"
            >
              <header>
                <span class="truck-mark"><Truck :size="20" /></span>
                <div>
                  <strong>{{ load.code }}</strong
                  ><small>{{ shortDate(load.date) }}</small>
                </div>
                <span :class="['status-pill', loadStatusClass(load.status)]">{{
                  loadStatusLabel(load.status)
                }}</span>
              </header>
              <dl>
                <div>
                  <dt>Transporte</dt>
                  <dd>{{ load.transport || '-' }}</dd>
                </div>
                <div>
                  <dt>Patente</dt>
                  <dd>{{ load.plate || '-' }}</dd>
                </div>
                <div>
                  <dt>Dock</dt>
                  <dd>{{ load.dock || '-' }}</dd>
                </div>
                <div>
                  <dt>Documentos</dt>
                  <dd>{{ load.orderIds.length }}</dd>
                </div>
              </dl>
              <footer>
                <span>{{ loadClients(load).join(', ') }}</span
                ><ChevronRight :size="18" />
              </footer>
            </button>
          </div>
          <div v-else class="zone3-empty">
            <Truck :size="36" /><strong>Sin cargas para mostrar</strong>
            <span>Registra pedidos desde la sección Pedidos antes de armar un flete.</span>
          </div>
        </section>
      </template>

      <template v-else>
        <header class="load-detail-header">
          <button class="production-back" type="button" @click="goToLoads">
            <ArrowLeft :size="18" /> Volver
          </button>
          <div>
            <span>{{ shortDate(activeLoad.date) }}</span>
            <h1>{{ activeLoad.code }}</h1>
          </div>
          <span :class="['status-pill', loadStatusClass(activeLoad.status)]">{{
            loadStatusLabel(activeLoad.status)
          }}</span>
        </header>

        <section class="load-context-card">
          <div>
            <Truck :size="18" /><span>Transporte</span
            ><strong>{{ activeLoad.transport || '-' }}</strong>
          </div>
          <div>
            <Hash :size="18" /><span>Patente</span><strong>{{ activeLoad.plate || '-' }}</strong>
          </div>
          <div>
            <Warehouse :size="18" /><span>Dock</span><strong>{{ activeLoad.dock || '-' }}</strong>
          </div>
          <div>
            <FileText :size="18" /><span>Documentos</span
            ><strong>{{ activeLoad.orderIds.length }}</strong>
          </div>
        </section>

        <nav class="zone3-steps" aria-label="Etapas de la carga">
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

        <section v-if="currentLoadStep === 'preparar'" class="production-stage zone3-stage">
          <div class="production-stage-heading">
            <div>
              <span>01</span>
              <div>
                <h2>Preparar carga</h2>
                <p>Asocia cada renglón con un lote de stock y la cantidad a reservar.</p>
              </div>
            </div>
          </div>

          <article v-for="order in activeOrders" :key="order.id" class="document-block">
            <header>
              <div>
                <strong>{{ order.documentType }} {{ order.documentNumber }}</strong
                ><span>Folio {{ order.folio || '-' }}</span>
              </div>
              <div>
                <strong>{{ order.client }}</strong
                ><span>{{ order.destination }}</span>
              </div>
            </header>
            <div v-for="line in order.lines" :key="line.id" class="allocation-row">
              <div class="allocation-product">
                <strong>{{ lineLabel(line) }}</strong
                ><span>Calibre {{ line.caliber }} · {{ number(line.quantity) }} cajas</span>
              </div>
              <q-select
                v-model="allocationFor(order, line).stockRowId"
                outlined
                dense
                emit-value
                map-options
                :options="stockOptions"
                label="Lote de Zona 2"
              />
              <NonNegativeInput
                v-model="allocationFor(order, line).planned"
                type="number"
                outlined
                dense
                label="Reservar"
                suffix="cajas"
              />
            </div>
          </article>
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
              Confirmar preparación <ArrowRight :size="17" />
            </button>
          </div>
        </section>

        <section v-if="currentLoadStep === 'cargar'" class="production-stage zone3-stage">
          <div class="production-stage-heading">
            <div>
              <span>02</span>
              <div>
                <h2>Romaneo de carga</h2>
                <p>Confirma las cantidades realmente cargadas sin repetir la guía.</p>
              </div>
            </div>
          </div>
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

        <section v-if="currentLoadStep === 'despachar'" class="production-stage zone3-stage">
          <div class="production-stage-heading">
            <div>
              <span>03</span>
              <div>
                <h2>Despachar</h2>
                <p>Revisa remitos y define la salida correspondiente para cada cliente.</p>
              </div>
            </div>
          </div>
          <div class="dispatch-summary">
            <article v-for="order in activeOrders" :key="order.id">
              <header>
                <div>
                  <strong>{{ order.client }}</strong
                  ><span
                    >{{ order.documentType }} {{ order.documentNumber }} · Folio
                    {{ order.folio || '-' }}</span
                  >
                </div>
                <span>{{ number(loadedForOrder(order.id)) }} cajas</span>
              </header>
              <div class="dispatch-fields">
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
              </div>
              <div v-if="dispatchFor(order).mode === 'dmf'" class="dmf-note">
                <PackageCheck :size="17" /><span>Serie DMF · Despacho Mercadería Fason</span>
              </div>
            </article>
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
              @click="confirmDispatch"
            >
              <Send :size="17" />
              {{ activeLoad.status === 'dispatched' ? 'Carga despachada' : 'Confirmar despacho' }}
            </button>
          </div>
        </section>
      </template>
    </div>

    <div v-else-if="showOrderFormPage" class="page-content page-content--form zone3-page">
      <section class="zone3-dialog page-panel">
        <q-form @submit.prevent="saveOrder">
          <header class="dialog-header">
            <div class="dialog-title-wrap">
              <span class="dialog-icon"><ClipboardList :size="20" /></span>
              <div class="dialog-heading">
                <h2 class="dialog-title">Nuevo pedido de expedición</h2>
                <span class="dialog-subtitle">Referencia documental para Expedición</span>
              </div>
            </div>
            <button class="icon-action" type="button" @click="goToOrders">
              <X :size="20" />
            </button>
          </header>
          <div class="zone3-dialog-body">
            <div class="dialog-form-grid">
              <q-select
                v-model="orderForm.documentType"
                outlined
                dense
                :options="['REMITO', 'OV']"
                label="Tipo de documento"
              />
              <q-input
                v-model="orderForm.documentNumber"
                outlined
                dense
                label="Número de documento *"
              />
              <q-input v-model="orderForm.folio" outlined dense label="Número de folio" />
              <q-input v-model="orderForm.clientCode" outlined dense label="Código SAP cliente" />
              <q-input v-model="orderForm.client" outlined dense label="Cliente / razón social *" />
              <q-input v-model="orderForm.destination" outlined dense label="Destino de entrega" />
            </div>
            <div class="dialog-section-title">
              <div>
                <h3>Mercadería solicitada</h3>
                <p>Artículo, calibre y cantidad. La descripción es opcional.</p>
              </div>
              <button class="secondary-action" type="button" @click="addOrderLine">
                <Plus :size="16" /> Agregar renglón
              </button>
            </div>
            <div v-for="(line, index) in orderForm.lines" :key="line.id" class="order-line-form">
              <q-input v-model="line.article" outlined dense label="Artículo SAP" />
              <q-input v-model="line.description" outlined dense label="Descripción (opcional)" />
              <q-select
                v-model="line.caliber"
                :options="caliberOptions"
                outlined
                dense
                label="Calibre"
              />
              <NonNegativeInput
                v-model="line.quantity"
                :minimum="1"
                type="number"
                outlined
                dense
                label="Cantidad"
                suffix="cajas"
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
          </div>
          <footer class="dialog-footer">
            <button class="secondary-action" type="button" @click="goToOrders">Cancelar</button
            ><button class="primary-action" type="submit">
              <Save :size="17" /> Guardar pedido
            </button>
          </footer>
        </q-form>
      </section>
    </div>

    <div v-else-if="showLoadFormPage" class="page-content page-content--form zone3-page">
      <section class="zone3-dialog load-dialog page-panel">
        <q-form @submit.prevent="createLoad">
          <header class="dialog-header">
            <div class="dialog-title-wrap">
              <span class="dialog-icon"><Truck :size="20" /></span>
              <div class="dialog-heading">
                <h2 class="dialog-title">Nueva carga</h2>
                <span class="dialog-subtitle">Agrupa documentos en un mismo flete</span>
              </div>
            </div>
            <button class="icon-action" type="button" @click="goToLoads">
              <X :size="20" />
            </button>
          </header>
          <div class="zone3-dialog-body">
            <div class="dialog-form-grid">
              <DateInput v-model="loadForm.date" label="Fecha" />
              <q-input v-model="loadForm.transport" outlined dense label="Transporte" />
              <q-input v-model="loadForm.plate" outlined dense label="Patente" />
              <q-input v-model="loadForm.dock" outlined dense label="Dock de carga" />
            </div>
            <div class="dialog-section-title">
              <div>
                <h3>Pedidos disponibles</h3>
                <p>Selecciona uno o más documentos para el flete.</p>
              </div>
            </div>
            <div class="pending-order-picker">
              <label v-for="order in pendingOrders" :key="order.id">
                <q-checkbox v-model="loadForm.orderIds" :val="order.id" color="red" />
                <span
                  ><strong>{{ order.documentNumber }} · {{ order.client }}</strong
                  ><small
                    >{{ order.destination }} · {{ number(orderBoxes(order)) }} cajas</small
                  ></span
                >
              </label>
            </div>
          </div>
          <footer class="dialog-footer">
            <button class="secondary-action" type="button" @click="goToLoads">Cancelar</button
            ><button class="primary-action" type="submit"><Truck :size="17" /> Crear carga</button>
          </footer>
        </q-form>
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
                <span class="dialog-subtitle">Movimiento interno de stock, sin pedido ni expedición.</span>
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
            <q-input v-model="stockTransferForm.originWarehouse" outlined dense label="Almacén origen" />
            <q-input v-model="stockTransferForm.originLocation" outlined dense label="Ubicación origen" />
            <q-input v-model="stockTransferForm.destinationWarehouse" outlined dense label="Almacén destino" />
            <q-input v-model="stockTransferForm.destinationLocation" outlined dense label="Ubicación destino" />
          </div>
          <footer class="dialog-footer">
            <button class="secondary-action" type="button" @click="stockTransferDialog = false">
              Cancelar
            </button>
            <button class="primary-action" type="submit"><Save :size="17" /> Registrar movimiento</button>
          </footer>
        </q-form>
      </q-card>
    </q-dialog>

    <div v-if="feedback.message" :class="['feedback-toast', `feedback-toast--${feedback.type}`]">
      <AlertCircle v-if="feedback.type === 'error'" :size="19" /><CheckCircle2
        v-else
        :size="19"
      /><span>{{ feedback.message }}</span>
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
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CopyCheck,
  FileText,
  Hash,
  PackageCheck,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Truck,
  Warehouse,
  X,
} from '@lucide/vue'
import { createId } from '@/utils/production'

const ordersKey = 'mark-frigorifico-pedidos-v1'
const loadsKey = 'mark-frigorifico-cargas-v1'
const finishedStockKey = 'mark-frigorifico-stock-terminado-v1'
const warehouseTransfersKey = 'mark-frigorifico-movimientos-almacen-v1'
const route = useRoute()
const router = useRouter()
const today = new Date().toISOString().slice(0, 10)
const caliberOptions = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14']
const storedOrders = loadArray(ordersKey)
const demoOrderIds = new Set(storedOrders.filter((order) => order.demo).map((order) => order.id))
const orders = ref(storedOrders.filter((order) => !order.demo))
const storedLoads = loadArray(loadsKey)
const loads = ref(removeDemoReferences(storedLoads, demoOrderIds).map(normalizeLoad))
const finishedStock = ref(loadArray(finishedStockKey))
const warehouseTransfers = ref(loadArray(warehouseTransfersKey))
const orderSearch = ref('')
const loadSearch = ref('')
const expandedStockBrands = ref(new Set())
const stockTransferDialog = ref(false)
const feedback = reactive({ message: '', type: 'success' })

if (demoOrderIds.size) {
  localStorage.setItem(ordersKey, JSON.stringify(orders.value))
  localStorage.setItem(loadsKey, JSON.stringify(loads.value))
}

const emptyOrderForm = () => ({
  documentType: 'REMITO',
  documentNumber: '',
  folio: '',
  clientCode: '',
  client: '',
  destination: '',
  lines: [emptyOrderLine()],
})
const orderForm = reactive(emptyOrderForm())
const loadForm = reactive({ date: today, transport: '', plate: '', dock: '', orderIds: [] })
const stockTransferForm = reactive(emptyWarehouseTransfer())
const loadSteps = [
  { number: '1', value: 'preparar', label: 'Preparar' },
  { number: '2', value: 'cargar', label: 'Cargar' },
  { number: '3', value: 'despachar', label: 'Despachar' },
]
const stockColumns = [
  { name: 'brand', label: 'Marca comercial', field: 'brand', align: 'left' },
  { name: 'product', label: 'Producto', field: 'product', align: 'left' },
  { name: 'caliber', label: 'Calibre', field: 'caliber', align: 'left' },
  { name: 'lot', label: 'Lote', field: 'lot', align: 'left' },
  { name: 'boxes', label: 'Cajas producidas', field: 'boxes', align: 'left' },
]

const showOrders = computed(() => route.query.view === 'pedidos')
const showStock = computed(() => !route.query.view && !route.query.load)
const showOrderFormPage = computed(() => route.query.action === 'pedido')
const showLoadFormPage = computed(() => route.query.action === 'carga')
const activeLoad = computed(() => loads.value.find((load) => load.id === route.query.load))
const currentLoadStep = computed(() => {
  const requested = route.query.step
  if (loadSteps.some((step) => step.value === requested) && canOpenLoadStep(requested))
    return requested
  if (!activeLoad.value) return 'preparar'
  if (activeLoad.value.status === 'dispatched' || activeLoad.value.status === 'loaded')
    return 'despachar'
  if (activeLoad.value.status === 'ready' || activeLoad.value.status === 'loading') return 'cargar'
  return 'preparar'
})
const pendingOrders = computed(() =>
  orders.value.filter((order) => orderStatusKey(order) === 'pending'),
)
const assignedOrders = computed(() =>
  orders.value.filter((order) => orderStatusKey(order) === 'assigned'),
)
const dispatchedOrders = computed(() =>
  orders.value.filter((order) => orderStatusKey(order) === 'dispatched'),
)
const openLoads = computed(() => loads.value.filter((load) => load.status !== 'dispatched'))
const dispatchedLoads = computed(() => loads.value.filter((load) => load.status === 'dispatched'))
const totalRequested = computed(() =>
  orders.value.reduce((sum, order) => sum + orderBoxes(order), 0),
)
const filteredOrders = computed(() => {
  const term = orderSearch.value.trim().toLocaleLowerCase('es')
  return orders.value.filter(
    (order) =>
      !term ||
      `${order.documentNumber} ${order.folio} ${order.client} ${order.destination}`
        .toLocaleLowerCase('es')
        .includes(term),
  )
})
const filteredLoads = computed(() => {
  const term = loadSearch.value.trim().toLocaleLowerCase('es')
  return [...loads.value]
    .reverse()
    .filter(
      (load) =>
        !term ||
        `${load.code} ${load.plate} ${load.transport} ${loadClients(load).join(' ')}`
          .toLocaleLowerCase('es')
          .includes(term),
    )
})
const stockRows = computed(() =>
  finishedStock.value.flatMap((item) =>
    (item.outputs || [])
      .filter((output) => Number(output.boxes || 0) > 0)
      .map((output) => ({
        id: `${item.id}:${output.caliber}`,
        sourceId: item.id,
        brand: item.brand,
        product: item.product,
        caliber: output.caliber,
        lot: item.lot,
        manufactureDate: item.manufactureDate,
        expirationDate: item.expirationDate,
        createdAt: item.createdAt,
        boxes: Number(output.boxes || 0),
      })),
  ),
)
const dailyStockRows = computed(() =>
  stockRows.value.filter((row) => String(row.createdAt || '').slice(0, 10) === today),
)
const dailyStockGroups = computed(() => {
  const groups = new Map()
  dailyStockRows.value.forEach((row) => {
    const current = groups.get(row.brand) || {
      brand: row.brand,
      boxes: 0,
      available: 0,
      products: new Set(),
      lots: new Set(),
      rows: [],
      productRows: new Map(),
    }
    current.boxes += row.boxes
    current.available += stockAvailable(row)
    current.products.add(row.product)
    current.lots.add(row.lot)
    current.rows.push(row)
    const product = current.productRows.get(row.product) || {
      name: row.product,
      boxes: 0,
      available: 0,
      lots: new Set(),
      rows: [],
    }
    product.boxes += row.boxes
    product.available += stockAvailable(row)
    product.lots.add(row.lot)
    product.rows.push(row)
    current.productRows.set(row.product, product)
    groups.set(row.brand, current)
  })
  return [...groups.values()].map((group) => ({
    ...group,
    products: [...group.products],
    lots: [...group.lots],
    rows: group.rows.sort((left, right) =>
      `${left.product}${left.caliber}${left.lot}`.localeCompare(
        `${right.product}${right.caliber}${right.lot}`,
        'es',
      ),
    ),
    productGroups: [...group.productRows.values()].map((product) => ({
      ...product,
      lots: [...product.lots],
      rows: product.rows.sort((left, right) =>
        `${left.caliber}${left.lot}`.localeCompare(`${right.caliber}${right.lot}`, 'es'),
      ),
    })),
  }))
})
const stockOptions = computed(() =>
  stockRows.value.map((row) => ({
    label: `${row.brand} · ${row.caliber} · Lote ${row.lot} · ${number(stockAvailable(row, activeLoad.value?.id))} disp.`,
    value: row.id,
  })),
)
const transferStockOptions = computed(() =>
  stockRows.value.map((row) => ({
    label: `${row.brand} · ${row.caliber} · Lote ${row.lot} · ${number(stockAvailable(row))} disp.`,
    value: row.id,
  })),
)
const totalAvailableStock = computed(() =>
  stockRows.value.reduce((sum, row) => sum + stockAvailable(row), 0),
)
const activeOrders = computed(() =>
  activeLoad.value
    ? activeLoad.value.orderIds
        .map((id) => orders.value.find((order) => order.id === id))
        .filter(Boolean)
    : [],
)
const activeAllocationRows = computed(() =>
  activeOrders.value.flatMap((order) =>
    order.lines.map((line) => ({
      key: allocationKey(order, line),
      order,
      line,
      allocation: allocationFor(order, line),
    })),
  ),
)

watch(orders, (value) => localStorage.setItem(ordersKey, JSON.stringify(value)), { deep: true })
watch(loads, (value) => localStorage.setItem(loadsKey, JSON.stringify(value)), { deep: true })
watch(warehouseTransfers, (value) => localStorage.setItem(warehouseTransfersKey, JSON.stringify(value)), {
  deep: true,
})
watch(
  () => route.query.action,
  (action) => {
    if (action === 'pedido') Object.assign(orderForm, emptyOrderForm())
    if (action === 'carga')
      Object.assign(loadForm, { date: today, transport: '', plate: '', dock: '', orderIds: [] })
  },
  { immediate: true },
)

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
function emptyOrderLine() {
  return { id: createId(), article: '', description: '', caliber: '5', quantity: 1 }
}
function emptyWarehouseTransfer() {
  return {
    stockRowId: '',
    quantity: 0,
    originWarehouse: '',
    originLocation: '',
    destinationWarehouse: '',
    destinationLocation: '',
  }
}
function lineLabel(line) {
  return (
    line.description?.trim() ||
    (line.article ? `Artículo ${line.article}` : 'Artículo sin descripción')
  )
}
function normalizeLoad(load) {
  return {
    ...load,
    allocations: load.allocations || {},
    loading: { start: '', end: '', pallets: 0, responsible: '', ...(load.loading || {}) },
    dispatch: load.dispatch || {},
  }
}
function removeDemoReferences(savedLoads, demoIds) {
  if (!demoIds.size) return savedLoads
  return savedLoads
    .map((load) => ({
      ...load,
      orderIds: (load.orderIds || []).filter((orderId) => !demoIds.has(orderId)),
      allocations: Object.fromEntries(
        Object.entries(load.allocations || {}).filter(
          ([key]) => ![...demoIds].some((orderId) => key.startsWith(`${orderId}:`)),
        ),
      ),
      dispatch: Object.fromEntries(
        Object.entries(load.dispatch || {}).filter(([orderId]) => !demoIds.has(orderId)),
      ),
    }))
    .filter((load) => load.orderIds.length)
}
function openOrderDialog() {
  router.push({ path: '/expedicion', query: { view: 'pedidos', action: 'pedido' } })
}
function addOrderLine() {
  orderForm.lines.push(emptyOrderLine())
}
function removeOrderLine(index) {
  if (orderForm.lines.length > 1) orderForm.lines.splice(index, 1)
}
function saveOrder() {
  if (!orderForm.documentNumber.trim() || !orderForm.client.trim())
    return showFeedback('Completa documento y cliente', 'error')
  if (orderForm.lines.some((line) => Number(line.quantity || 0) <= 0))
    return showFeedback('Informa una cantidad válida en cada renglón', 'error')
  orders.value.unshift({ ...clone(orderForm), id: createId(), createdAt: new Date().toISOString() })
  showFeedback('Pedido disponible para Expedición')
  goToOrders()
}
function orderBoxes(order) {
  return (order.lines || []).reduce((sum, line) => sum + Math.max(0, Number(line.quantity || 0)), 0)
}
function orderStatusKey(order) {
  const load = loads.value.find((item) => item.orderIds.includes(order.id))
  return !load ? 'pending' : load.status === 'dispatched' ? 'dispatched' : 'assigned'
}
function orderStatus(order) {
  return { pending: 'Pendiente', assigned: 'Asignado a carga', dispatched: 'Despachado' }[
    orderStatusKey(order)
  ]
}
function orderStatusClass(order) {
  return { pending: 'status-warning', assigned: 'status-active', dispatched: 'status-success' }[
    orderStatusKey(order)
  ]
}
function isStockBrandOpen(brand) {
  return expandedStockBrands.value.has(brand)
}
function toggleStockBrand(brand) {
  const next = new Set(expandedStockBrands.value)
  if (next.has(brand)) next.delete(brand)
  else next.add(brand)
  expandedStockBrands.value = next
}
function openWarehouseTransfer() {
  Object.assign(stockTransferForm, emptyWarehouseTransfer())
  stockTransferDialog.value = true
}
function saveWarehouseTransfer() {
  const stockRow = stockRows.value.find((row) => row.id === stockTransferForm.stockRowId)
  const quantity = Number(stockTransferForm.quantity || 0)
  if (
    !stockRow ||
    quantity <= 0 ||
    !stockTransferForm.originWarehouse.trim() ||
    !stockTransferForm.destinationWarehouse.trim()
  )
    return showFeedback('Completa lote, almacén origen, almacén destino y cantidad', 'error')
  if (quantity > stockAvailable(stockRow))
    return showFeedback('La cantidad supera el stock disponible del lote', 'error')

  warehouseTransfers.value.unshift({
    id: createId(),
    stockRowId: stockRow.id,
    stockLabel: stockLabel(stockRow.id),
    quantity,
    originWarehouse: stockTransferForm.originWarehouse.trim(),
    originLocation: stockTransferForm.originLocation.trim(),
    destinationWarehouse: stockTransferForm.destinationWarehouse.trim(),
    destinationLocation: stockTransferForm.destinationLocation.trim(),
    createdAt: new Date().toISOString(),
  })
  stockTransferDialog.value = false
  showFeedback('Movimiento entre almacenes registrado')
}
function openLoadDialog() {
  router.push({ path: '/expedicion', query: { view: 'cargas', action: 'carga' } })
}
function createLoad() {
  if (!loadForm.orderIds.length) return showFeedback('Selecciona al menos un pedido', 'error')
  const sequence = loads.value.length + 1
  const load = normalizeLoad({
    id: createId(),
    code: `CARGA-${String(sequence).padStart(3, '0')}`,
    ...clone(loadForm),
    status: 'preparing',
    createdAt: new Date().toISOString(),
  })
  load.orderIds.forEach((orderId) =>
    orders.value
      .find((order) => order.id === orderId)
      ?.lines.forEach((line) => {
        load.allocations[`${orderId}:${line.id}`] = {
          stockRowId: '',
          planned: Number(line.quantity || 0),
          loaded: 0,
        }
      }),
  )
  loads.value.push(load)
  openLoad(load)
}
function openLoad(load) {
  router.push({ path: '/expedicion', query: { view: 'cargas', load: load.id, step: nextStep(load) } })
}
function goToLoads() {
  router.push({ path: '/expedicion', query: { view: 'cargas' } })
}
function goToOrders() {
  router.push({ path: '/expedicion', query: { view: 'pedidos' } })
}
function nextStep(load) {
  if (load.status === 'dispatched' || load.status === 'loaded') return 'despachar'
  if (load.status === 'ready' || load.status === 'loading') return 'cargar'
  return 'preparar'
}
function loadStatusLabel(status) {
  return (
    {
      preparing: 'En preparación',
      ready: 'Lista para cargar',
      loading: 'En carga',
      loaded: 'Cargada',
      dispatched: 'Despachada',
    }[status] || 'Borrador'
  )
}
function loadStatusClass(status) {
  return status === 'dispatched'
    ? 'status-success'
    : status === 'loaded' || status === 'ready'
      ? 'status-active'
      : 'status-warning'
}
function loadClients(load) {
  return load.orderIds
    .map((id) => orders.value.find((order) => order.id === id)?.client)
    .filter(Boolean)
}
function allocationKey(order, line) {
  return `${order.id}:${line.id}`
}
function allocationFor(order, line) {
  const key = allocationKey(order, line)
  if (!activeLoad.value.allocations[key])
    activeLoad.value.allocations[key] = {
      stockRowId: '',
      planned: Number(line.quantity || 0),
      loaded: 0,
    }
  return activeLoad.value.allocations[key]
}
function reservedForStock(stockRowId, excludedLoadId = null) {
  return loads.value
    .filter((load) => load.status !== 'dispatched' && load.id !== excludedLoadId)
    .reduce(
      (sum, load) =>
        sum +
        Object.values(load.allocations || {})
          .filter((item) => item.stockRowId === stockRowId)
          .reduce((part, item) => part + Number(item.planned || 0), 0),
      0,
    )
}
function stockAvailable(row, excludedLoadId = null) {
  return row ? Math.max(0, row.boxes - reservedForStock(row.id, excludedLoadId)) : 0
}
function stockLabel(stockRowId) {
  const row = stockRows.value.find((item) => item.id === stockRowId)
  return row ? `${row.brand} · ${row.caliber} · Lote ${row.lot}` : 'Sin lote asociado'
}
function confirmPreparation() {
  const rows = activeAllocationRows.value
  if (
    !rows.length ||
    rows.some(
      ({ allocation }) =>
        !allocation.stockRowId ||
        Number(allocation.planned || 0) <= 0,
    )
  )
    return showFeedback('Asocia lote y cantidad en todos los renglones', 'error')
  const requestedByStock = rows.reduce(
    (totals, { allocation }) => ({
      ...totals,
      [allocation.stockRowId]:
        (totals[allocation.stockRowId] || 0) + Number(allocation.planned || 0),
    }),
    {},
  )
  const invalid = Object.entries(requestedByStock).some(
    ([stockRowId, requested]) =>
      requested >
      stockAvailable(
        stockRows.value.find((row) => row.id === stockRowId),
        activeLoad.value.id,
      ),
  )
  if (invalid) return showFeedback('La reserva supera el stock del lote seleccionado', 'error')
  activeLoad.value.status = 'ready'
  goToLoadStep('cargar')
  showFeedback('Carga lista para romaneo')
}
function copyPlannedToLoaded() {
  activeAllocationRows.value.forEach(({ allocation }) => {
    allocation.loaded = Number(allocation.planned || 0)
  })
  showFeedback('Cantidades planificadas copiadas')
}
function confirmLoading() {
  if (!activeLoad.value.loading.responsible.trim())
    return showFeedback('Informa el responsable de carga', 'error')
  if (activeAllocationRows.value.every(({ allocation }) => Number(allocation.loaded || 0) <= 0))
    return showFeedback('Informa las cantidades cargadas', 'error')
  activeLoad.value.status = 'loaded'
  activeOrders.value.forEach((order) => dispatchFor(order))
  goToLoadStep('despachar')
  showFeedback('Romaneo confirmado')
}
function dispatchFor(order) {
  if (!activeLoad.value.dispatch[order.id])
    activeLoad.value.dispatch[order.id] = {
      remito: '',
      mode: dmfEligible(order) ? 'dmf' : 'delivery',
    }
  return activeLoad.value.dispatch[order.id]
}
function dmfEligible(order) {
  return /coqui|fason/i.test(`${order.client} ${order.destination}`)
}
function dispatchOptions(order) {
  const options = [{ label: 'Entrega / remito interno', value: 'delivery' }]
  if (dmfEligible(order)) options.push({ label: 'DMF · Despacho Mercadería Fason', value: 'dmf' })
  return options
}
function confirmDispatch() {
  if (activeOrders.value.some((order) => !dispatchFor(order).remito.trim()))
    return showFeedback('Completa el remito de cada cliente', 'error')
  activeLoad.value.status = 'dispatched'
  activeLoad.value.dispatchedAt = new Date().toISOString()
  showFeedback('Carga despachada')
}
function loadedForOrder(orderId) {
  return activeAllocationRows.value
    .filter((item) => item.order.id === orderId)
    .reduce((sum, item) => sum + Number(item.allocation.loaded || 0), 0)
}
function loadLoadedBoxes(load) {
  return Object.values(load.allocations || {}).reduce(
    (sum, item) => sum + Number(item.loaded || 0),
    0,
  )
}
function canOpenLoadStep(step) {
  if (!activeLoad.value) return false
  if (step === 'preparar') return true
  if (step === 'cargar')
    return ['ready', 'loading', 'loaded', 'dispatched'].includes(activeLoad.value.status)
  return ['loaded', 'dispatched'].includes(activeLoad.value.status)
}
function loadStepDone(step) {
  if (step === 'preparar')
    return ['ready', 'loading', 'loaded', 'dispatched'].includes(activeLoad.value?.status)
  if (step === 'cargar') return ['loaded', 'dispatched'].includes(activeLoad.value?.status)
  return activeLoad.value?.status === 'dispatched'
}
function goToLoadStep(step) {
  router.push({ path: '/expedicion', query: { view: 'cargas', load: activeLoad.value.id, step } })
}
function number(value) {
  return Math.max(0, Number(value || 0)).toLocaleString('es-AR')
}
function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
function shortDate(value) {
  if (!value) return '-'
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR')
}
function showFeedback(message, type = 'success') {
  feedback.message = message
  feedback.type = type
  window.setTimeout(() => {
    feedback.message = ''
  }, 3000)
}
</script>

<style scoped>
.zone3-page {
  display: grid;
  gap: 22px;
}
.zone3-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.zone3-metrics article {
  display: grid;
  gap: 7px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
}
.zone3-metrics span {
  color: var(--muted);
  font-size: 12px;
}
.zone3-metrics strong {
  font-size: 24px;
  letter-spacing: -0.04em;
}
.zone3-card,
.report-card {
  padding: 0;
  overflow: hidden;
}
.zone3-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-bottom: 1px solid var(--line);
}
.zone3-toolbar h2,
.dialog-section-title h3 {
  margin: 0;
  font-size: 17px;
}
.zone3-toolbar p,
.dialog-section-title p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.zone3-toolbar .q-field {
  width: min(320px, 100%);
}
.order-list {
  display: grid;
}
.order-row {
  display: grid;
  grid-template-columns: 1.3fr 1.35fr 1fr 0.8fr auto;
  gap: 20px;
  align-items: center;
  padding: 17px 22px;
  border-bottom: 1px solid var(--line);
}
.order-row:last-child {
  border-bottom: 0;
}
.order-row > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.order-row span:not(.status-pill),
.order-row small {
  color: var(--muted);
  font-size: 11px;
}
.order-row strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-document {
  display: flex !important;
  flex-direction: row;
  gap: 11px !important;
  align-items: center;
}
.order-document div {
  display: grid;
  min-width: 0;
  gap: 2px;
}
.document-icon,
.truck-mark {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 11px;
  background: var(--soft-red);
  color: var(--brand);
}
.zone3-empty {
  display: grid;
  place-items: center;
  gap: 7px;
  padding: 58px 20px;
  color: #aaa;
  text-align: center;
}
.zone3-empty strong {
  color: var(--ink);
  font-size: 15px;
}
.zone3-empty span {
  font-size: 12px;
}
.load-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}
.load-card {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  transition: 160ms ease;
}
.load-card:hover {
  border-color: #ccc;
  box-shadow: 0 8px 25px rgb(0 0 0 / 5%);
  transform: translateY(-1px);
}
.load-card header {
  display: flex;
  gap: 11px;
  align-items: center;
}
.load-card header div {
  display: grid;
  flex: 1;
  gap: 2px;
}
.load-card header small,
.load-card footer span {
  color: var(--muted);
  font-size: 11px;
}
.load-card dl {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 0;
  padding: 13px;
  border-radius: 11px;
  background: #f8f8f7;
}
.load-card dl div {
  display: grid;
  gap: 3px;
}
.load-card dt {
  color: var(--muted);
  font-size: 10px;
}
.load-card dd {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}
.load-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.load-detail-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}
.load-detail-header > div {
  text-align: center;
}
.load-detail-header h1 {
  margin: 2px 0 0;
  font-size: 26px;
}
.load-detail-header > .status-pill {
  justify-self: end;
}
.load-context-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
}
.load-context-card div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 10px;
  align-items: center;
  padding: 15px 18px;
  border-right: 1px solid var(--line);
}
.load-context-card div:last-child {
  border-right: 0;
}
.load-context-card svg {
  grid-row: 1 / span 2;
  color: var(--brand);
}
.load-context-card span {
  color: var(--muted);
  font-size: 10px;
}
.load-context-card strong {
  font-size: 13px;
}
.zone3-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-width: 700px;
  margin: 0 auto;
}
.zone3-steps button {
  position: relative;
  display: grid;
  place-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #999;
  cursor: pointer;
}
.zone3-steps button::before {
  position: absolute;
  top: 17px;
  right: 50%;
  left: -50%;
  height: 2px;
  background: #ddd;
  content: '';
  z-index: 0;
}
.zone3-steps button:first-child::before {
  display: none;
}
.zone3-steps button > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 2px solid #ddd;
  border-radius: 50%;
  background: var(--canvas);
  font-size: 12px;
  font-weight: 700;
  z-index: 1;
}
.zone3-steps button.active > span,
.zone3-steps button.done > span {
  border-color: var(--brand);
  background: var(--brand);
  color: #fff;
}
.zone3-steps button.done::before,
.zone3-steps button.active::before {
  background: var(--brand);
}
.zone3-steps small {
  font-weight: 600;
}
.zone3-stage {
  overflow: hidden;
}
.document-block {
  margin: 0 22px 16px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 13px;
}
.document-block > header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 16px;
  background: #f8f8f7;
}
.document-block > header div {
  display: grid;
  gap: 2px;
}
.document-block > header span {
  color: var(--muted);
  font-size: 11px;
}
.allocation-row {
  display: grid;
  grid-template-columns: 1.25fr 1.35fr 0.7fr;
  gap: 10px;
  align-items: start;
  padding: 14px 16px;
  border-top: 1px solid var(--line);
}
.allocation-product {
  display: grid;
  gap: 4px;
  padding-top: 6px;
}
.allocation-product span {
  color: var(--muted);
  font-size: 11px;
}
.inline-warning {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 22px 16px;
  padding: 13px 15px;
  border-radius: 11px;
  background: #fff5e8;
  color: #8c5700;
  font-size: 12px;
}
.loading-fields {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 0 22px 18px;
}
.romaneo-table {
  margin: 0 22px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 13px;
}
.romaneo-head,
.romaneo-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 0.55fr 0.7fr;
  gap: 16px;
  align-items: center;
  padding: 12px 15px;
}
.romaneo-head {
  background: #f5f5f4;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.romaneo-row {
  border-top: 1px solid var(--line);
}
.romaneo-row > div:not(.q-field) {
  display: grid;
  gap: 2px;
}
.romaneo-row span {
  color: var(--muted);
  font-size: 11px;
}
.dispatch-summary {
  display: grid;
  gap: 12px;
  margin: 0 22px;
}
.dispatch-summary article {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 13px;
}
.dispatch-summary article > header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 13px;
}
.dispatch-summary article > header div {
  display: grid;
  gap: 3px;
}
.dispatch-summary article span {
  color: var(--muted);
  font-size: 11px;
}
.dispatch-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.dmf-note {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 11px;
  padding: 9px 11px;
  border-radius: 9px;
  background: var(--soft-red);
  color: var(--brand);
}
.dmf-note span {
  color: inherit !important;
}
.dispatch-total {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin: 18px 22px 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--line);
}
.dispatch-total div {
  display: grid;
  gap: 5px;
  padding: 15px;
  background: #fff;
}
.dispatch-total span {
  color: var(--muted);
  font-size: 11px;
}
.dispatch-total strong {
  font-size: 19px;
}
.zone3-dialog {
  width: min(940px, 96vw);
  max-width: none;
  border-radius: 16px;
}
.load-dialog {
  width: min(760px, 96vw);
}
.zone3-dialog-body {
  display: grid;
  gap: 20px;
  max-height: 70vh;
  padding: 20px;
  overflow-y: auto;
}
.stock-transfer-dialog {
  width: min(650px, 96vw);
}
.stock-transfer-history {
  margin-top: 18px;
}
.stock-transfer-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px 22px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
.stock-transfer-row div {
  display: grid;
  gap: 2px;
}
.stock-transfer-row small,
.stock-transfer-row > span {
  color: var(--muted);
  font-size: 11px;
}
.dialog-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.dialog-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 4px;
}
.order-line-form {
  display: grid;
  grid-template-columns: 0.8fr 1.4fr 1fr 0.8fr 0.8fr auto;
  gap: 10px;
  align-items: start;
}
.pending-order-picker {
  display: grid;
  gap: 8px;
}
.pending-order-picker label {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 11px;
  border: 1px solid var(--line);
  border-radius: 11px;
  cursor: pointer;
}
.pending-order-picker label > span {
  display: grid;
  gap: 2px;
}
.pending-order-picker small {
  color: var(--muted);
}
.report-card {
  overflow: hidden;
}
.report-table-wrap {
  overflow-x: auto;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.report-table th {
  padding: 11px 14px;
  background: #f5f5f4;
  color: var(--muted);
  font-size: 10px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}
.report-table td {
  padding: 12px 14px;
  border-top: 1px solid var(--line);
  white-space: nowrap;
}
@media (max-width: 1100px) {
  .allocation-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .allocation-product {
    grid-column: 1 / -1;
  }
  .order-row {
    grid-template-columns: 1.3fr 1.2fr 0.8fr auto;
  }
  .stock-transfer-row {
    grid-template-columns: 1fr auto;
  }
  .stock-transfer-row > span {
    grid-column: 1 / -1;
  }
  .order-row > div:nth-child(3) {
    display: none;
  }
}
@media (max-width: 700px) {
  .zone3-metrics,
  .load-grid,
  .load-context-card,
  .loading-fields,
  .dispatch-fields,
  .dispatch-total {
    grid-template-columns: 1fr 1fr;
  }
  .zone3-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .zone3-toolbar .q-field {
    width: 100%;
  }
  .order-row {
    grid-template-columns: 1fr auto;
  }
  .order-row > div:not(:first-child) {
    display: none;
  }
  .load-card dl {
    grid-template-columns: 1fr 1fr;
  }
  .load-detail-header {
    grid-template-columns: auto 1fr auto;
  }
  .load-context-card div:nth-child(2) {
    border-right: 0;
  }
  .load-context-card div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--line);
  }
  .romaneo-head {
    display: none;
  }
  .romaneo-row {
    grid-template-columns: 1fr 1fr;
  }
  .dialog-form-grid,
  .order-line-form {
    grid-template-columns: 1fr;
  }
  .order-line-form .icon-action {
    justify-self: end;
  }
}
</style>
