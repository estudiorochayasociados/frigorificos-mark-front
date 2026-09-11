import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateTruckMetrics } from '../src/utils/truckCalculations.js'

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12)

test('faena matches the reference formulas in Excel sheet 7, rows 10 through 12', () => {
  const metrics = calculateTruckMetrics({
    brutoOrigen: 26620,
    taraOrigen: 15740,
    brutoReal: 26460,
    brutoPlanta: 26620,
    taraPlanta: 15740,
    avesOrigen: 4410,
    muertos: 21,
    decomisos: 14,
    decomisosVisc: 1,
  })

  assert.equal(metrics.netoGranja, 10880)
  assert.equal(metrics.netoReal, 10720)
  assert.equal(metrics.netoPlanta, 10880)
  assert.equal(metrics.diferenciaNetaGranjaPlanta, 0)
  assert.equal(metrics.diferenciaNetaRealPlanta, 160)
  near(metrics.promedioGranja, 10880 / 4410)
  near(metrics.kgMuertos, 51.80952380952381)
  near(metrics.kgDecomisados, 37.006802721088434)
  near(metrics.porcentajeMerma, 0)
  near(metrics.porcentajeMuertos, 21 / 4410)
  near(metrics.porcentajeDecomisados, 15 / 4410)
})

test('merma uses the granja-to-planta difference and keeps its loss positive', () => {
  const metrics = calculateTruckMetrics({
    brutoOrigen: 12000,
    taraOrigen: 2000,
    brutoReal: 11800,
    brutoPlanta: 11700,
    taraPlanta: 2000,
    avesOrigen: 4000,
  })

  assert.equal(metrics.diferenciaNetaGranjaPlanta, 300)
  near(metrics.porcentajeMerma, 0.03)
})

test('birds difference is calculated only when farm count is available', () => {
  assert.equal(
    calculateTruckMetrics({ avesGranja: 4425, avesOrigen: 4410 }).diferenciaAvesGranjaPlanta,
    15,
  )
  assert.equal(
    calculateTruckMetrics({ avesOrigen: 4410 }).diferenciaAvesGranjaPlanta,
    null,
  )
})
