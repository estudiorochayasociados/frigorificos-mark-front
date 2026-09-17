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

export function truckConfiscations(truck) {
  return (
    Math.max(0, numberValue(truck?.faena?.novedades?.decomisadas)) +
    Math.max(0, numberValue(truck?.faena?.novedades?.decomisadasVisceras))
  )
}

export function calculateTruckMetrics(truck) {
  const netoGranja = calculateNet(truck?.pesos?.origen?.brutoKg, truck?.pesos?.origen?.taraKg)
  const netoReal = numberValue(truck?.pesos?.faena?.netoKg)
  const netoPlanta = calculateNet(truck?.pesos?.planta?.brutoKg, truck?.pesos?.planta?.taraKg)
  const diferenciaNetaGranjaPlanta = netoGranja - netoPlanta
  const diferenciaNetaRealPlanta = netoPlanta - netoReal
  const aves = numberValue(truck?.aves?.planta)
  const avesGranja = numberValue(truck?.aves?.origen)
  const muertos = numberValue(truck?.faena?.novedades?.muertas)
  const decomisos = truckConfiscations(truck)
  const promedioGranja = safeDivide(netoGranja, aves)
  const promedioReal = safeDivide(netoReal, aves)
  const promedioPlanta = safeDivide(netoPlanta, aves)
  const promedio = promedioGranja

  return {
    netoOrigen: netoGranja,
    netoGranja,
    netoReal,
    netoPlanta,
    diferenciaNeta: diferenciaNetaGranjaPlanta,
    diferenciaNetaGranjaPlanta,
    diferenciaNetaRealPlanta,
    promedio,
    promedioGranja,
    promedioReal,
    promedioPlanta,
    diferenciaAvesGranjaPlanta: avesGranja > 0 ? aves - avesGranja : null,
    kgMuertos: promedio * muertos,
    kgDecomisados: promedio * decomisos,
    porcentajeMerma: safeDivide(diferenciaNetaGranjaPlanta, netoGranja),
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

export function formatBirds(value) {
  return Math.round(numberValue(value)).toLocaleString(locale)
}

export function formatPercent(value) {
  return numberValue(value).toLocaleString(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
