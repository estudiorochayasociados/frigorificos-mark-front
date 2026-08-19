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
          class="production-table gt-sm"
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
          <template #body-cell-status="props">
            <q-td :props="props"
              ><span :class="['status-pill', statusClass(props.row.status)]">{{
                props.row.status
              }}</span></q-td
            >
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
              <span :class="['status-pill', statusClass(truck.status)]">{{ truck.status }}</span>
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
              <span>Ver detalle</span>
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
          <div class="detail-main-row">
            <div>
              <span>Patentes</span>
              <strong>{{ detailTruck.chasis }} / {{ detailTruck.acoplado || '-' }}</strong>
            </div>
            <div>
              <span>Fecha</span>
              <strong>{{ truckDate(detailTruck) }}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong
                ><span :class="['status-pill', statusClass(detailTruck.status)]">{{
                  detailTruck.status
                }}</span></strong
              >
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span>DTE</span><strong>{{ detailTruck.dte || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>Remito</span><strong>{{ detailTruck.remito || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>Neto origen</span
              ><strong>{{ kg(calcNeto(detailTruck.brutoOrigen, detailTruck.taraOrigen)) }}</strong>
            </div>
            <div class="detail-item">
              <span>Neto planta</span
              ><strong>{{ kg(calcNeto(detailTruck.brutoPlanta, detailTruck.taraPlanta)) }}</strong>
            </div>
            <div class="detail-item">
              <span>Aves</span
              ><strong>{{ Number(detailTruck.avesOrigen || 0).toLocaleString('es-AR') }}</strong>
            </div>
            <div class="detail-item">
              <span>Promedio</span
              ><strong>{{
                avg(
                  calcNeto(detailTruck.brutoPlanta, detailTruck.taraPlanta),
                  detailTruck.avesOrigen,
                )
              }}</strong>
            </div>
            <div class="detail-item">
              <span>Muertos</span><strong>{{ detailTruck.muertos || 0 }}</strong>
            </div>
            <div class="detail-item">
              <span>Decomisos</span><strong>{{ detailTruck.decomisos || 0 }}</strong>
            </div>
            <div class="detail-item">
              <span>Horario</span
              ><strong
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
            <section class="form-section">
              <div class="form-section-heading">
                <span>1</span>
                <div>
                  <h3>Identificación</h3>
                  <p>Datos del DTE, remito y vehiculo.</p>
                </div>
              </div>
              <div class="form-grid form-grid--dialog">
                <q-input
                  v-model="form.client"
                  label="Cliente / Granja *"
                  outlined
                  dense
                  class="field-control"
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
                  label="Hora inicio"
                  outlined
                  dense
                  readonly
                  class="field-control"
                  ><template #append>
                    <Clock3 :size="18" />
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="form.inicio" format24h>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup flat label="OK" color="primary" />
                        </div>
                      </q-time>
                    </q-popup-proxy> </template></q-input
                ><q-input
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
                  label="Hora finalizó"
                  outlined
                  dense
                  readonly
                  class="field-control"
                  ><template #append>
                    <Clock3 :size="18" />
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="form.fin" format24h>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup flat label="OK" color="primary" />
                        </div>
                      </q-time>
                    </q-popup-proxy> </template
                ></q-input>
              </div>
            </section>

            <section class="form-section">
              <div class="form-section-heading">
                <span>2</span>
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
                  <div class="calculated-line">
                    <span>Neto origen</span
                    ><strong>{{ kg(calcNeto(form.brutoOrigen, form.taraOrigen)) }}</strong>
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
                  <div class="calculated-line">
                    <span>Neto planta</span
                    ><strong>{{ kg(calcNeto(form.brutoPlanta, form.taraPlanta)) }}</strong>
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
              <div class="calculation-strip">
                <div>
                  <span>Diferencia neta</span><strong>{{ kg(calcMerma(form)) }}</strong>
                </div>
                <div>
                  <span>Peso promedio</span
                  ><strong>{{
                    avg(calcNeto(form.brutoPlanta, form.taraPlanta), form.avesOrigen)
                  }}</strong>
                </div>
              </div>
            </section>
          </div>

          <footer class="dialog-footer">
            <button class="secondary-action" type="button" @click="closeForm">Cancelar</button>
            <button class="primary-action" type="submit">
              <Save :size="19" /> {{ form.id ? 'Guardar cambios' : 'Registrar camion' }}
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
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
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

const emptyForm = () => ({
  id: null,
  client: '',
  dte: '',
  remito: '',
  chasis: '',
  acoplado: '',
  fechaEntrada: new Date().toISOString().slice(0, 10),
  fechaSalida: '',
  brutoOrigen: 0,
  taraOrigen: 0,
  brutoPlanta: 0,
  taraPlanta: 0,
  avesOrigen: 0,
  avesDte: 0,
  inicio: '',
  fin: '',
  muertos: 0,
  decomisos: 0,
  decomisosVisc: 0,
  codigoSn: 'SN-001',
  loteSenasa: julianLot(),
  date: new Date().toISOString(),
  status: 'Pendiente',
  note: '',
  sapCreated: false,
})

const form = reactive(emptyForm())

const columns = [
  { name: 'client', label: 'Cliente', field: 'client', align: 'left', sortable: true },
  { name: 'patentes', label: 'Patentes', field: 'chasis', align: 'left' },
  { name: 'date', label: 'Fecha', field: (row) => truckDate(row), align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
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
  const payload = {
    ...form,
    id: form.id || createId(),
    date: form.fechaEntrada
      ? new Date(`${form.fechaEntrada}T00:00:00`).toISOString()
      : form.date || new Date().toISOString(),
  }
  delete payload.operator
  const index = trucks.value.findIndex((truck) => truck.id === payload.id)

  if (index >= 0) trucks.value[index] = payload
  else trucks.value.unshift(payload)

  selectedTruckId.value = payload.id
  detailTruckId.value = payload.id
  formDialog.value = false
  showFeedback(form.id ? 'Cambios guardados correctamente' : 'Camion registrado correctamente')
  clearForm()
}

function newTruck() {
  clearForm()
  formDialog.value = true
}

function editTruck(truck) {
  Object.assign(form, truck)
  detailDialog.value = false
  formDialog.value = true
}

function clearForm() {
  Object.assign(form, emptyForm())
}

function closeForm() {
  formDialog.value = false
  clearForm()
}

function calcNeto(bruto, tara) {
  return Number(bruto || 0) - Number(tara || 0)
}

function calcMerma(truck) {
  return (
    calcNeto(truck.brutoOrigen, truck.taraOrigen) - calcNeto(truck.brutoPlanta, truck.taraPlanta)
  )
}

function kg(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('es-AR')} kg`
}

function avg(neto, aves) {
  if (!Number(aves)) return '0,000 kg'
  return `${(Number(neto || 0) / Number(aves)).toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`
}

function julianLot() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return `${now.getFullYear()}-${Math.floor((now - start) / 86400000)
    .toString()
    .padStart(3, '0')}`
}

function statusClass(status) {
  if (status === 'SAP creado' || status === 'Finalizado') return 'status-success'
  if (status === 'ESTIMADO') return 'status-warning'
  if (status === 'En linea' || status === 'En descarga') return 'status-active'
  return 'status-neutral'
}

function openTruckDetail(truck) {
  detailTruckId.value = truck.id
  detailDialog.value = true
}

function openTruckAction(truck) {
  openTruckDetail(truck)
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
