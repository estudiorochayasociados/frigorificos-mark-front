export const DEFAULT_CALIBERS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14']
export const KILOS_POR_CAJA_RENDE = 20

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
  return Math.max(0, Number(truck?.decomisos || 0))
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

export function totalOutputBoxes(outputs) {
  return (outputs || []).reduce(
    (total, output) => total + Math.max(0, Number(output.boxes || 0)),
    0,
  )
}

export function hasManualOutputBirds(output) {
  return Boolean(output?.birdsManual) && output?.birds !== undefined && output?.birds !== null
}

export function outputBirds(output) {
  if (hasManualOutputBirds(output)) return Math.max(0, Number(output.birds || 0))
  return Math.max(0, Number(output?.boxes || 0)) * Math.max(0, Number(output?.caliber || 0))
}

export function totalOutputBirds(outputs) {
  return (outputs || []).reduce((total, output) => total + outputBirds(output), 0)
}

export function totalOutputBoxesB(outputs) {
  return (outputs || []).reduce(
    (total, output) => total + Math.max(0, Number(output.boxes || 0)),
    0,
  )
}

export function calcularRindeProduccion(trucks, outputs, outputsB, outputsBTrozado) {
  const cajas =
    totalOutputBoxes(outputs) + totalOutputBoxes(outputsB) + totalOutputBoxes(outputsBTrozado)
  const faenaKg = cajas * KILOS_POR_CAJA_RENDE
  const netoGranja = (trucks || []).reduce(
    (total, truck) =>
      total + Math.max(0, Number(truck?.brutoOrigen || 0) - Number(truck?.taraOrigen || 0)),
    0,
  )
  const netoPlanta = (trucks || []).reduce(
    (total, truck) =>
      total + Math.max(0, Number(truck?.brutoPlanta || 0) - Number(truck?.taraPlanta || 0)),
    0,
  )
  const bajas = (trucks || []).reduce(
    (totales, truck) => {
      totales.muertos += Math.max(0, Number(truck?.muertos || 0))
      totales.decomisos += truckConfiscations(truck)
      return totales
    },
    { muertos: 0, decomisos: 0 },
  )

  return {
    cajas,
    faenaKg,
    netoGranja,
    netoPlanta,
    ...bajas,
    rindeGranja: netoGranja > 0 ? faenaKg / netoGranja : null,
    rindePlanta: netoPlanta > 0 ? faenaKg / netoPlanta : null,
  }
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
