export const balanzaStorageKey = 'mark-frigorifico-operacion-v2'

export function emptyTruckForm() {
  return {
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
    plumas: 0,
    codigoSn: 'SN-001',
    loteSenasa: julianLot(),
    date: new Date().toISOString(),
    sapCreated: false,
    productionOrder: 0,
    status: 'registrado',
    classification: 'negro',
  }
}

export function loadBalanzaTrucks() {
  const stored = localStorage.getItem(balanzaStorageKey)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    let migrated = false
    const trucks = parsed.map((truck) => {
      const cleanedTruck = { ...truck }
      delete cleanedTruck.operator
      if (cleanedTruck.id == null || cleanedTruck.id === '') {
        cleanedTruck.id = createId()
        migrated = true
      }
      return cleanedTruck
    })

    if (migrated) localStorage.setItem(balanzaStorageKey, JSON.stringify(trucks))
    return trucks
  } catch {
    return []
  }
}

export function saveBalanzaTrucks(trucks) {
  localStorage.setItem(balanzaStorageKey, JSON.stringify(trucks))
}

export function productionOrderFor(trucks, truck) {
  const order = Number(truck.productionOrder || 0)
  if (Number.isInteger(order) && order > 0) return order
  return trucks.findIndex((item) => item.id === truck.id) + 1
}

export function compareProductionOrder(trucks) {
  return (left, right) => {
    const orderDifference = productionOrderFor(trucks, left) - productionOrderFor(trucks, right)
    if (orderDifference) return orderDifference
    return `${left.fechaEntrada || ''} ${left.horarioLlegada || ''}`.localeCompare(
      `${right.fechaEntrada || ''} ${right.horarioLlegada || ''}`,
    )
  }
}

export function nextProductionOrder(trucks) {
  return (
    trucks.reduce((largest, truck) => Math.max(largest, productionOrderFor(trucks, truck)), 0) + 1
  )
}

export function truckStatusKey(truck) {
  return truck?.status === 'faeneado' || truck?.lineConfirmedAt || truck?.fin
    ? 'faeneado'
    : 'registrado'
}

export function truckStatusLabel(truck) {
  return truckStatusKey(truck) === 'faeneado' ? 'Faeneado' : 'Registrado'
}

export function truckStatusClass(truck) {
  return truckStatusKey(truck) === 'faeneado' ? 'status-success' : 'status-warning'
}

export function truckClassificationKey(truck) {
  return truck?.dte?.trim() ? 'blanco' : 'negro'
}

export function truckClassificationLabel(truck) {
  return truckClassificationKey(truck) === 'blanco' ? 'Blanco' : 'Negro'
}

export function truckClassificationClass(truck) {
  return truckClassificationKey(truck) === 'blanco' ? 'status-neutral' : 'status-active'
}

export function truckDate(truck) {
  const value = truck?.fechaEntrada
    ? `${truck.fechaEntrada}T00:00:00`
    : truck?.date || truck?.createdAt || new Date().toISOString()
  return new Date(value).toLocaleDateString('es-AR')
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function julianLot() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return `${now.getFullYear()}-${Math.floor((now - start) / 86400000)
    .toString()
    .padStart(3, '0')}`
}
