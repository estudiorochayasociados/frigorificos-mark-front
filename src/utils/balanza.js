export function emptyTruckForm() {
  return {
    id: null,
    marcaComercialId: '',
    dte: '',
    remito: '',
    chasis: '',
    acoplado: '',
    fechaEntrada: new Date().toISOString().slice(0, 10),
    fechaSalida: new Date().toISOString().slice(0, 10),
    horarioLlegada: '',
    brutoOrigen: 0,
    taraOrigen: 0,
    brutoReal: 0,
    brutoPlanta: 0,
    taraPlanta: 0,
    avesOrigen: 0,
    avesGranja: 0,
    vacias: 0,
    inicio: '',
    fin: '',
    muertos: 0,
    decomisos: 0,
    decomisosVisc: 0,
    plumas: 0,
    loteSenasa: '',
    productionOrder: 0,
    status: 'registrado',
  }
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

export function truckStatusKey(truck) {
  return truck?.status === 'faeneado' || truck?.lineConfirmedAt
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
  return truckClassificationKey(truck) === 'blanco' ? 'Via 1' : 'Via 2'
}

export function truckClassificationClass(truck) {
  return truckClassificationKey(truck) === 'blanco' ? 'status-neutral' : 'status-active'
}

export function truckDate(truck) {
  return new Date(`${truck.fechaEntrada}T00:00:00`).toLocaleDateString('es-AR')
}
