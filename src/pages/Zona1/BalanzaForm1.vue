<template>
  <q-page class="page-shell">
    <div class="page-content">
      <PageHeader
        class="balanza-form-header"
        :title="form.id ? `Registro de ${clientName}` : 'Registrar camión'"
        description="Alta rápida de ingreso, documentos, pesajes y aves."
      >
        <template #actions
          ><button class="secondary-action" type="button" @click="goToList">
            <X :size="18" /> Cerrar
          </button></template
        >
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
              <q-select
                v-model="form.marcaComercialId"
                :options="brandOptions"
                :loading="cargandoMarcas"
                label="Cliente / marca comercial *"
                outlined
                dense
                class="field-control field-span-2"
                hide-bottom-space
                :rules="[(value) => !!value || 'Campo obligatorio']"
                emit-value
                map-options
              >
                <template #append>
                  <button
                    class="select-add-action"
                    type="button"
                    aria-label="Crear marca comercial"
                    title="Crear marca comercial"
                    @mousedown.stop
                    @click.stop="openCreateBrand"
                  >
                    <Plus :size="18" />
                  </button>
                </template>
              </q-select>
            </div>
            <div class="form-grid form-grid-spaced">
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
            <div class="form-grid">
              <NonNegativeInput
                v-model="form.brutoOrigen"
                label="Peso bruto granja"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.brutoReal"
                label="Peso bruto real"
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
            </div>
            <div class="form-grid form-grid-spaced">
              <NonNegativeInput
                v-model="form.taraOrigen"
                label="Tara granja"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.taraPlanta"
                label="Tara de entrada"
                suffix="kg"
                outlined
                dense
                class="field-control"
              />
            </div>
            <div class="form-grid form-grid-spaced">
              <NonNegativeInput
                v-model="form.avesGranja"
                label="Aves origen"
                outlined
                dense
                class="field-control"
              />
              <NonNegativeInput
                v-model="form.avesOrigen"
                label="Cantidad de aves planta"
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
                <span>Neto granja</span><strong>{{ kg(formMetrics.netoGranja) }}</strong>
              </div>
              <div>
                <span>Neto real</span><strong>{{ kg(formMetrics.netoReal) }}</strong>
              </div>
              <div>
                <span>Neto planta</span><strong>{{ kg(formMetrics.netoPlanta) }}</strong>
              </div>
              <div>
                <span>Dif. granja - planta</span
                ><strong>{{ kg(formMetrics.diferenciaNetaGranjaPlanta) }}</strong>
              </div>
              <div>
                <span>Dif. planta - real</span
                ><strong>{{ kg(formMetrics.diferenciaNetaRealPlanta) }}</strong>
              </div>
              <div>
                <span>Promedio granja</span><strong>{{ avg(formMetrics.promedioGranja) }}</strong>
              </div>
              <div>
                <span>Promedio real</span><strong>{{ avg(formMetrics.promedioReal) }}</strong>
              </div>
              <div>
                <span>Promedio planta</span><strong>{{ avg(formMetrics.promedioPlanta) }}</strong>
              </div>
              <div>
                <span>Dif. aves planta - origen</span
                ><strong>{{ birds(formMetrics.diferenciaAvesGranjaPlanta) }}</strong>
              </div>
            </div>
          </section>
        </div>

        <footer class="balanza-form-footer">
          <button class="secondary-action" type="button" @click="goToList">Cancelar</button>
          <button
            class="primary-action"
            type="submit"
            :disabled="cargando || guardando || !isStep1Complete"
          >
            <Save :size="19" /> {{ form.id ? 'Guardar registro' : 'Crear camión' }}
          </button>
        </footer>
      </q-form>
      <div v-if="error" class="feedback-toast feedback-toast--error">{{ error }}</div>
    </div>

    <q-dialog v-model="createBrandOpen" persistent>
      <q-card class="brand-dialog">
        <q-card-section>
          <div class="text-h6">Nueva marca comercial</div>
          <div class="brand-dialog-description">
            Se agregará al listado y quedará seleccionada para este ingreso.
          </div>
        </q-card-section>
        <q-form @submit.prevent="createBrand">
          <q-card-section class="q-pt-none brand-dialog-fields">
            <q-input
              v-model="brandForm.nombre"
              label="Nombre *"
              outlined
              dense
              autofocus
              :rules="[(value) => !!value?.trim() || 'Campo obligatorio']"
            />
            <q-input
              v-model="brandForm.codigo"
              label="Código *"
              outlined
              dense
              class="uppercase-field"
              :rules="[(value) => !!value?.trim() || 'Campo obligatorio']"
            />
            <div v-if="brandError" class="brand-dialog-error" role="alert">{{ brandError }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <button
              class="secondary-action"
              type="button"
              :disabled="creatingBrand"
              @click="closeCreateBrand"
            >
              Cancelar
            </button>
            <button class="primary-action" type="submit" :disabled="creatingBrand">
              <Save :size="18" /> {{ creatingBrand ? 'Guardando...' : 'Crear y seleccionar' }}
            </button>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Save, X } from '@lucide/vue'
