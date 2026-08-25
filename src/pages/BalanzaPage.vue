<template>
  <q-page class="page-shell">
    <div class="page-content">
      <header class="page-header">
        <div>
          <h1>Balanza</h1>
          <p>Registra ingresos, pesos y documentacion de cada camion.</p>
        </div>
        <button class="primary-action" type="button" @click="newTruck">
          <Plus :size="20" />
          Nuevo camion
        </button>
      </header>

      <section class="data-card">
        <div class="data-card-header">
          <div>
            <div class="title-row">
              <h2>Camiones del turno</h2>
              <span class="count-badge">{{ trucks.length }}</span>
            </div>
            <p>Los calculos se actualizan automaticamente.</p>
          </div>
        </div>

        <q-table
          flat
          row-key="id"
          :rows="trucks"
          :columns="columns"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="operation-table gt-sm"
          @row-click="(_, row) => openTruckAction(row)"
        >
          <template #body-cell-client="props">
            <q-td :props="props">
              <div class="client-cell">
                <span class="truck-avatar"><Truck :size="19" /></span>
                <div>
                  <strong>{{ props.row.client }}</strong
                  ><small>{{ props.row.dte }}</small>
                </div>
              </div>
            </q-td>
          </template>
          <template #body-cell-patentes="props">
            <q-td :props="props">{{ props.row.chasis }} / {{ props.row.acoplado || '-' }}</q-td>
          </template>
          <template #body-cell-date="props">
            <q-td :props="props">{{ truckDate(props.row) }}</q-td>
          </template>
        </q-table>

        <div class="truck-list lt-md">
          <article
            v-for="truck in trucks"
            :key="truck.id"
            class="truck-card"
            @click="openTruckAction(truck)"
          >
            <div class="truck-card-top">
              <span class="truck-avatar"><Truck :size="20" /></span>
              <div class="truck-card-title">
                <strong>{{ truck.client }}</strong
                ><span>{{ truck.chasis }} / {{ truck.acoplado }}</span>
              </div>
            </div>
            <div class="truck-card-values">
              <div>
                <span>Fecha</span><strong>{{ truckDate(truck) }}</strong>
              </div>
              <div>
                <span>Horario</span
                ><strong>{{ truck.inicio || '--:--' }} - {{ truck.fin || '--:--' }}</strong>
              </div>
            </div>
            <div class="truck-card-footer">
              <span>Editar proceso</span>
              <button type="button">Abrir <ChevronRight :size="16" /></button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <q-dialog v-model="detailDialog" :maximized="$q.screen.lt.sm">
      <q-card class="detail-dialog" v-if="detailTruck">
        <header class="dialog-header">
          <div class="dialog-title-wrap">
            <span class="dialog-icon"><Truck :size="22" /></span>
            <div class="dialog-heading">
              <h2 class="dialog-title">{{ detailTruck.client }}</h2>
              <span class="dialog-subtitle">Detalle del camión</span>
            </div>
          </div>
          <button class="icon-action" type="button" @click="detailDialog = false">
            <X :size="20" />
          </button>
        </header>

        <div class="detail-body">
          <div class="detail-summary-row">
            <div class="detail-summary-item">
              <span>Patentes</span>
              <strong>{{ detailTruck.chasis }} / {{ detailTruck.acoplado || '-' }}</strong>
            </div>
            <div class="detail-summary-item">
              <span>Fecha</span>
              <strong>{{ truckDate(detailTruck) }}</strong>
            </div>
          </div>

          <div class="detail-sheet">
            <div class="detail-sheet-row">
              <span>DTE</span>
              <strong>{{ detailTruck.dte || '-' }}</strong>
              <span>Remito</span>
              <strong>{{ detailTruck.remito || '-' }}</strong>
            </div>
            <div class="detail-sheet-row">
              <span>Horario llegada</span>
              <strong>{{ detailTruck.horarioLlegada || '--:--' }}</strong>
              <span>Vacías</span>
              <strong>{{ detailTruck.vacias || 0 }}</strong>
            </div>
            <div class="detail-sheet-row">
              <span>Neto origen</span>
              <strong>{{ kg(metricsFor(detailTruck).netoOrigen) }}</strong>
              <span>Neto planta</span>
              <strong>{{ kg(metricsFor(detailTruck).netoPlanta) }}</strong>
            </div>
            <div class="detail-sheet-row">
              <span>Aves</span>
              <strong>{{ Number(detailTruck.avesOrigen || 0).toLocaleString('es-AR') }}</strong>
              <span>Promedio</span>
              <strong>{{ avg(metricsFor(detailTruck).promedio) }}</strong>
            </div>
            <div class="detail-sheet-row">
              <span>Muertos</span>
              <strong>{{ detailTruck.muertos || 0 }}</strong>
              <span>Decomisos</span>
              <strong>{{
                Number(detailTruck.decomisos || 0) + Number(detailTruck.decomisosVisc || 0)
              }}</strong>
            </div>
            <div class="detail-sheet-row">
              <span>Kg muertos</span>
              <strong>{{ kg(metricsFor(detailTruck).kgMuertos) }}</strong>
              <span>Kg decom.</span>
              <strong>{{ kg(metricsFor(detailTruck).kgDecomisados) }}</strong>
            </div>
            <div class="detail-sheet-row">
              <span>% merma</span>
              <strong>{{ pct(metricsFor(detailTruck).porcentajeMerma) }}</strong>
              <span>% muertos</span>
              <strong>{{ pct(metricsFor(detailTruck).porcentajeMuertos) }}</strong>
            </div>
            <div class="detail-sheet-row detail-sheet-row--single">
              <span>% decom.</span>
              <strong>{{ pct(metricsFor(detailTruck).porcentajeDecomisados) }}</strong>
            </div>
            <div class="detail-sheet-row detail-sheet-row--single">
              <span>Horario</span>
              <strong
                >{{ detailTruck.inicio || '--:--' }} - {{ detailTruck.fin || '--:--' }}</strong
              >
            </div>
          </div>
        </div>

        <footer class="dialog-footer">
          <button class="secondary-action" type="button" @click="detailDialog = false">
            Cerrar
          </button>
          <button class="primary-action" type="button" @click="editTruck(detailTruck)">
            <Pencil :size="17" /> Editar
          </button>
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="formDialog" :maximized="$q.screen.lt.sm" persistent>
      <q-card class="truck-dialog">
        <q-form @submit.prevent="saveTruck">
          <header class="dialog-header">
            <div class="dialog-title-wrap">
              <span class="dialog-icon"><Truck :size="23" /></span>
              <div class="dialog-heading">
                <h2 class="dialog-title">{{ form.id ? form.client : 'Registrar camión' }}</h2>
              </div>
            </div>
            <button class="icon-action" type="button" @click="closeForm"><X :size="20" /></button>
          </header>

          <div class="dialog-body">
            <div v-if="formMode === 'diagram'" class="step-diagram">
              <button class="step-node" type="button" @click="openFormStep(1)">
                <span class="step-node-icon" :class="{ 'step-node-icon--done': isStep1Complete }">
                  <ClipboardList :size="34" />
                </span>
                <strong>Paso 1</strong>
                <small>Ingreso de camión</small>
              </button>

              <div
                class="step-connector"
                :class="{ 'step-connector--active': isStep1Complete }"
              ></div>

              <button
                class="step-node"
                :class="{ 'step-node--locked': !isStep1Complete }"
                type="button"
                :disabled="!isStep1Complete"
                @click="openFormStep(2)"
              >
                <span class="step-node-icon" :class="{ 'step-node-icon--done': isStep1Complete }">
                  <Factory :size="34" />
                </span>
                <strong>Paso 2</strong>
                <small>Datos de línea</small>
              </button>
            </div>

            <q-stepper
              v-else
              v-model="formStep"
              flat
              animated
              class="balanza-stepper"
              :class="{ 'balanza-stepper--single': !form.id }"
            >
              <q-step
                :name="1"
                title="Ingreso de camión"
                icon="local_shipping"
                :done="formStep > 1"
              >
                <section class="form-section">
                  <div class="form-section-heading">
                    <span>1</span>
                    <div>
                      <h3>Identificación y documentos</h3>
                      <p>Cliente, trazabilidad y comprobantes.</p>
                    </div>
                  </div>
                  <div class="form-grid form-grid--dialog">
                    <q-input
                      v-model="form.client"
                      label="Cliente / Granja *"
                      outlined
                      dense
                      class="field-control field-span-2"
                      :rules="[(value) => !!value || 'Campo obligatorio']"
                    />
                    <q-input
                      v-model="form.codigoSn"
                      label="Codigo cliente S/N"
                      outlined
                      dense
                      class="field-control"
                    />
                    <q-input
                      v-model="form.loteSenasa"
                      label="Lote SENASA"
                      outlined
                      dense
                      class="field-control"
                    />
                    <q-input
                      v-model="form.dte"
                      label="Numero DTE *"
                      outlined
                      dense
                      class="field-control"
                      :rules="[(value) => !!value || 'Campo obligatorio']"
                    />
                    <q-input
                      v-model="form.remito"
                      label="Remito"
                      outlined
                      dense
                      class="field-control"
                    />
                  </div>
                </section>

                <section class="form-section">
                  <div class="form-section-heading">
                    <span>2</span>
                    <div>
                      <h3>Vehículo y turno</h3>
                      <p>Patentes y horarios de la operación.</p>
                    </div>
                  </div>
                  <div class="form-grid form-grid--dialog">
                    <q-input
                      v-model="form.chasis"
                      label="Patente chasis *"
                      outlined
                      dense
                      class="field-control uppercase-field"
                      :rules="[(value) => !!value || 'Campo obligatorio']"
                    />
                    <q-input
                      v-model="form.acoplado"
                      label="Patente acoplado"
                      outlined
                      dense
                      class="field-control uppercase-field"
                    />
                    <q-input
                      v-model="form.horarioLlegada"
                      type="time"
                      label="Horario llegada"
                      outlined
                      dense
                      class="field-control"
                    />
                  </div>
                </section>

                <section class="form-section">
                  <div class="form-section-heading">
                    <span>3</span>
                    <div>
                      <h3>Pesaje y aves</h3>
                      <p>Ingresa valores en kilogramos, sin puntos.</p>
                    </div>
                  </div>
                  <div class="weight-groups">
                    <div class="weight-group">
                      <h4>Origen</h4>
                      <div class="form-grid form-grid--compact-two">
                        <q-input
                          v-model.number="form.brutoOrigen"
                          type="number"
                          label="Peso bruto"
                          suffix="kg"
                          outlined
                          dense
                          class="field-control"
                        /><q-input
                          v-model.number="form.taraOrigen"
                          type="number"
                          label="Tara"
                          suffix="kg"
                          outlined
                          dense
                          class="field-control"
                        />
                      </div>
                    </div>
                    <div class="weight-group weight-group--highlight">
                      <h4>Planta</h4>
                      <div class="form-grid form-grid--compact-two">
                        <q-input
                          v-model.number="form.brutoPlanta"
                          type="number"
                          label="Peso bruto"
                          suffix="kg"
                          outlined
                          dense
                          class="field-control"
                        /><q-input
                          v-model.number="form.taraPlanta"
                          type="number"
                          label="Tara"
                          suffix="kg"
                          outlined
                          dense
                          class="field-control"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="form-grid form-grid--two form-grid-spaced">
                    <q-input
                      v-model.number="form.avesOrigen"
                      type="number"
                      label="Aves informadas por granja"
                      outlined
                      dense
                      class="field-control"
                    /><q-input
                      v-model.number="form.avesDte"
                      type="number"
                      label="Cantidad aves DTE"
                      outlined
                      dense
                      class="field-control"
                    />
                  </div>
                </section>

                <section class="form-section">
                  <div class="form-section-heading">
                    <span>4</span>
                    <div>
                      <h3>Cálculos automáticos</h3>
                      <p>Resultados del ingreso de camión.</p>
                    </div>
                  </div>
                  <div class="calculation-panel">
                    <div>
                      <span>Neto origen</span><strong>{{ kg(formMetrics.netoOrigen) }}</strong>
                    </div>
                    <div>
                      <span>Neto planta</span><strong>{{ kg(formMetrics.netoPlanta) }}</strong>
                    </div>
                    <div>
                      <span>Diferencia neta</span
                      ><strong>{{ kg(formMetrics.diferenciaNeta) }}</strong>
                    </div>
                    <div>
                      <span>Peso promedio</span><strong>{{ avg(formMetrics.promedio) }}</strong>
                    </div>
                  </div>
                </section>
              </q-step>

              <q-step v-if="form.id" :name="2" title="Datos de línea" icon="factory">
                <section class="form-section">
                  <div class="form-section-heading">
                    <span>1</span>
                    <div>
                      <h3>Horario de línea</h3>
                      <p>Datos informados a balanza por producción.</p>
                    </div>
                  </div>
                  <div class="form-grid form-grid--dialog">
                    <q-input
                      v-model="form.fechaEntrada"
                      label="Fecha inicio"
                      outlined
                      dense
                      readonly
                      class="field-control"
                      ><template #append>
                        <CalendarDays :size="18" />
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="form.fechaEntrada" mask="YYYY-MM-DD">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup flat label="OK" color="primary" />
                            </div>
                          </q-date>
                        </q-popup-proxy> </template
                    ></q-input>
                    <q-input
                      v-model="form.inicio"
                      type="time"
                      label="Hora inicio"
                      outlined
                      dense
                      class="field-control"
                    />
                    <q-input
                      v-model="form.fechaSalida"
                      label="Fecha finalizó"
                      outlined
                      dense
                      readonly
                      class="field-control"
                      ><template #append>
                        <CalendarDays :size="18" />
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="form.fechaSalida" mask="YYYY-MM-DD">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup flat label="OK" color="primary" />
                            </div>
                          </q-date>
                        </q-popup-proxy> </template
                    ></q-input>
                    <q-input
                      v-model="form.fin"
                      type="time"
                      label="Hora finalizó"
                      outlined
                      dense
                      class="field-control"
                    />
                  </div>
                </section>

                <section class="form-section">
                  <div class="form-section-heading">
                    <span>2</span>
                    <div>
                      <h3>Novedades de producción</h3>
                      <p>Incidencias y observaciones recibidas.</p>
                    </div>
                  </div>
                  <div class="form-grid form-grid--dialog">
                    <q-input
                      v-model.number="form.muertos"
                      type="number"
                      label="Muertos"
                      outlined
                      dense
                      class="field-control"
                    />
                    <q-input
                      v-model.number="form.decomisos"
                      type="number"
                      label="Decomisos"
                      outlined
                      dense
                      class="field-control"
                    />
                    <q-input
                      v-model.number="form.decomisosVisc"
                      type="number"
                      label="Vísceras"
                      outlined
                      dense
                      class="field-control"
                    />
                    <q-input
                      v-model.number="form.vacias"
                      type="number"
                      label="Vacías"
                      outlined
                      dense
                      class="field-control"
                    />
                  </div>
                </section>

                <section class="form-section">
                  <div class="form-section-heading">
                    <span>3</span>
                    <div>
                      <h3>Cálculos automáticos</h3>
                      <p>Resultados de línea e incidencias.</p>
                    </div>
                  </div>
                  <div class="calculation-panel calculation-panel--line">
                    <div>
                      <span>Kg muertos</span><strong>{{ kg(formMetrics.kgMuertos) }}</strong>
                    </div>
                    <div>
                      <span>Kg decom.</span><strong>{{ kg(formMetrics.kgDecomisados) }}</strong>
                    </div>
                    <div>
                      <span>% merma</span><strong>{{ pct(formMetrics.porcentajeMerma) }}</strong>
                    </div>
                    <div>
                      <span>% muertos</span
                      ><strong>{{ pct(formMetrics.porcentajeMuertos) }}</strong>
                    </div>
                    <div>
                      <span>% decom.</span
                      ><strong>{{ pct(formMetrics.porcentajeDecomisados) }}</strong>
                    </div>
                  </div>
                </section>
              </q-step>
            </q-stepper>
          </div>

          <footer class="dialog-footer">
            <button class="secondary-action" type="button" @click="closeForm">Cancelar</button>
            <button
              v-if="formMode === 'form' && form.id"
              class="secondary-action"
              type="button"
              @click="formMode = 'diagram'"
            >
              Volver al diagrama
            </button>
            <button
              v-if="formMode === 'form' && formStep === 2"
              class="secondary-action"
              type="button"
              @click="formStep = 1"
            >
              Volver al paso 1
            </button>
            <button
              v-if="formMode === 'form' && formStep === 1 && form.id"
              class="secondary-action"
              type="submit"
              :disabled="!isStep1Complete"
            >
              Guardar paso 1
            </button>
            <button
              v-if="formMode === 'form' && formStep === 1 && form.id"
              class="primary-action"
              type="button"
              :disabled="!isStep1Complete"
              @click="formStep = 2"
            >
              Ir al paso 2
            </button>
            <button
              v-else-if="formMode === 'form' && formStep === 1"
              class="primary-action"
              type="submit"
              :disabled="!isStep1Complete"
            >
              <Save :size="19" /> Crear camión
            </button>
            <button v-else-if="formMode === 'form'" class="primary-action" type="submit">
              <Save :size="19" /> Guardar datos de línea
            </button>
          </footer>
        </q-form>
      </q-card>
    </q-dialog>

    <div v-if="feedback" class="feedback-toast">
      <CheckCircle2 :size="19" /><span>{{ feedback }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  calculateNet,
  calculateTruckMetrics,
  formatAverageKg,
  formatKg,
  formatPercent,
} from '@/utils/truckCalculations'

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Factory,
  Pencil,
  Plus,
  Save,
  Truck,
  X,
} from '@lucide/vue'

