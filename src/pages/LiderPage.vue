<template>
  <q-page class="page-shell">
    <div class="page-content">
      <header class="page-header">
        <div>
          <h1>Lider de linea</h1>
          <p>Informa tiempos e incidencias de la linea de forma rapida.</p>
        </div>
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
              <span>Informar novedad</span>
              <button type="button">Abrir <ChevronRight :size="16" /></button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <q-dialog v-model="leaderDialog" :maximized="$q.screen.lt.sm">
      <q-card class="leader-dialog" v-if="selectedTruck">
        <header class="dialog-header">
          <div class="dialog-title-wrap">
            <span class="dialog-icon"><Radio :size="22" /></span>
            <div class="dialog-heading">
              <h2 class="dialog-title">Informar novedad</h2>
              <span class="dialog-subtitle"
                >{{ selectedTruck.client }} - {{ selectedTruck.chasis }}</span
              >
            </div>
          </div>
          <button class="icon-action" type="button" @click="leaderDialog = false">
            <X :size="20" />
          </button>
        </header>

        <div class="leader-dialog-body">
          <div class="leader-dialog-grid">
            <q-input
              v-model.number="leaderForm.muertos"
              type="number"
              label="Muertos"
              outlined
              dense
              class="field-control"
            />
            <q-input
              v-model.number="leaderForm.decomisos"
              type="number"
              label="Decomisos"
              outlined
              dense
              class="field-control"
            />
            <q-input
              v-model.number="leaderForm.decomisosVisc"
              type="number"
              label="Vísceras"
              outlined
              dense
              class="field-control"
            />
            <q-input
              v-model="leaderForm.fechaEntrada"
              label="Fecha inicio"
              outlined
              dense
              readonly
              class="field-control cursor-pointer"
            >
              <template #append>
                <CalendarDays :size="18" />
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="leaderForm.fechaEntrada" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup flat label="OK" color="primary" />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </template>
            </q-input>
            <q-input
              v-model="leaderForm.inicio"
              label="Hora inicio"
              outlined
              dense
              readonly
              class="field-control"
              ><template #append>
                <Clock3 :size="18" />
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="leaderForm.inicio" format24h>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup flat label="OK" color="primary" />
                    </div>
                  </q-time>
                </q-popup-proxy> </template
            ></q-input>
            <q-input
              v-model="leaderForm.fechaSalida"
              label="Fecha finalizó"
              outlined
              dense
              readonly
              class="field-control cursor-pointer"
            >
              <template #append>
                <CalendarDays :size="18" />
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="leaderForm.fechaSalida" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup flat label="OK" color="primary" />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </template>
            </q-input>
            <q-input
              v-model="leaderForm.fin"
              label="Hora finalizó"
              outlined
              dense
              readonly
              class="field-control"
              ><template #append>
                <Clock3 :size="18" />
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="leaderForm.fin" format24h>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup flat label="OK" color="primary" />
                    </div>
                  </q-time>
                </q-popup-proxy> </template
            ></q-input>
            <q-select
              v-model="leaderForm.status"
              :options="statusOptions"
              label="Estado"
              outlined
              dense
              class="field-control"
            />
            <q-input
              v-model="leaderForm.note"
              label="Nota opcional"
              outlined
              dense
              class="field-control leader-dialog-note"
            />
          </div>
        </div>

        <footer class="dialog-footer">
          <button class="secondary-action" type="button" @click="leaderDialog = false">
            Cancelar
          </button>
          <button class="primary-action" type="button" @click="saveLeaderUpdate">
            <Send :size="17" /> Informar a balanza
          </button>
        </footer>
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
  Radio,
  Send,
  Truck,
  X,
} from '@lucide/vue'

const storageKey = 'mark-frigorifico-operacion-v2'

const statusOptions = ['Pendiente', 'En descarga', 'En linea', 'Finalizado', 'SAP creado']

const trucks = ref(loadTrucks())
const selectedTruckId = ref(trucks.value[0]?.id)
const leaderDialog = ref(false)
const feedback = ref('')

const leaderForm = reactive({
  muertos: 0,
  decomisos: 0,
  decomisosVisc: 0,
  fechaEntrada: new Date().toISOString().slice(0, 10),
  fechaSalida: '',
  inicio: '',
  fin: '',
  status: 'En linea',
  note: '',
})

const columns = [
  { name: 'client', label: 'Cliente', field: 'client', align: 'left', sortable: true },
  { name: 'patentes', label: 'Patentes', field: 'chasis', align: 'left' },
  { name: 'date', label: 'Fecha', field: (row) => truckDate(row), align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
]

const selectedTruck = computed(() =>
  trucks.value.find((truck) => truck.id === selectedTruckId.value),
)
watch(
  trucks,
  (nextTrucks) => {
    localStorage.setItem(storageKey, JSON.stringify(nextTrucks))
  },
  { deep: true },
)

watch(selectedTruck, (truck) => {
  if (!truck) return
  Object.assign(leaderForm, {
    muertos: truck.muertos,
    decomisos: truck.decomisos,
    decomisosVisc: truck.decomisosVisc,
    fechaEntrada:
      truck.fechaEntrada || truck.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    fechaSalida: truck.fechaSalida || '',
    inicio: truck.inicio,
    fin: truck.fin,
    status: truck.status,
    note: truck.note,
  })
})

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

function saveLeaderUpdate() {
  const truck = selectedTruck.value
  if (!truck) return

  Object.assign(truck, leaderForm)
  leaderDialog.value = false
  showFeedback('Novedad informada a balanza')
}

function statusClass(status) {
  if (status === 'SAP creado' || status === 'Finalizado') return 'status-success'
  if (status === 'ESTIMADO') return 'status-warning'
  if (status === 'En linea' || status === 'En descarga') return 'status-active'
  return 'status-neutral'
}

function openTruckAction(truck) {
  selectedTruckId.value = truck.id
  leaderDialog.value = true
}

function truckDate(truck) {
  const value = truck?.fechaEntrada
    ? `${truck.fechaEntrada}T00:00:00`
    : truck?.date || truck?.createdAt || new Date().toISOString()
  return new Date(value).toLocaleDateString('es-AR')
}

function showFeedback(message) {
  feedback.value = message
  window.setTimeout(() => {
    feedback.value = ''
  }, 2800)
}
</script>
