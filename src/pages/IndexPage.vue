<template>
  <q-page class="page-shell">
    <div class="page-content">
      <header class="page-header">
        <div>
          <div class="eyebrow"><span class="live-dot"></span> TURNO EN CURSO</div>
          <h1>{{ view === 'sap' ? 'Entrada DTE / Remito' : 'Operacion de hoy' }}</h1>
          <p>
            {{
              view === 'sap'
                ? 'Revisa los datos del camion antes de generar la operacion.'
                : role === 'balanza'
                  ? 'Registra ingresos, pesos y documentacion de cada camion.'
                  : 'Informa tiempos e incidencias de la linea de forma rapida.'
            }}
          </p>
        </div>
        <button
          v-if="view === 'tablero' && role === 'balanza'"
          class="primary-action"
          type="button"
          @click="newTruck"
        >
          <Plus :size="20" />
          Nuevo camion
        </button>
        <button
          v-else-if="view === 'tablero'"
          class="primary-action"
          type="button"
          @click="focusLeaderPanel"
        >
          <Radio :size="20" />
          Cargar novedad
        </button>
        <button v-else class="secondary-action" type="button" @click="resetDemo">
          <RotateCcw :size="18" />
          Reiniciar demo
        </button>
      </header>

      <section class="stats-grid" aria-label="Resumen del turno">
        <article v-for="stat in stats" :key="stat.label" class="stat-card">
          <span class="stat-icon"><component :is="stat.icon" :size="21" /></span>
          <div class="stat-copy">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.caption }}</small>
          </div>
        </article>
      </section>

      <template v-if="view === 'tablero'">
        <section v-if="role === 'lider'" ref="leaderPanel" class="leader-panel">
          <div class="section-heading">
            <div class="section-heading-icon"><Radio :size="22" /></div>
            <div>
              <h2>Carga rapida de linea</h2>
              <p>Selecciona el camion e informa solo los datos recibidos.</p>
            </div>
          </div>

          <div class="leader-grid">
            <q-select
              v-model="selectedTruckId"
              :options="truckOptions"
              label="Camion activo"
              emit-value
              map-options
              outlined
              class="field-control leader-truck"
            />
            <q-input
              v-model.number="leaderForm.muertos"
              type="number"
              label="Muertos"
              outlined
              class="field-control"
            />
            <q-input
              v-model.number="leaderForm.decomisos"
              type="number"
              label="Decomisos"
              outlined
              class="field-control"
            />
            <q-input
              v-model.number="leaderForm.decomisosVisc"
              type="number"
              label="Visceras"
              outlined
              class="field-control"
            />
            <q-input
              v-model="leaderForm.inicio"
              label="Inicio"
              mask="time"
              outlined
              class="field-control"
            />
            <q-input
              v-model="leaderForm.fin"
              label="Finalizo"
              mask="time"
              outlined
              class="field-control"
            />
            <q-select
              v-model="leaderForm.status"
              :options="statusOptions"
              label="Estado"
              outlined
              class="field-control"
            />
            <q-input
              v-model="leaderForm.note"
              label="Nota opcional"
              outlined
              class="field-control leader-note"
            />
            <button class="primary-action leader-submit" type="button" @click="saveLeaderUpdate">
              <Send :size="19" />
              Informar a balanza
            </button>
          </div>
        </section>

        <section class="data-card">
          <div class="data-card-header">
            <div>
              <div class="title-row">
                <h2>Camiones del turno</h2>
                <span class="count-badge">{{ trucks.length }}</span>
              </div>
              <p>Los calculos se actualizan automaticamente.</p>
            </div>
            <button class="icon-action" type="button" title="Reiniciar datos" @click="resetDemo">
              <RotateCcw :size="18" />
            </button>
          </div>

          <q-table
            flat
            row-key="id"
            :rows="trucks"
            :columns="columns"
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            class="production-table gt-sm"
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
            <template #body-cell-status="props">
              <q-td :props="props"
                ><span :class="['status-pill', statusClass(props.row.status)]">{{
                  props.row.status
                }}</span></q-td
              >
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <template v-if="role === 'balanza'">
                  <button
                    class="table-action"
                    type="button"
                    title="Editar"
                    @click="editTruck(props.row)"
                  >
                    <Pencil :size="17" />
                  </button>
                  <button
                    class="table-action table-action--danger"
                    type="button"
                    title="Eliminar"
                    @click="removeTruck(props.row.id)"
                  >
                    <Trash2 :size="17" />
                  </button>
                </template>
                <button
                  v-else
                  class="row-text-action"
                  type="button"
                  @click="selectLeaderTruck(props.row.id)"
                >
                  Informar <ChevronRight :size="15" />
                </button>
              </q-td>
            </template>
          </q-table>

          <div class="truck-list lt-md">
            <article
              v-for="truck in trucks"
              :key="truck.id"
              class="truck-card"
              @click="role === 'balanza' ? editTruck(truck) : selectLeaderTruck(truck.id)"
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
                  <span>Neto planta</span
                  ><strong>{{ kg(calcNeto(truck.brutoPlanta, truck.taraPlanta)) }}</strong>
                </div>
                <div>
                  <span>Aves</span
                  ><strong>{{ Number(truck.avesOrigen).toLocaleString('es-AR') }}</strong>
                </div>
                <div>
                  <span>Horario</span
                  ><strong>{{ truck.inicio || '--:--' }} - {{ truck.fin || '--:--' }}</strong>
                </div>
              </div>
              <div class="truck-card-footer">
                <span
                  ><AlertTriangle :size="15" />
                  {{ Number(truck.muertos) + Number(truck.decomisos) }} incidencias</span
                >
                <button v-if="role === 'balanza'" type="button">
                  Editar <ChevronRight :size="16" />
                </button>
              </div>
            </article>
          </div>
        </section>
      </template>

      <section v-else class="sap-layout">
        <div class="sap-main data-card">
          <div class="data-card-header">
            <div>
              <h2>Datos de la operacion</h2>
              <p>Campos obtenidos de la planilla de balanza.</p>
            </div>
            <span v-if="sapTruck?.sapCreated" class="status-pill status-success"
              ><CheckCircle2 :size="15" /> SAP creado</span
            >
          </div>
          <div class="sap-select-wrap">
            <label>Selecciona un camion</label>
            <q-select
              v-model="sapTruckId"
              :options="truckOptions"
              emit-value
              map-options
              outlined
              class="field-control"
            />
          </div>
          <div v-if="sapTruck" class="sap-grid">
            <div v-for="field in sapFields" :key="field.label" class="sap-field">
              <span>{{ field.label }}</span
              ><strong>{{ field.value }}</strong>
            </div>
          </div>
        </div>
        <aside class="sap-summary">
          <div class="sap-summary-icon"><FileCheck2 :size="28" /></div>
          <h2>Confirmar operacion</h2>
          <p>Verifica DTE, remito, patentes y pesos antes de continuar.</p>
          <div class="check-list">
            <span><Check :size="17" /> Datos de origen</span>
            <span><Check :size="17" /> Pesaje en planta</span>
            <span><Check :size="17" /> Lote SENASA</span>
          </div>
          <button
            class="primary-action full-width"
            type="button"
            :disabled="sapTruck?.sapCreated"
            @click="markSapCreated"
          >
            <CheckCircle2 :size="19" />
            {{ sapTruck?.sapCreated ? 'Operacion creada' : 'Crear operacion SAP' }}
          </button>
        </aside>
      </section>
    </div>

    <q-dialog v-model="formDialog" :maximized="$q.screen.lt.sm" persistent>
      <q-card class="truck-dialog">
        <q-form @submit.prevent="saveTruck">
          <header class="dialog-header">
            <div class="dialog-title-wrap">
              <span class="dialog-icon"><Truck :size="23" /></span>
              <div>
                <span>{{ form.id ? 'EDITAR REGISTRO' : 'NUEVO INGRESO' }}</span>
                <h2>{{ form.id ? form.client : 'Registrar camion' }}</h2>
              </div>
            </div>
            <button class="icon-action" type="button" @click="closeForm"><X :size="20" /></button>
          </header>

          <div class="dialog-body">
            <section class="form-section">
              <div class="form-section-heading">
                <span>1</span>
                <div>
                  <h3>Identificacion</h3>
                  <p>Datos del DTE, remito y vehiculo.</p>
                </div>
              </div>
              <div class="form-grid">
                <q-input
                  v-model="form.client"
                  label="Cliente / Granja *"
                  outlined
                  class="field-control field-wide"
                  :rules="[(value) => !!value || 'Campo obligatorio']"
                />
                <q-input
                  v-model="form.dte"
                  label="Numero DTE *"
                  outlined
                  class="field-control"
                  :rules="[(value) => !!value || 'Campo obligatorio']"
                />
                <q-input v-model="form.remito" label="Remito" outlined class="field-control" />
                <q-input
                  v-model="form.chasis"
                  label="Patente chasis *"
                  outlined
                  class="field-control uppercase-field"
                  :rules="[(value) => !!value || 'Campo obligatorio']"
                />
                <q-input
                  v-model="form.acoplado"
                  label="Patente acoplado"
                  outlined
                  class="field-control uppercase-field"
                />
                <q-input v-model="form.operator" label="Operador" outlined class="field-control" />
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
                  <div class="form-grid form-grid--two">
                    <q-input
                      v-model.number="form.brutoOrigen"
                      type="number"
                      label="Peso bruto"
                      suffix="kg"
                      outlined
                      class="field-control"
                    /><q-input
                      v-model.number="form.taraOrigen"
                      type="number"
                      label="Tara"
                      suffix="kg"
                      outlined
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
                  <div class="form-grid form-grid--two">
                    <q-input
                      v-model.number="form.brutoPlanta"
                      type="number"
                      label="Peso bruto"
                      suffix="kg"
                      outlined
                      class="field-control"
                    /><q-input
                      v-model.number="form.taraPlanta"
                      type="number"
                      label="Tara"
                      suffix="kg"
                      outlined
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
                  class="field-control"
                /><q-input
                  v-model.number="form.avesDte"
                  type="number"
                  label="Cantidad aves DTE"
                  outlined
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

            <section class="form-section">
              <div class="form-section-heading">
                <span>3</span>
                <div>
                  <h3>Produccion y trazabilidad</h3>
                  <p>Horarios, incidencias y lote.</p>
                </div>
              </div>
              <div class="form-grid form-grid--two">
                <q-input
                  v-model="form.inicio"
                  label="Hora de inicio"
                  mask="time"
                  outlined
                  class="field-control"
                  ><template #append><Clock3 :size="18" /></template></q-input
                ><q-input
                  v-model="form.fin"
                  label="Hora de finalizacion"
                  mask="time"
                  outlined
                  class="field-control"
                  ><template #append><Clock3 :size="18" /></template
                ></q-input>
              </div>
              <div class="incident-grid">
                <q-input
                  v-model.number="form.muertos"
                  type="number"
                  label="Muertos"
                  outlined
                  class="field-control"
                /><q-input
                  v-model.number="form.decomisos"
                  type="number"
                  label="Decomisos"
                  outlined
                  class="field-control"
                /><q-input
                  v-model.number="form.decomisosVisc"
                  type="number"
                  label="Decom. visceras"
                  outlined
                  class="field-control"
                />
              </div>
              <div class="form-grid form-grid--two">
                <q-input
                  v-model="form.codigoSn"
                  label="Codigo S/N"
                  outlined
                  class="field-control"
                /><q-input
                  v-model="form.loteSenasa"
                  label="Lote SENASA"
                  outlined
                  class="field-control"
                />
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
import { useRoute, useRouter } from 'vue-router'
import {
  AlertTriangle,
  Bird,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Gauge,
  Pencil,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Scale,
  Send,
  Trash2,
  Truck,
  X,
} from '@lucide/vue'

