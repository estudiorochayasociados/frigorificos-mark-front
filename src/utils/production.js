export const DEFAULT_CALIBERS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14']

function dateMatchesFilter(date, filter) {
  if (!filter) return true
  if (typeof filter === 'string') return date === filter
  return date >= String(filter.desde || '') && date <= String(filter.hasta || '')
}

export function normalizeProductionOutput(outputs, caliber) {
  const existing = (outputs || []).find((item) => item.caliber === caliber)
  const boxes = Math.max(0, Number(existing?.boxes || 0))
  const rest = { ...(existing || {}) }
  delete rest.boxesB
  return { ...rest, caliber, boxes }
}

export function normalizeProductionBOutputs(outputs) {
  const normalized = (outputs || []).map((output) => ({
    ...(output || {}),
    caliber: String(output?.caliber ?? output?.calibre ?? '').trim(),
    boxes: Math.max(0, Number(output?.boxes ?? output?.cajas ?? 0)),
  }))

  if (normalized.length) return normalized
  return DEFAULT_CALIBERS.map((caliber) => ({ caliber, boxes: 0 }))
}

export function truckBirds(truck) {
  return Math.max(0, Number(truck?.avesOrigen || truck?.avesDte || 0))
}

export function truckConfiscations(truck) {
  return Math.max(0, Number(truck?.decomisos || 0)) + Math.max(0, Number(truck?.decomisosVisc || 0))
}

export function truckLosses(truck) {
  return Math.max(0, Number(truck?.muertos || 0)) + truckConfiscations(truck)
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
  const splitByDate =
    date && typeof date !== 'string' && String(date.desde || '') !== String(date.hasta || '')
  trucks
    .filter(
      (truck) =>
        truck?.client &&
        dateMatchesFilter(productionDateForTruck(truck), date) &&
        (!date || Boolean(truck.lineConfirmedAt || truck.fin)),
    )
    .forEach((truck) => {
      const truckDate = productionDateForTruck(truck)
      const key = splitByDate ? `${truck.client}::${truckDate}` : truck.client
      const current = groups.get(key) || []
      current.push(truck)
      groups.set(key, current)
    })
  return [...groups.entries()].map(([brand, brandTrucks]) => ({
    brand: splitByDate ? brand.split('::')[0] : brand,
    trucks: brandTrucks.sort(compareProductionOrder),
    date: productionDateForTruck(brandTrucks[0]),
  }))
}

function compareProductionOrder(left, right) {
  const leftOrder = Number(left.productionOrder || 0)
  const rightOrder = Number(right.productionOrder || 0)
  if (leftOrder > 0 && rightOrder > 0 && leftOrder !== rightOrder) return leftOrder - rightOrder
  if (leftOrder > 0 && rightOrder <= 0) return -1
  if (rightOrder > 0 && leftOrder <= 0) return 1
  const leftDate = `${productionDateForTruck(left)} ${left.horarioLlegada || '99:99'}`
  const rightDate = `${productionDateForTruck(right)} ${right.horarioLlegada || '99:99'}`
  return leftDate.localeCompare(rightDate)
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

export function proposeFifoConsumption(
  trucks,
  requiredBirds,
  alreadyConsumed = {},
  truckOrder = {},
) {
  let remaining = Math.max(0, Number(requiredBirds || 0))
  const result = {}
  ;[...trucks.entries()]
    .sort(([leftIndex, left], [rightIndex, right]) => {
      const leftOrder = Number(truckOrder[left.id] || 0)
      const rightOrder = Number(truckOrder[right.id] || 0)
      if (leftOrder > 0 && rightOrder > 0 && leftOrder !== rightOrder) return leftOrder - rightOrder
      if (leftOrder > 0 && rightOrder <= 0) return -1
      if (rightOrder > 0 && leftOrder <= 0) return 1
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

export function totalOutputBoxesB(outputs) {
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
