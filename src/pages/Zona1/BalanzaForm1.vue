<template>
  <q-page class="page-shell">
    <div class="page-content">
      <PageHeader
        class="balanza-form-header"
        :title="form.id ? `Registro de ${form.client}` : 'Registrar camión'"
        description="Alta rápida de ingreso, documentos, pesajes y aves."
      >
        <template #actions><button class="secondary-action" type="button" @click="goToList"><X :size="18" /> Cerrar</button></template>
      </PageHeader>

      <q-form class="balanza-form" @submit.prevent="saveTruck">
        <div class="balanza-form-body balanza-form-body--two-cols">
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
                hide-bottom-space
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
              <q-input v-model="form.dte" label="Numero DTE" outlined dense class="field-control" />
              <q-input v-model="form.remito" label="Remito" outlined dense class="field-control" />
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
                hide-bottom-space
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
            <div class="form-grid form-grid--two">
              <NonNegativeInput
                v-model="form.brutoOrigen"
                label="Peso bruto origen"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.taraOrigen"
                label="Tara origen"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.brutoPlanta"
                label="Peso bruto planta"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.taraPlanta"
                label="Tara planta"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
            </div>
            <div class="form-grid form-grid--two form-grid-spaced">
              <NonNegativeInput
                v-model="form.avesOrigen"
                label="Cantidad de aves"
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
                <span>Diferencia neta</span><strong>{{ kg(formMetrics.diferenciaNeta) }}</strong>
              </div>
              <div>
                <span>Peso promedio</span><strong>{{ avg(formMetrics.promedio) }}</strong>
              </div>
            </div>
          </section>
        </div>

        <footer class="balanza-form-footer">
          <button class="secondary-action" type="button" @click="goToList">Cancelar</button>
          <button class="primary-action" type="submit" :disabled="cargando || guardando || !isStep1Complete">
            <Save :size="19" /> {{ form.id ? 'Guardar registro' : 'Crear camión' }}
          </button>
        </footer>
      </q-form>
      <div v-if="error" class="feedback-toast">{{ error }}</div>
    </div>
  </q-page>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Save, X } from '@lucide/vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { useCamiones } from '@/composables/useCamiones'
import {
  calculateNet,
  calculateTruckMetrics,
  formatAverageKg,
  formatKg,
} from '@/utils/truckCalculations'
import {
  emptyTruckForm,
} from '@/utils/balanza'

const route = useRoute()
const router = useRouter()
const form = reactive(emptyTruckForm())
const { obtenerCamion, crearCamion, actualizarCamion } = useCamiones()
const cargando = ref(Boolean(route.params.id))
const guardando = ref(false)
const error = ref('')

onMounted(async () => {
  if (!route.params.id) return
  try {
    Object.assign(form, await obtenerCamion(route.params.id))
  } catch (exception) {
    error.value = exception.message
    goToList()
  } finally {
    cargando.value = false
  }
})

const formMetrics = computed(() => calculateTruckMetrics(form))
const isStep1Complete = computed(
  () =>
    Boolean(form.client?.trim()) &&
    Boolean(form.chasis?.trim()) &&
    Number(form.avesOrigen || 0) > 0 &&
    (calculateNet(form.brutoOrigen, form.taraOrigen) > 0 ||
      calculateNet(form.brutoPlanta, form.taraPlanta) > 0),
)

async function saveTruck() {
  if (!isStep1Complete.value) return

  guardando.value = true
  error.value = ''
  try {
    const payload = { ...form, avesOrigen: Number(form.avesOrigen || 0) }
    if (form.id) await actualizarCamion(form.id, payload)
    else await crearCamion(payload)
    goToList()
  } catch (exception) {
    error.value = exception.message
  } finally {
    guardando.value = false
  }
}

function goToList() {
  router.push('/balanza')
}

function kg(value) {
  return formatKg(value)
}

function avg(value) {
  return formatAverageKg(value)
}
</script>