const storageKey = 'mark-frigorifico-demo-v1'
const route = useRoute()
const router = useRouter()

const seedTrucks = [
  truckSeed(
    'TROZADO',
    'AA 671 PH',
    'AA 405 UG',
    26980,
    16360,
    26860,
    16360,
    4606,
    '05:45',
    '06:20',
    13,
    14,
    6,
  ),
  truckSeed(
    'TROZADO',
    'BMO 426',
    'ACF 277',
    27160,
    17960,
    27020,
    17960,
    3792,
    '06:20',
    '06:50',
    9,
    18,
    3,
  ),
  truckSeed(
    'TROZADO',
    'KHN 151',
    'TNI 850',
    26620,
    15740,
    26460,
    15740,
    4410,
    '06:50',
    '07:24',
    21,
    14,
    1,
  ),
  truckSeed('MEGA', 'NFA 630', 'AF 359 RO', 34560, 18780, 33060, 0, 4914, '07:24', '', 0, 0, 0),
  truckSeed('ROSARIO', 'PDG 041', 'HRH 841', 28380, 16860, 28180, 0, 3976, '', '', 0, 0, 0),
  truckSeed(
    'DON DOMINGO',
    'SSK 549',
    'RNR 852',
    26380,
    15560,
    26380,
    0,
    4165,
    '',
    '',
    0,
    0,
    0,
    'ESTIMADO',
  ),
]

