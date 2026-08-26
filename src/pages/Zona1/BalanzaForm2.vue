<template>
  <q-page class="page-shell">
    <div class="page-content">
      <header class="page-header balanza-form-header">
        <div>
          <h1>Faena de {{ form.client }}</h1>
          <p>Carga rápida de horarios, novedades y resultados de línea.</p>
        </div>
        <button class="secondary-action" type="button" @click="goToList">
          <X :size="18" /> Cerrar
        </button>
      </header>

      <q-form class="balanza-form" @submit.prevent="saveTruck">
        <div class="balanza-form-body balanza-form-body--faena">
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
              >
                <template #append>
                  <CalendarDays :size="18" />
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.fechaEntrada" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup flat label="OK" color="primary" />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </template>
              </q-input>
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
              >
                <template #append>
                  <CalendarDays :size="18" />
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.fechaSalida" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup flat label="OK" color="primary" />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </template>
              </q-input>
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
              <NonNegativeInput
                v-model="form.muertos"
                label="Muertos"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.decomisos"
                label="Decomisos"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.decomisosVisc"
                label="Vísceras"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.plumas"
                label="Plumas"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.vacias"
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
                <span>% muertos</span><strong>{{ pct(formMetrics.porcentajeMuertos) }}</strong>
              </div>
              <div>
                <span>% decom.</span><strong>{{ pct(formMetrics.porcentajeDecomisados) }}</strong>
              </div>
            </div>
          </section>
        </div>

        <footer class="balanza-form-footer">
          <button class="secondary-action" type="button" @click="goToList">Cancelar</button>
          <button class="primary-action" type="submit"><Save :size="19" /> Guardar faena</button>
        </footer>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, Save, X } from '@lucide/vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { calculateTruckMetrics, formatKg, formatPercent } from '@/utils/truckCalculations'
import {
  emptyTruckForm,
  loadBalanzaTrucks,
  saveBalanzaTrucks,
  truckClassificationKey,
} from '@/utils/balanza'

const route = useRoute()
const router = useRouter()
const form = reactive(emptyTruckForm())
const trucks = loadBalanzaTrucks()
const truck = trucks.find((item) => String(item.id) === String(route.params.id))

if (truck)
  Object.assign(form, {
    ...truck,
    fechaSalida: truck.fechaSalida || new Date().toISOString().slice(0, 10),
  })
else goToList()

const formMetrics = computed(() => calculateTruckMetrics(form))

function saveTruck() {
  const lineConfirmedAt = new Date().toISOString()
  const payload = {
    ...form,
    lineConfirmedAt,
    status: 'faeneado',
    classification: truckClassificationKey(form),
  }
  const index = trucks.findIndex((item) => item.id === payload.id)
  if (index >= 0) trucks[index] = payload
  saveBalanzaTrucks(trucks)
  goToList()
}

function goToList() {
  router.push('/balanza')
}

function kg(value) {
  return formatKg(value)
}

function pct(value) {
  return formatPercent(value)
}
</script>
