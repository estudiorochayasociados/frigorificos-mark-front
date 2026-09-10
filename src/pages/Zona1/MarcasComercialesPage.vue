<template>
  <q-page class="page-shell">
    <div class="page-content">
      <PageHeader
        title="Marcas comerciales"
        description="Administrá los clientes disponibles para registrar camiones."
      >
        <template #actions>
          <button class="primary-action" type="button" @click="openCreate">
            <Plus :size="20" /> Nueva marca
          </button>
        </template>
      </PageHeader>

      <ResponsiveDataTable :rows="marcas" :columns="columns" :mobile-fields="mobileFields">
        <template #desktop-body="props">
          <q-tr :props="props">
            <q-td key="codigo" :props="props"
              ><strong>{{ props.row.codigo }}</strong></q-td
            >
            <q-td key="nombre" :props="props">{{ props.row.nombre }}</q-td>
            <q-td key="actions" :props="props" class="actions-cell">
              <button class="table-icon-action" type="button" @click="openEdit(props.row)">
                <Pencil :size="16" /> Editar
              </button>
              <button class="table-icon-action" type="button" @click="removeBrand(props.row)">
                <Trash2 :size="16" /> Eliminar
              </button>
            </q-td>
          </q-tr>
        </template>
        <template #mobile-leading
          ><span class="brand-avatar"><Tag :size="19" /></span
        ></template>
        <template #mobile-title="{ row }">{{ row.nombre }}</template>
        <template #mobile-subtitle="{ row }">Código: {{ row.codigo }}</template>
        <template #mobile-actions="{ row }">
          <button type="button" @click="openEdit(row)"><Pencil :size="16" /> Editar</button>
          <button class="danger" type="button" @click="removeBrand(row)">
            <Trash2 :size="16" /> Eliminar
          </button>
        </template>
        <template #empty
          ><div class="empty-state">No hay marcas comerciales registradas.</div></template
        >
      </ResponsiveDataTable>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card class="brand-dialog">
        <q-card-section>
          <div class="text-h6">
            {{ form.id ? 'Editar marca comercial' : 'Nueva marca comercial' }}
          </div>
        </q-card-section>
        <q-form @submit.prevent="saveBrand">
          <q-card-section class="q-pt-none brand-dialog-fields">
            <q-input
              v-model="form.nombre"
              label="Nombre *"
              outlined
              dense
              autofocus
              :rules="[(value) => !!value?.trim() || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.codigo"
              label="Código *"
              outlined
              dense
              class="uppercase-field"
              :rules="[(value) => !!value?.trim() || 'Campo obligatorio']"
            />
          </q-card-section>
          <q-card-actions align="right">
            <button class="secondary-action" type="button" @click="dialogOpen = false">
              Cancelar
            </button>
            <button class="primary-action" type="submit" :disabled="saving">
              <Save :size="18" /> Guardar
            </button>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <div v-if="feedback.message" :class="['feedback-toast', `feedback-toast--${feedback.type}`]">
      <span>{{ feedback.message }}</span>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Dialog } from 'quasar'
import { Pencil, Plus, Save, Tag, Trash2 } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import { useMarcasComerciales } from '@/composables/useMarcasComerciales'

const {
  marcas,
  listarMarcasComerciales,
  crearMarcaComercial,
  actualizarMarcaComercial,
  eliminarMarcaComercial,
} = useMarcasComerciales()
const dialogOpen = ref(false)
const saving = ref(false)
const feedback = reactive({ message: '', type: 'success' })
const form = reactive({ id: '', nombre: '', codigo: '' })

const columns = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left' },
  { name: 'nombre', label: 'Marca comercial', field: 'nombre', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' },
]
const mobileFields = [{ label: 'Código', value: (marca) => marca.codigo }]

onMounted(loadBrands)

async function loadBrands() {
  try {
    await listarMarcasComerciales()
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

function openCreate() {
  Object.assign(form, { id: '', nombre: '', codigo: '' })
  dialogOpen.value = true
}

function openEdit(marca) {
  Object.assign(form, marca)
  dialogOpen.value = true
}

async function saveBrand() {
  const datos = { nombre: form.nombre.trim(), codigo: form.codigo.trim() }
  if (!datos.nombre || !datos.codigo) return

  saving.value = true
  try {
    if (form.id) await actualizarMarcaComercial(form.id, datos)
    else await crearMarcaComercial(datos)
    dialogOpen.value = false
    await loadBrands()
    showFeedback('Marca comercial guardada correctamente')
  } catch (error) {
    showFeedback(error.message, 'error')
  } finally {
    saving.value = false
  }
}

function removeBrand(marca) {
  Dialog.create({
    title: 'Eliminar marca comercial',
    message: `¿Eliminar la marca comercial ${marca.nombre}?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await eliminarMarcaComercial(marca.id)
      await loadBrands()
      showFeedback('Marca comercial eliminada correctamente')
    } catch (error) {
      showFeedback(error.message, 'error')
    }
  })
}

function showFeedback(message, type = 'success') {
  feedback.message = message
  feedback.type = type
  window.setTimeout(() => {
    feedback.message = ''
  }, 2800)
}
</script>

<style scoped lang="scss">
.brand-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  background: var(--soft-red);
  color: var(--brand);
}

.brand-dialog {
  width: min(440px, calc(100vw - 32px));
}

.brand-dialog-fields {
  display: grid;
  gap: 14px;
}

.empty-state {
  padding: 36px 20px;
  color: var(--muted);
  text-align: center;
}
</style>