const statusOptions = ['Pendiente', 'En descarga', 'En linea', 'Finalizado', 'SAP creado']

const trucks = ref(loadTrucks())
const selectedTruckId = ref(trucks.value[0]?.id)
const sapTruckId = ref(trucks.value[0]?.id)
const formDialog = ref(false)
const feedback = ref('')
const leaderPanel = ref(null)
const view = computed({
  get: () => (route.query.view === 'sap' ? 'sap' : 'tablero'),
  set: (nextView) => router.push({ path: '/', query: { ...route.query, view: nextView } }),
})
const role = computed({
  get: () => (route.query.role === 'lider' ? 'lider' : 'balanza'),
  set: (nextRole) => router.push({ path: '/', query: { ...route.query, role: nextRole } }),
})

const emptyForm = () => ({
  id: null,
  operator: 'Operador demo',
  client: '',
  dte: '',
  remito: '',
  chasis: '',
  acoplado: '',
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
  status: 'Pendiente',
  note: '',
  sapCreated: false,
})

const form = reactive(emptyForm())
const leaderForm = reactive({
  muertos: 0,
  decomisos: 0,
  decomisosVisc: 0,
  inicio: '',
  fin: '',
  status: 'En linea',
  note: '',
})

const columns = [
  { name: 'client', label: 'Cliente', field: 'client', align: 'left', sortable: true },
  { name: 'chasis', label: 'Pat. Chasis', field: 'chasis', align: 'left' },
  { name: 'acoplado', label: 'Acoplado', field: 'acoplado', align: 'left' },
  {
    name: 'netoOrigen',
    label: 'Neto origen',
    field: (row) => kg(calcNeto(row.brutoOrigen, row.taraOrigen)),
    align: 'right',
  },
  {
    name: 'netoPlanta',
    label: 'Neto planta',
    field: (row) => kg(calcNeto(row.brutoPlanta, row.taraPlanta)),
    align: 'right',
  },
  { name: 'dif', label: 'Dif. neta', field: (row) => kg(calcMerma(row)), align: 'right' },
  { name: 'aves', label: 'Aves', field: 'avesOrigen', align: 'right' },
  {
    name: 'promedio',
    label: 'Promedio',
    field: (row) => avg(calcNeto(row.brutoPlanta, row.taraPlanta), row.avesOrigen),
    align: 'right',
  },
  { name: 'muertos', label: 'Muertos', field: 'muertos', align: 'right' },
  { name: 'decomisos', label: 'Decom.', field: 'decomisos', align: 'right' },
  { name: 'inicio', label: 'Comienzo', field: 'inicio', align: 'center' },
  { name: 'fin', label: 'Finalizo', field: 'fin', align: 'center' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const truckOptions = computed(() =>
  trucks.value.map((truck) => ({ label: `${truck.client} - ${truck.chasis}`, value: truck.id })),
)
const selectedTruck = computed(() =>
  trucks.value.find((truck) => truck.id === selectedTruckId.value),
)
const sapTruck = computed(() => trucks.value.find((truck) => truck.id === sapTruckId.value))
const sapFields = computed(() => {
  const truck = sapTruck.value
  if (!truck) return []

  return [
    { label: 'Nro. registro', value: truck.id },
    { label: 'DTE', value: truck.dte },
    { label: 'Remito', value: truck.remito },
    { label: 'Pat. chasis', value: truck.chasis },
    { label: 'Pat. acoplado', value: truck.acoplado },
    { label: 'Bruto origen', value: kg(truck.brutoOrigen) },
    { label: 'Tara origen', value: kg(truck.taraOrigen) },
    { label: 'Bruto planta', value: kg(truck.brutoPlanta) },
    { label: 'Tara planta', value: kg(truck.taraPlanta) },
    { label: 'Cantidad aves origen', value: truck.avesOrigen },
    { label: 'Cantidad aves DTE', value: truck.avesDte },
    { label: 'Fecha ingreso', value: new Date().toLocaleDateString('es-AR') },
    { label: 'Hora ingreso', value: truck.inicio || 'Pendiente' },
    { label: 'Hora egreso', value: truck.fin || 'Pendiente' },
    { label: 'Codigo S/N', value: truck.codigoSn },
    { label: 'Lote SENASA', value: truck.loteSenasa },
    {
      label: 'Peso promedio planta',
      value: avg(calcNeto(truck.brutoPlanta, truck.taraPlanta), truck.avesOrigen),
    },
    { label: 'Bruto faena', value: kg(truck.brutoPlanta) },
    { label: 'Neto faena', value: kg(calcNeto(truck.brutoPlanta, truck.taraPlanta)) },
    { label: 'Diferencia netos faena', value: kg(calcMerma(truck)) },
  ]
})
const stats = computed(() => {
  const totalAves = trucks.value.reduce((sum, truck) => sum + Number(truck.avesOrigen || 0), 0)
  const netoPlanta = trucks.value.reduce(
    (sum, truck) => sum + calcNeto(truck.brutoPlanta, truck.taraPlanta),
    0,
  )
  const merma = trucks.value.reduce((sum, truck) => sum + calcMerma(truck), 0)
  const incidencias = trucks.value.reduce(
    (sum, truck) =>
      sum +
      Number(truck.muertos || 0) +
      Number(truck.decomisos || 0) +
      Number(truck.decomisosVisc || 0),
    0,
  )

  return [
    {
      label: 'Camiones',
      value: trucks.value.length,
      caption: 'registrados hoy',
      icon: Truck,
    },
    {
      label: 'Aves origen',
      value: totalAves.toLocaleString('es-AR'),
      caption: 'informadas por granja',
      icon: Bird,
    },
    {
      label: 'Neto planta',
      value: kg(netoPlanta),
      caption: 'acumulado real',
      icon: Scale,
    },
    {
      label: 'Merma neta',
      value: kg(merma),
      caption: `${percent(merma, netoPlanta + merma)} del origen`,
      icon: Gauge,
    },
    {
      label: 'Incidencias',
      value: incidencias,
      caption: 'muertos + decomisos',
      icon: AlertTriangle,
    },
  ]
})

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
    inicio: truck.inicio,
    fin: truck.fin,
    status: truck.status,
    note: truck.note,
  })
})