const storageKey = 'mark-frigorifico-operacion-v2'

const trucks = ref(loadTrucks())
const selectedTruckId = ref(trucks.value[0]?.id)
const formDialog = ref(false)
const detailDialog = ref(false)
const detailTruckId = ref(null)
const feedback = ref('')
const formMode = ref('form')
const formStep = ref(1)

const emptyForm = () => ({
  id: null,
  client: '',
  dte: '',
  remito: '',
  chasis: '',
  acoplado: '',
  fechaEntrada: new Date().toISOString().slice(0, 10),
  fechaSalida: new Date().toISOString().slice(0, 10),
  horarioLlegada: '',
  brutoOrigen: 0,
  taraOrigen: 0,
  brutoPlanta: 0,
  taraPlanta: 0,
  avesOrigen: 0,
  avesDte: 0,
  vacias: 0,
  inicio: '',
  fin: '',
  muertos: 0,
  decomisos: 0,
  decomisosVisc: 0,
  codigoSn: 'SN-001',
  loteSenasa: julianLot(),
  date: new Date().toISOString(),
  sapCreated: false,
})

const form = reactive(emptyForm())
const formMetrics = computed(() => calculateTruckMetrics(form))

const isStep1Complete = computed(
  () =>
    Boolean(form.client?.trim()) &&
    Boolean(form.dte?.trim()) &&
    Boolean(form.chasis?.trim()) &&
    (Number(form.avesOrigen || 0) > 0 || Number(form.avesDte || 0) > 0) &&
    (calcNeto(form.brutoOrigen, form.taraOrigen) > 0 ||
      calcNeto(form.brutoPlanta, form.taraPlanta) > 0),
)

