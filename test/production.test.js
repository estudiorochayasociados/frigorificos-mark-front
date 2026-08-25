import test from 'node:test'
import assert from 'node:assert/strict'
import {
  consumedByTruck,
  groupTrucksByBrand,
  proposeFifoConsumption,
  truckAvailableBirds,
} from '../src/utils/production.js'

test('availability deducts deaths and both confiscation fields', () => {
  assert.equal(
    truckAvailableBirds({ avesOrigen: 5000, muertos: 50, decomisos: 15, decomisosVisc: 5 }),
    4930,
  )
})

test('groups only trucks from the requested date', () => {
  const groups = groupTrucksByBrand(
    [
      { id: '1', client: 'Marca A', fechaEntrada: '2026-08-21', lineConfirmedAt: 'now' },
      { id: '2', client: 'Marca A', fechaEntrada: '2026-08-21', fin: '08:00' },
      { id: '3', client: 'Marca B', fechaEntrada: '2026-08-20', lineConfirmedAt: 'now' },
      { id: '4', client: 'Marca C', fechaEntrada: '2026-08-21' },
    ],
    '2026-08-21',
  )
  assert.deepEqual(
    groups.map(({ brand, trucks }) => [brand, trucks.length]),
    [['Marca A', 2]],
  )
})

test('FIFO allocation respects prior confirmed consumption', () => {
  const trucks = [
    { id: 'first', fechaEntrada: '2026-08-21', horarioLlegada: '05:00', avesOrigen: 5000 },
    { id: 'second', fechaEntrada: '2026-08-21', horarioLlegada: '06:00', avesOrigen: 4500 },
  ]
  assert.deepEqual(proposeFifoConsumption(trucks, 7000, { first: 500 }), {
    first: 4500,
    second: 2500,
  })
})

test('only confirmed production consumption affects availability', () => {
  const result = consumedByTruck([
    { id: 'a', consumptionConfirmedAt: '2026-08-21', consumption: { truck: 100 } },
    { id: 'b', consumption: { truck: 300 } },
    { id: 'c', consumptionConfirmedAt: '2026-08-21', consumption: { truck: 50 } },
  ])
  assert.deepEqual(result, { truck: 150 })
})