function truckSeed(
  client,
  chasis,
  acoplado,
  brutoOrigen,
  taraOrigen,
  brutoPlanta,
  taraPlanta,
  avesOrigen,
  inicio,
  fin,
  muertos,
  decomisos,
  decomisosVisc,
  status = 'En linea',
) {
  const id = crypto.randomUUID()
  return {
    ...emptyTruckBase(id),
    client,
    chasis,
    acoplado,
    dte: `DTE-${id.slice(0, 5).toUpperCase()}`,
    remito: `R-${id.slice(0, 4).toUpperCase()}`,
    brutoOrigen,
    taraOrigen,
    brutoPlanta,
    taraPlanta,
    avesOrigen,
    avesDte: avesOrigen,
    inicio,
    fin,
    muertos,
    decomisos,
    decomisosVisc,
    status,
  }
}

function emptyTruckBase(id) {
  return {
    id,
    operator: 'Operador demo',
    codigoSn: 'SN-001',
    loteSenasa: julianLot(),
    note: '',
    sapCreated: false,
  }
}

function loadTrucks() {
  const stored = localStorage.getItem(storageKey)
  if (!stored) return seedTrucks

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length ? parsed : seedTrucks
  } catch {
    return seedTrucks
  }
}

function saveTruck() {
  const payload = { ...form, id: form.id || crypto.randomUUID() }
  const index = trucks.value.findIndex((truck) => truck.id === payload.id)

  if (index >= 0) trucks.value[index] = payload
  else trucks.value.unshift(payload)

  selectedTruckId.value = payload.id
  sapTruckId.value = payload.id
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
  role.value = 'balanza'
  formDialog.value = true
}