const columns = [
  { name: 'client', label: 'Cliente', field: 'client', align: 'left', sortable: true },
  { name: 'patentes', label: 'Patentes', field: 'chasis', align: 'left' },
  { name: 'date', label: 'Fecha', field: (row) => truckDate(row), align: 'left' },
]

const detailTruck = computed(() => trucks.value.find((truck) => truck.id === detailTruckId.value))
watch(
  trucks,
  (nextTrucks) => {
    localStorage.setItem(storageKey, JSON.stringify(nextTrucks))
  },
  { deep: true },
)

function loadTrucks() {
  const stored = localStorage.getItem(storageKey)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed)
      ? parsed.map((truck) => {
          const cleanedTruck = { ...truck }
          delete cleanedTruck.operator
          return cleanedTruck
        })
      : []
  } catch {
    return []
  }
}

function saveTruck() {
  if (formStep.value === 1 && !isStep1Complete.value) {
    showFeedback('Completa el paso 1 antes de guardar')
    return
  }

  const payload = {
    ...form,
    avesOrigen: Number(form.avesOrigen || form.avesDte || 0),
    id: form.id || createId(),
    date: form.fechaEntrada
      ? new Date(`${form.fechaEntrada}T00:00:00`).toISOString()
      : form.date || new Date().toISOString(),
    lineConfirmedAt: formStep.value === 2 ? new Date().toISOString() : form.lineConfirmedAt || null,
  }
  delete payload.operator
  const index = trucks.value.findIndex((truck) => truck.id === payload.id)

  if (index >= 0) trucks.value[index] = payload
  else trucks.value.unshift(payload)

  selectedTruckId.value = payload.id
  detailTruckId.value = payload.id
  formDialog.value = false
  showFeedback(form.id ? 'Cambios guardados correctamente' : 'Paso 1 registrado correctamente')
  clearForm()
}

