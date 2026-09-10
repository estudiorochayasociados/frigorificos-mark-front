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
  const netoGranja = calculateNet(truck?.brutoOrigen, truck?.taraOrigen)
  const netoReal = calculateNet(truck?.brutoReal, truck?.taraPlanta)
  const netoPlanta = calculateNet(truck?.brutoPlanta, truck?.taraPlanta)
  const diferenciaNetaGranjaPlanta = netoPlanta - netoGranja
  const diferenciaNetaRealPlanta = netoPlanta - netoReal
  const aves = numberValue(truck?.avesOrigen)
  const muertos = numberValue(truck?.muertos)
  const decomisos = numberValue(truck?.decomisos)
  const promedioGranja = safeDivide(netoGranja, aves)
  const promedioReal = safeDivide(netoReal, aves)
  const promedioPlanta = safeDivide(netoPlanta, aves)
  const promedio = promedioGranja

  return {
    netoOrigen: netoGranja,
    netoGranja,
    netoReal,
    netoPlanta,
    diferenciaNeta: diferenciaNetaRealPlanta,
    diferenciaNetaGranjaPlanta,
    diferenciaNetaRealPlanta,
    promedio,
    promedioGranja,
    promedioReal,
    promedioPlanta,
    kgMuertos: promedio * muertos,
    kgDecomisados: promedio * decomisos,
    porcentajeMerma: safeDivide(diferenciaNetaRealPlanta, netoGranja),
    porcentajeMuertos: safeDivide(muertos, aves),
    porcentajeDecomisados: safeDivide(decomisos, aves),
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