import NonNegativeInput from '@/components/NonNegativeInput.vue'
import { useCamiones } from '@/composables/useCamiones'
import { useMarcasComerciales } from '@/composables/useMarcasComerciales'
import {
  calculateNet,
  calculateTruckMetrics,
  formatAverageKg,
  formatBirds,
  formatKg,
} from '@/utils/truckCalculations'
import { emptyTruckForm } from '@/utils/balanza'

const route = useRoute()
const router = useRouter()
const form = reactive(emptyTruckForm())
const { obtenerCamion, crearCamion, actualizarCamion } = useCamiones()
const {
  marcas,
  cargando: cargandoMarcas,
  listarMarcasComerciales,
  crearMarcaComercial,
} = useMarcasComerciales()
const cargando = ref(Boolean(route.params.id))
const guardando = ref(false)
const error = ref('')
const createBrandOpen = ref(false)
const creatingBrand = ref(false)
const brandError = ref('')
const brandForm = reactive({ nombre: '', codigo: '' })

onMounted(async () => {
  try {
    await listarMarcasComerciales()
    if (!route.params.id) return
    const camion = await obtenerCamion(route.params.id)
    Object.assign(form, camion, { marcaComercialId: camion.marcaComercial?.id || '' })
  } catch (exception) {
    error.value = exception.message
    goToList()
  } finally {
    cargando.value = false
  }
})

const formMetrics = computed(() => calculateTruckMetrics(form))
const brandOptions = computed(() =>
  marcas.value.map((marca) => ({
    label: `${marca.nombre} (${marca.codigo || 'Sin código'})`,
    value: marca.id,
  })),
)
const clientName = computed(() => {
  const marca = marcas.value.find((item) => item.id === form.marcaComercialId)
  return marca?.nombre || form.client
})
const formValidationMessage = computed(() => {
  if (!form.marcaComercialId) return 'Seleccioná una marca comercial.'
  if (!form.chasis?.trim()) return 'Ingresá la patente de chasis.'
  if (Number(form.avesOrigen || 0) <= 0) return 'Ingresá una cantidad de aves mayor a cero.'
  if (
    calculateNet(form.brutoOrigen, form.taraOrigen) <= 0 &&
    calculateNet(form.brutoReal, form.taraPlanta) <= 0 &&
    calculateNet(form.brutoPlanta, form.taraPlanta) <= 0
  ) {
    return 'Ingresá al menos un peso bruto mayor que su tara.'
  }
  return ''
})
const isStep1Complete = computed(() => !formValidationMessage.value)

async function saveTruck() {
  if (!isStep1Complete.value) return

  guardando.value = true
  error.value = ''
  try {
    const payload = { ...form }
    delete payload.client
    delete payload.codigoSn
    delete payload.marcaComercial
    payload.avesOrigen = Number(form.avesOrigen || 0)
    if (form.id) await actualizarCamion(form.id, payload)
    else await crearCamion(payload)
    goToList()
  } catch (exception) {
    error.value = exception.message
  } finally {
    guardando.value = false
  }
}

function openCreateBrand() {
  Object.assign(brandForm, { nombre: '', codigo: '' })
  brandError.value = ''
  createBrandOpen.value = true
}

function closeCreateBrand() {
  createBrandOpen.value = false
}

async function createBrand() {
  const datos = { nombre: brandForm.nombre.trim(), codigo: brandForm.codigo.trim() }
  if (!datos.nombre || !datos.codigo) return

  creatingBrand.value = true
  brandError.value = ''
  try {
    const marca = await crearMarcaComercial(datos)
    await listarMarcasComerciales()
    form.marcaComercialId = marca.id
    closeCreateBrand()
  } catch (exception) {
    brandError.value = exception.message
  } finally {
    creatingBrand.value = false
  }
}

function goToList() {
  const returnTo = String(route.query.returnTo || '')
  router.push(returnTo.startsWith('/produccion/proceso') ? returnTo : '/balanza')
}

function kg(value) {
  return formatKg(value)
}

function avg(value) {
  return formatAverageKg(value)
}

function birds(value) {
  return value == null ? '-' : `${formatBirds(value)} aves`
}
</script>

<style scoped lang="scss">
.select-add-action {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: var(--soft-red);
  color: var(--brand);
  cursor: pointer;
}

.select-add-action:hover,
.select-add-action:focus-visible {
  background: var(--brand);
  color: white;
}

.brand-dialog {
  width: min(440px, calc(100vw - 32px));
}

.brand-dialog-description {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.875rem;
}

.brand-dialog-fields {
  display: grid;
  gap: 14px;
}

.brand-dialog-error {
  color: var(--brand);
  font-size: 0.875rem;
}
</style>
