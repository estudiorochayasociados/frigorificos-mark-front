export const DEFAULT_CALIBERS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14']

export function truckBirds(truck) {
  return Math.max(0, Number(truck?.avesOrigen || truck?.avesDte || 0))
}

export function truckLosses(truck) {
  return (
    Math.max(0, Number(truck?.muertos || 0)) +
    Math.max(0, Number(truck?.decomisos || 0)) +
    Math.max(0, Number(truck?.decomisosVisc || 0))
  )
}

export function truckAvailableBirds(truck) {
  return Math.max(0, truckBirds(truck) - truckLosses(truck))
}

export function productionDateForTruck(truck) {
  if (truck?.fechaEntrada) return truck.fechaEntrada
  const value = truck?.date || truck?.createdAt
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export function groupTrucksByBrand(trucks, date) {
  const groups = new Map()
  trucks
    .filter(
      (truck) =>
        truck?.client &&
        productionDateForTruck(truck) === date &&
        Boolean(truck.lineConfirmedAt || truck.fin),
    )
    .forEach((truck) => {
      const current = groups.get(truck.client) || []
      current.push(truck)
      groups.set(truck.client, current)
    })
  return [...groups.entries()].map(([brand, brandTrucks]) => ({ brand, trucks: brandTrucks }))
}

export function consumedByTruck(productions, excludedProductionId = null) {
  return productions.reduce((result, production) => {
    if (production.id === excludedProductionId || !production.consumptionConfirmedAt) return result
    Object.entries(production.consumption || {}).forEach(([truckId, quantity]) => {
      result[truckId] = Number(result[truckId] || 0) + Number(quantity || 0)
    })
    return result
  }, {})
}

export function proposeFifoConsumption(trucks, requiredBirds, alreadyConsumed = {}) {
  let remaining = Math.max(0, Number(requiredBirds || 0))
  const result = {}
  ;[...trucks.entries()]
    .sort(([leftIndex, left], [rightIndex, right]) => {
      const leftDate = `${productionDateForTruck(left)} ${left.horarioLlegada || '99:99'}`
      const rightDate = `${productionDateForTruck(right)} ${right.horarioLlegada || '99:99'}`
      return leftDate.localeCompare(rightDate) || rightIndex - leftIndex
    })
    .forEach(([, truck]) => {
      const available = Math.max(
        0,
        truckAvailableBirds(truck) - Number(alreadyConsumed[truck.id] || 0),
      )
      const quantity = Math.min(available, remaining)
      result[truck.id] = quantity
      remaining -= quantity
    })
  return result
}

export function totalOutputBoxes(outputs) {
  return (outputs || []).reduce(
    (total, output) => total + Math.max(0, Number(output.boxes || 0)),
    0,
  )
}

export function productionStatusLabel(production) {
  if (!production) return 'Pendiente'
  if (production.status === 'completed') return 'Finalizada'
  if (production.status === 'draft') return 'Borrador'
  return 'En proceso'
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
