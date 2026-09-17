<template>
  <q-page class="page-shell">
    <div class="page-content">
      <PageHeader title="Usuarios" description="Administrá los accesos y permisos del sistema.">
        <template #actions>
          <button class="primary-action" type="button" @click="openCreate">
            <Plus :size="20" /> Nuevo usuario
          </button>
        </template>
      </PageHeader>

      <ResponsiveDataTable :rows="cuentas" :columns="columns" :mobile-fields="mobileFields">
        <template #desktop-body="props">
          <q-tr :props="props">
            <q-td key="nombre" :props="props"
              ><strong>{{ props.row.nombre }}</strong></q-td
            >
            <q-td key="correo" :props="props">{{ props.row.correo }}</q-td>
            <q-td key="rol" :props="props"
              ><span class="status-pill status-neutral">{{ roleLabel(props.row.rol) }}</span></q-td
            >
            <q-td key="activo" :props="props"
              ><span
                :class="['status-pill', props.row.activo ? 'status-success' : 'status-warning']"
                >{{ props.row.activo ? 'Activo' : 'Inactivo' }}</span
              ></q-td
            >
            <q-td key="actions" :props="props" class="actions-cell">
              <button class="table-icon-action" type="button" @click="openEdit(props.row)">
                <Pencil :size="16" /> Editar
              </button>
              <button class="table-icon-action" type="button" @click="removeUser(props.row)">
                <Trash2 :size="16" /> Eliminar
              </button>
            </q-td>
          </q-tr>
        </template>
        <template #mobile-leading
          ><span class="user-avatar"><UserRound :size="19" /></span
        ></template>
        <template #mobile-title="{ row }">{{ row.nombre }}</template>
        <template #mobile-subtitle="{ row }">{{ row.correo }} · {{ roleLabel(row.rol) }}</template>
        <template #mobile-status="{ row }"
          ><span :class="['status-pill', row.activo ? 'status-success' : 'status-warning']">{{
            row.activo ? 'Activo' : 'Inactivo'
          }}</span></template
        >
        <template #mobile-actions="{ row }">
          <button type="button" @click="openEdit(row)"><Pencil :size="16" /> Editar</button>
          <button class="danger" type="button" @click="removeUser(row)">
            <Trash2 :size="16" /> Eliminar
          </button>
        </template>
        <template #empty><div class="empty-state">No hay usuarios registrados.</div></template>
      </ResponsiveDataTable>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card class="user-dialog">
        <q-card-section
          ><div class="text-h6">
            {{ form.id ? 'Editar usuario' : 'Nuevo usuario' }}
          </div></q-card-section
        >
        <q-form @submit.prevent="saveUser">
          <q-card-section class="q-pt-none user-dialog-fields">
            <q-input
              v-model="form.nombre"
              label="Nombre *"
              outlined
              dense
              autofocus
              :rules="[(value) => !!value?.trim() || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.correo"
              label="Correo *"
              type="email"
              outlined
              dense
              :rules="[(value) => !!value?.trim() || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.contrasena"
              :label="form.id ? 'Nueva contraseña (opcional)' : 'Contraseña *'"
              type="password"
              outlined
              dense
              :rules="[passwordRule]"
            />
            <q-select
              v-model="form.rol"
              :options="roleOptions"
              label="Rol"
              outlined
              dense
              emit-value
              map-options
            />
            <q-toggle v-model="form.activo" label="Usuario activo" color="red" />
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
import { Pencil, Plus, Save, Trash2, UserRound } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import { useCuentas } from '@/composables/useCuentas'

const { cuentas, listarCuentas, crearCuenta, actualizarCuenta, eliminarCuenta } = useCuentas()
const dialogOpen = ref(false)
const saving = ref(false)
const feedback = reactive({ message: '', type: 'success' })
const form = reactive({
  id: '',
  nombre: '',
  correo: '',
  contrasena: '',
  rol: 'operador',
  activo: true,
})

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' },
]
const mobileFields = [{ label: 'Rol', value: (cuenta) => roleLabel(cuenta.rol) }]
const roleOptions = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Operador', value: 'operador' },
]

onMounted(loadUsers)

async function loadUsers() {
  try {
    await listarCuentas()
  } catch (error) {
    showFeedback(error.message, 'error')
  }
}

function openCreate() {
  Object.assign(form, {
    id: '',
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'operador',
    activo: true,
  })
  dialogOpen.value = true
}

function openEdit(cuenta) {
  Object.assign(form, cuenta, { contrasena: '' })
  dialogOpen.value = true
}

function passwordRule(value) {
  if (form.id && !value) return true
  return value.length >= 6 || 'Mínimo 6 caracteres'
}

async function saveUser() {
  const datos = {
    nombre: form.nombre.trim(),
    correo: form.correo.trim(),
    contrasena: form.contrasena,
    rol: form.rol,
    activo: form.activo,
  }
  if (!datos.nombre || !datos.correo || (!form.id && datos.contrasena.length < 6)) return

  saving.value = true
  try {
    if (form.id) await actualizarCuenta(form.id, datos)
    else await crearCuenta(datos)
    dialogOpen.value = false
    await loadUsers()
    showFeedback('Usuario guardado correctamente')
  } catch (error) {
    showFeedback(error.message, 'error')
  } finally {
    saving.value = false
  }
}

function removeUser(cuenta) {
  Dialog.create({
    title: 'Eliminar usuario',
    message: `¿Eliminar el usuario ${cuenta.nombre}?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await eliminarCuenta(cuenta.id)
      await loadUsers()
      showFeedback('Usuario eliminado correctamente')
    } catch (error) {
      showFeedback(error.message, 'error')
    }
  })
}

function roleLabel(rol) {
  return rol === 'admin' ? 'Administrador' : 'Operador'
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
.user-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  background: var(--soft-red);
  color: var(--brand);
}

.user-dialog {
  width: min(440px, calc(100vw - 32px));
}

.user-dialog-fields {
  display: grid;
  gap: 14px;
}

.empty-state {
  padding: 36px 20px;
  color: var(--muted);
  text-align: center;
}
</style>