function removeTruck(id) {
  trucks.value = trucks.value.filter((truck) => truck.id !== id)
  selectedTruckId.value = trucks.value[0]?.id
  sapTruckId.value = trucks.value[0]?.id
}

function clearForm() {
  Object.assign(form, emptyForm())
}

function closeForm() {
  formDialog.value = false
  clearForm()
}

function saveLeaderUpdate() {
  const truck = selectedTruck.value
  if (!truck) return

  Object.assign(truck, leaderForm)
  showFeedback('Novedad informada a balanza')
}

function markSapCreated() {
  const truck = sapTruck.value
  if (!truck) return
  truck.sapCreated = true
  truck.status = 'SAP creado'
  showFeedback('Operacion SAP creada correctamente')
}

function resetDemo() {
  localStorage.removeItem(storageKey)
  trucks.value = seedTrucks.map((truck) => ({ ...truck, id: crypto.randomUUID() }))
  selectedTruckId.value = trucks.value[0]?.id
  sapTruckId.value = trucks.value[0]?.id
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

function percent(value, total) {
  if (!Number(total)) return '0%'
  return `${((Number(value || 0) / Number(total)) * 100).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
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

function focusLeaderPanel() {
  leaderPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function selectLeaderTruck(id) {
  selectedTruckId.value = id
  focusLeaderPanel()
}

function showFeedback(message) {
  feedback.value = message
  window.setTimeout(() => {
    feedback.value = ''
  }, 2800)
}
</script>
