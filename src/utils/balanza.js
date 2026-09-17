export function emptyTruckForm() {
  return {
    id: null,
    comercial: { marcaComercialId: '', loteSenasa: '', documentos: { dte: '', remito: '' } },
    vehiculo: { chasis: '', acoplado: '' },
    pesos: {
      origen: { brutoKg: 0, taraKg: 0 },
      planta: { brutoKg: 0, taraKg: 0 },
      faena: { brutoKg: 0, netoKg: 0 },
    },
    aves: { origen: 0, planta: 0 },
    faena: {
      novedades: { muertas: 0, decomisadas: 0, decomisadasVisceras: 0, vacias: 0, plumas: 0 },
      confirmadaEn: null,
    },
    fechas: {
      ingreso: { fecha: new Date().toISOString().slice(0, 10), hora: '' },
      egreso: { fecha: new Date().toISOString().slice(0, 10), hora: '' },
      inicioFaena: '',
      finFaena: '',
    },
    operacion: { ordenProduccion: 0, estado: 'registrado' },
  }
}

export function productionOrderFor(trucks, truck) {
  const order = Number(truck?.operacion?.ordenProduccion || 0)
  if (Number.isInteger(order) && order > 0) return order
  return trucks.findIndex((item) => item.id === truck.id) + 1
}

export function compareProductionOrder(trucks) {
  return (left, right) => {
    const orderDifference = productionOrderFor(trucks, left) - productionOrderFor(trucks, right)
    if (orderDifference) return orderDifference
    return `${left?.fechas?.ingreso?.fecha || ''} ${left?.fechas?.ingreso?.hora || ''}`.localeCompare(
      `${right?.fechas?.ingreso?.fecha || ''} ${right?.fechas?.ingreso?.hora || ''}`,
    )
  }
}

export function truckStatusKey(truck) {
  return truck?.operacion?.estado === 'faeneado' || truck?.faena?.confirmadaEn
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
  return truck?.comercial?.documentos?.dte?.trim() ? 'blanco' : 'negro'
}

export function truckClassificationLabel(truck) {
  return truckClassificationKey(truck) === 'blanco' ? 'Via 1' : 'Via 2'
}

export function truckClassificationClass(truck) {
  return truckClassificationKey(truck) === 'blanco' ? 'status-neutral' : 'status-active'
}

export function truckDate(truck) {
  return new Date(`${truck?.fechas?.ingreso?.fecha}T00:00:00`).toLocaleDateString('es-AR')
}