function newTruck() {
  clearForm()
  formMode.value = 'form'
  formStep.value = 1
  formDialog.value = true
}

function editTruck(truck) {
  Object.assign(form, {
    ...truck,
    fechaSalida: truck.fechaSalida || new Date().toISOString().slice(0, 10),
  })
  detailDialog.value = false
  formMode.value = 'diagram'
  formStep.value = 1
  formDialog.value = true
}

function openFormStep(step) {
  if (step === 2 && !isStep1Complete.value) return
  formStep.value = step
  formMode.value = 'form'
}

function clearForm() {
  Object.assign(form, emptyForm())
}

function closeForm() {
  formDialog.value = false
  clearForm()
}

function calcNeto(bruto, tara) {
  return calculateNet(bruto, tara)
}

function kg(value) {
  return formatKg(value)
}

function avg(value) {
  return formatAverageKg(value)
}

function pct(value) {
  return formatPercent(value)
}

function metricsFor(truck) {
  return calculateTruckMetrics(truck)
}

function julianLot() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return `${now.getFullYear()}-${Math.floor((now - start) / 86400000)
    .toString()
    .padStart(3, '0')}`
}

function openTruckAction(truck) {
  editTruck(truck)
}

function truckDate(truck) {
  const value = truck?.fechaEntrada
    ? `${truck.fechaEntrada}T00:00:00`
    : truck?.date || truck?.createdAt || new Date().toISOString()
  return new Date(value).toLocaleDateString('es-AR')
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function showFeedback(message) {
  feedback.value = message
  window.setTimeout(() => {
    feedback.value = ''
  }, 2800)
}
</script>
