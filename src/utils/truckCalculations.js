const locale = 'es-AR'

function numberValue(value) {
  return Number(value || 0)
}

function safeDivide(numerator, denominator) {
  const safeDenominator = numberValue(denominator)
  if (!safeDenominator) return 0
  return numberValue(numerator) / safeDenominator
}

export function calculateNet(gross, tare) {
  return numberValue(gross) - numberValue(tare)
}

export function calculateTruckMetrics(truck) {
  const netoOrigen = calculateNet(truck?.brutoOrigen, truck?.taraOrigen)
  const netoPlanta = calculateNet(truck?.brutoPlanta, truck?.taraPlanta)
  const diferenciaNeta = netoOrigen - netoPlanta
  const aves = numberValue(truck?.avesOrigen)
  const muertos = numberValue(truck?.muertos)
  const decomisos = numberValue(truck?.decomisos)
  const decomisosVisc = numberValue(truck?.decomisosVisc)
  const decomisosTotales = decomisos + decomisosVisc
  const promedio = safeDivide(netoOrigen, aves)

  return {
    netoOrigen,
    netoPlanta,
    diferenciaNeta,
    promedio,
    kgMuertos: promedio * muertos,
    kgDecomisados: promedio * decomisosTotales,
    porcentajeMerma: safeDivide(diferenciaNeta, netoOrigen),
    porcentajeMuertos: safeDivide(muertos, aves),
    porcentajeDecomisados: safeDivide(decomisosTotales, aves),
  }
}

export function formatKg(value) {
  return `${Math.round(numberValue(value)).toLocaleString(locale)} kg`
}

export function formatAverageKg(value) {
  return `${numberValue(value).toLocaleString(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} kg`
}

export function formatPercent(value) {
  return numberValue(value).toLocaleString(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
