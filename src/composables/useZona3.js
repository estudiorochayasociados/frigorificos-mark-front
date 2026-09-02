import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createId } from '@/utils/production'

export function useZona3() {
  const ordersKey = 'mark-frigorifico-pedidos-v1'
  const loadsKey = 'mark-frigorifico-cargas-v1'
  const finishedStockKey = 'mark-frigorifico-stock-terminado-v1'
  const warehouseTransfersKey = 'mark-frigorifico-movimientos-almacen-v1'
  const route = useRoute()
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const truckTypeOptions = ['Semi', 'Balancín']
  const loadPositionOptions = [
    { label: 'Culata - descarga primero', value: 'culata' },
    { label: 'Centro', value: 'centro' },
    { label: 'Pecho - descarga ultimo', value: 'pecho' },
  ]
  const loadPositionOrder = { culata: 1, centro: 2, pecho: 3 }
  const storedOrders = loadArray(ordersKey)
  const demoOrderIds = new Set(storedOrders.filter((order) => order.demo).map((order) => order.id))
  const orders = ref(storedOrders.filter((order) => !order.demo))
  const storedLoads = loadArray(loadsKey)
  const loads = ref(removeDemoReferences(storedLoads, demoOrderIds).map(normalizeLoad))
  const finishedStock = ref(loadArray(finishedStockKey))
  const warehouseTransfers = ref(loadArray(warehouseTransfersKey))
  const loadSearch = ref('')
  const expandedStockBrands = ref(new Set())
  const stockTransferDialog = ref(false)
  const feedback = reactive({ message: '', type: 'success' })

  if (demoOrderIds.size) {
    localStorage.setItem(ordersKey, JSON.stringify(orders.value))
    localStorage.setItem(loadsKey, JSON.stringify(loads.value))
  }

  const emptyOrderForm = () => ({
    documentType: 'REMITO',
    documentNumber: '',
    folio: '',
    clientCode: '',
    client: '',
    destination: '',
    lines: [emptyOrderLine()],
  })
  const orderForm = reactive(emptyOrderForm())
  const emptyLoadForm = () => ({
    date: today,
    truckType: 'Semi',
    capacityKg: 24000,
    transport: '',
    plate: '',
    driver: '',
    dock: '',
    orderIds: [],
    orderDetails: {},
  })
  const loadForm = reactive(emptyLoadForm())
  const stockTransferForm = reactive(emptyWarehouseTransfer())
  const loadSteps = [
    { number: '1', value: 'detalle', label: 'Detalle' },
    { number: '2', value: 'romaneo', label: 'Romaneo' },
    { number: '3', value: 'documentacion', label: 'Documentación' },
  ]
  const orderColumns = [
    { name: 'document', label: 'Documento', field: 'documentNumber', align: 'left' },
    { name: 'folio', label: 'Folio', field: 'folio', align: 'left' },
    { name: 'client', label: 'Cliente', field: 'client', align: 'left' },
    { name: 'destination', label: 'Destino', field: 'destination', align: 'left' },
    { name: 'status', label: 'Estado', field: (row) => orderStatus(row), align: 'left' },
  ]
  const stockColumns = [
    { name: 'brand', label: 'Marca comercial', field: 'brand', align: 'left' },
    { name: 'product', label: 'Producto', field: 'product', align: 'left' },
    { name: 'caliber', label: 'Calibre', field: 'caliber', align: 'left' },
    { name: 'lot', label: 'Lote', field: 'lot', align: 'left' },
    { name: 'boxes', label: 'Disponibles / producidas', field: 'boxes', align: 'left' },
  ]
  const loadColumns = [
    { name: 'code', label: 'Reparto', field: (row) => repartoNumber(row), align: 'left' },
    { name: 'plate', label: 'Camión', field: 'plate', align: 'left' },
    {
      name: 'destination',
      label: 'Destino',
      field: (row) => loadDestinations(row).join(' / '),
      align: 'left',
    },
    { name: 'clients', label: 'Clientes', field: (row) => loadClients(row).length, align: 'left' },
    {
      name: 'boxes',
      label: 'Cajas solicitadas',
      field: (row) => loadRequestedBoxes(row),
      align: 'left',
    },
    { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  ]
  const movementColumns = [
    { name: 'stock', label: 'Lote', field: 'stockLabel', align: 'left' },
    { name: 'quantity', label: 'Cajas', field: 'quantity', align: 'left' },
    { name: 'origin', label: 'Origen', field: (row) => transferOrigin(row), align: 'left' },
    {
      name: 'destination',
      label: 'Destino',
      field: (row) => transferDestination(row),
      align: 'left',
    },
    { name: 'createdAt', label: 'Fecha', field: 'createdAt', align: 'left' },
  ]

  const showOrderFormPage = computed(
    () => route.path === '/expedicion/pedidos/nuevo' || route.query.action === 'pedido',
  )
  const showLoadFormPage = computed(
    () => route.path === '/expedicion/repartos/nuevo' || route.query.action === 'carga',
  )
  const activeLoad = computed(() => loads.value.find((load) => load.id === route.query.load))
  const currentLoadStep = computed(() => {
    const requested = route.query.step
    if (loadSteps.some((step) => step.value === requested) && canOpenLoadStep(requested))
      return requested
    if (!activeLoad.value) return 'detalle'
    if (activeLoad.value.status === 'dispatched' || activeLoad.value.status === 'documented')
      return 'documentacion'
    if (activeLoad.value.status === 'loaded') return 'documentacion'
    if (activeLoad.value.status === 'loading' || activeLoad.value.status === 'ready')
      return 'romaneo'
    return 'detalle'
  })
  const pendingOrders = computed(() =>
    orders.value.filter((order) => orderStatusKey(order) === 'pending'),
  )
  const filteredOrders = computed(() => orders.value)
  const filteredLoads = computed(() => {
    const term = loadSearch.value.trim().toLocaleLowerCase('es')
    return [...loads.value]
      .reverse()
      .filter(
        (load) =>
          !term ||
          `${load.code} ${load.plate} ${load.transport} ${loadClients(load).join(' ')}`
            .toLocaleLowerCase('es')
            .includes(term),
      )
  })
  const stockRows = computed(() =>
    finishedStock.value.flatMap((item) =>
      (item.outputs || [])
        .filter((output) => Number(output.boxes || 0) > 0)
        .map((output) => ({
          id: `${item.id}:${output.caliber}`,
          sourceId: item.id,
          brand: item.brand,
          product: item.product,
          caliber: output.caliber,
          lot: item.lot,
          manufactureDate: item.manufactureDate,
          expirationDate: item.expirationDate,
          createdAt: item.createdAt,
          boxes: Number(output.boxes || 0),
        })),
    ),
  )
  const dailyStockRows = computed(() =>
    stockRows.value.filter((row) => String(row.createdAt || '').slice(0, 10) === today),
  )
  const dailyStockGroups = computed(() => {
    const groups = new Map()
    dailyStockRows.value.forEach((row) => {
      const current = groups.get(row.brand) || {
        brand: row.brand,
        boxes: 0,
        available: 0,
        products: new Set(),
        lots: new Set(),
        rows: [],
        productRows: new Map(),
      }
      current.boxes += row.boxes
      current.available += stockAvailable(row)
      current.products.add(row.product)
      current.lots.add(row.lot)
      current.rows.push(row)
      const product = current.productRows.get(row.product) || {
        name: row.product,
        boxes: 0,
        available: 0,
        lots: new Set(),
        rows: [],
      }
      product.boxes += row.boxes
      product.available += stockAvailable(row)
      product.lots.add(row.lot)
      product.rows.push(row)
      current.productRows.set(row.product, product)
      groups.set(row.brand, current)
    })
    return [...groups.values()].map((group) => ({
      ...group,
      products: [...group.products],
      lots: [...group.lots],
      rows: group.rows.sort((left, right) =>
        `${left.product}${left.caliber}${left.lot}`.localeCompare(
          `${right.product}${right.caliber}${right.lot}`,
          'es',
        ),
      ),
      productGroups: [...group.productRows.values()].map((product) => ({
        ...product,
        lots: [...product.lots],
        rows: product.rows.sort((left, right) =>
          `${left.caliber}${left.lot}`.localeCompare(`${right.caliber}${right.lot}`, 'es'),
        ),
      })),
    }))
  })
  const stockOptions = computed(() =>
    stockRows.value.map((row) => ({
      label: `${row.brand} · ${row.caliber} · Lote ${row.lot} · ${number(stockAvailable(row, activeLoad.value?.id))} disp.`,
      value: row.id,
    })),
  )
  const producedMerchandiseOptions = computed(() => {
    const merchandise = new Map()
    stockRows.value.forEach((row) => {
      if (stockAvailable(row) <= 0) return
      const value = merchandiseKeyFor(row)
      const current = merchandise.get(value) || {
        value,
        brand: row.brand,
        product: row.product,
        boxes: 0,
        calibers: new Set(),
      }
      current.boxes += stockAvailable(row)
      current.calibers.add(row.caliber)
      merchandise.set(value, current)
    })
    return [...merchandise.values()]
      .sort((left, right) =>
        `${left.brand} ${left.product}`.localeCompare(`${right.brand} ${right.product}`, 'es'),
      )
      .map((item) => ({
        value: item.value,
        label: `${item.brand} · ${item.product} · ${number(item.boxes)} cajas disponibles`,
      }))
  })
  const transferStockOptions = computed(() =>
    stockRows.value.map((row) => ({
      label: `${row.brand} · ${row.caliber} · Lote ${row.lot} · ${number(stockAvailable(row))} disp.`,
      value: row.id,
    })),
  )
  const activeOrders = computed(() =>
    activeLoad.value
      ? activeLoad.value.orderIds
          .map((id) => orders.value.find((order) => order.id === id))
          .filter(Boolean)
      : [],
  )
  const activeAllocationRows = computed(() =>
    activeOrders.value.flatMap((order) =>
      order.lines.map((line) => ({
        key: allocationKey(order, line),
        order,
        line,
        allocation: allocationFor(order, line),
      })),
    ),
  )
  const selectedLoadOrders = computed(() =>
    loadForm.orderIds
      .map((id) => {
        const order = orders.value.find((item) => item.id === id)
        return order ? { order, detail: loadOrderDetail(id) } : null
      })
      .filter(Boolean)
      .sort(
        (left, right) =>
          loadPositionOrder[left.detail.position] - loadPositionOrder[right.detail.position],
      ),
  )
  const loadFormWeightKg = computed(() =>
    selectedLoadOrders.value.reduce((total, item) => total + Number(item.detail.weightKg || 0), 0),
  )
  const loadWeightPercent = computed(() =>
    Math.min(100, Math.round((loadFormWeightKg.value / Number(loadForm.capacityKg || 1)) * 100)),
  )
  const repartoPreviewNumber = computed(
    () => `REP-${String(loads.value.length + 1).padStart(3, '0')}`,
  )

  watch(orders, (value) => localStorage.setItem(ordersKey, JSON.stringify(value)), { deep: true })
  watch(loads, (value) => localStorage.setItem(loadsKey, JSON.stringify(value)), { deep: true })
  watch(
    warehouseTransfers,
    (value) => localStorage.setItem(warehouseTransfersKey, JSON.stringify(value)),
    {
      deep: true,
    },
  )
  watch(
    () => [route.path, route.query.action],
    () => {
      if (showOrderFormPage.value) Object.assign(orderForm, emptyOrderForm())
      if (showLoadFormPage.value) Object.assign(loadForm, emptyLoadForm())
    },
    { immediate: true },
  )

  function loadArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  function emptyOrderLine() {
    return {
      id: createId(),
      merchandiseKey: '',
      brand: '',
      product: '',
      article: '',
      description: '',
      caliber: '',
      quantity: 1,
    }
  }
  function emptyWarehouseTransfer() {
    return {
      stockRowId: '',
      quantity: 0,
      originWarehouse: '',
      originLocation: '',
      destinationWarehouse: '',
      destinationLocation: '',
    }
  }
  function lineLabel(line) {
    if (line.brand || line.product) return [line.brand, line.product].filter(Boolean).join(' · ')
    return (
      line.description?.trim() ||
      (line.article ? `Artículo ${line.article}` : 'Mercadería sin definir')
    )
  }
  function merchandiseKeyFor(row) {
    return `${row.brand}::${row.product}`
  }
  function merchandiseForLine(line) {
    return stockRows.value.filter(
      (row) => merchandiseKeyFor(row) === line.merchandiseKey && stockAvailable(row) > 0,
    )
  }
  function requestedInOtherOrderLines(line, caliber) {
    return orderForm.lines
      .filter(
        (candidate) =>
          candidate.id !== line.id &&
          candidate.merchandiseKey === line.merchandiseKey &&
          candidate.caliber === caliber,
      )
      .reduce((total, candidate) => total + Math.max(0, Number(candidate.quantity || 0)), 0)
  }
  function availableForOrderLine(line) {
    if (!line.merchandiseKey || !line.caliber) return 0
    const producedAvailable = merchandiseForLine(line)
      .filter((row) => row.caliber === line.caliber)
      .reduce((total, row) => total + stockAvailable(row), 0)
    return Math.max(0, producedAvailable - requestedInOtherOrderLines(line, line.caliber))
  }
  function caliberOptionsForLine(line) {
    return [...new Set(merchandiseForLine(line).map((row) => row.caliber))]
      .sort((left, right) => Number(left) - Number(right))
      .map((caliber) => {
        const producedAvailable = merchandiseForLine(line)
          .filter((row) => row.caliber === caliber)
          .reduce((total, row) => total + stockAvailable(row), 0)
        const available = Math.max(0, producedAvailable - requestedInOtherOrderLines(line, caliber))
        return {
          value: caliber,
          label: `Calibre ${caliber} · ${number(available)} cajas disponibles`,
        }
      })
      .filter((option) => option.value === line.caliber || !option.label.includes('· 0 cajas'))
  }
  function stockOptionsForLine(line) {
    return merchandiseForLine(line)
      .filter((row) => row.caliber === line.caliber)
      .map((row) => ({
        value: row.id,
        label: `${row.brand} · ${row.caliber} · Lote ${row.lot} · ${number(stockAvailable(row, activeLoad.value?.id))} disp.`,
      }))
  }
  function selectOrderMerchandise(line) {
    const source = merchandiseForLine(line)[0]
    line.brand = source?.brand || ''
    line.product = source?.product || ''
    const calibers = caliberOptionsForLine(line)
    if (!calibers.some((option) => option.value === line.caliber))
      line.caliber = calibers[0]?.value || ''
  }
  function updateOrderLineQuantity(line, value) {
    line.quantity = Math.min(Math.max(0, Number(value || 0)), availableForOrderLine(line))
  }
  function normalizeLoad(load) {
    return {
      ...load,
      truckType: load.truckType || 'Semi',
      capacityKg: Number(load.capacityKg || truckCapacityFor(load.truckType || 'Semi')),
      driver: load.driver || '',
      orderDetails: load.orderDetails || {},
      allocations: load.allocations || {},
      loading: { start: '', end: '', pallets: 0, responsible: '', ...(load.loading || {}) },
      dispatch: load.dispatch || {},
    }
  }
  function removeDemoReferences(savedLoads, demoIds) {
    if (!demoIds.size) return savedLoads
    return savedLoads
      .map((load) => ({
        ...load,
        orderIds: (load.orderIds || []).filter((orderId) => !demoIds.has(orderId)),
        allocations: Object.fromEntries(
          Object.entries(load.allocations || {}).filter(
            ([key]) => ![...demoIds].some((orderId) => key.startsWith(`${orderId}:`)),
          ),
        ),
        dispatch: Object.fromEntries(
          Object.entries(load.dispatch || {}).filter(([orderId]) => !demoIds.has(orderId)),
        ),
      }))
      .filter((load) => load.orderIds.length)
  }
  function openOrderForm() {
    router.push('/expedicion/pedidos/nuevo')
  }
  function addOrderLine() {
    orderForm.lines.push(emptyOrderLine())
  }
  function removeOrderLine(index) {
    if (orderForm.lines.length > 1) orderForm.lines.splice(index, 1)
  }
  function saveOrder() {
    if (!orderForm.documentNumber.trim() || !orderForm.client.trim())
      return showFeedback('Completa documento y cliente', 'error')
    if (
      orderForm.lines.some(
        (line) =>
          !line.merchandiseKey ||
          !line.caliber ||
          !caliberOptionsForLine(line).some((option) => option.value === line.caliber) ||
          Number(line.quantity || 0) <= 0 ||
          Number(line.quantity || 0) > availableForOrderLine(line),
      )
    )
      return showFeedback(
        'Selecciona mercadería producida, calibre disponible y una cantidad válida',
        'error',
      )
    orders.value.unshift({
      ...clone(orderForm),
      id: createId(),
      createdAt: new Date().toISOString(),
    })
    showFeedback('Pedido disponible para Expedición')
    goToOrders()
  }
  function orderBoxes(order) {
    return (order.lines || []).reduce(
      (sum, line) => sum + Math.max(0, Number(line.quantity || 0)),
      0,
    )
  }
  function orderStatusKey(order) {
    const load = loads.value.find((item) => item.orderIds.includes(order.id))
    return !load ? 'pending' : load.status === 'dispatched' ? 'dispatched' : 'assigned'
  }
  function orderStatus(order) {
    return { pending: 'Pendiente', assigned: 'Asignado a carga', dispatched: 'Despachado' }[
      orderStatusKey(order)
    ]
  }
  function orderStatusClass(order) {
    return { pending: 'status-warning', assigned: 'status-active', dispatched: 'status-success' }[
      orderStatusKey(order)
    ]
  }
  function isStockBrandOpen(brand) {
    return expandedStockBrands.value.has(brand)
  }
  function toggleStockBrand(brand) {
    const next = new Set(expandedStockBrands.value)
    if (next.has(brand)) next.delete(brand)
    else next.add(brand)
    expandedStockBrands.value = next
  }
  function openWarehouseTransfer() {
    Object.assign(stockTransferForm, emptyWarehouseTransfer())
    stockTransferDialog.value = true
  }
  function saveWarehouseTransfer() {
    const stockRow = stockRows.value.find((row) => row.id === stockTransferForm.stockRowId)
    const quantity = Number(stockTransferForm.quantity || 0)
    if (
      !stockRow ||
      quantity <= 0 ||
      !stockTransferForm.originWarehouse.trim() ||
      !stockTransferForm.destinationWarehouse.trim()
    )
      return showFeedback('Completa lote, almacén origen, almacén destino y cantidad', 'error')
    if (quantity > stockAvailable(stockRow))
      return showFeedback('La cantidad supera el stock disponible del lote', 'error')

    warehouseTransfers.value.unshift({
      id: createId(),
      stockRowId: stockRow.id,
      stockLabel: stockLabel(stockRow.id),
      quantity,
      originWarehouse: stockTransferForm.originWarehouse.trim(),
      originLocation: stockTransferForm.originLocation.trim(),
      destinationWarehouse: stockTransferForm.destinationWarehouse.trim(),
      destinationLocation: stockTransferForm.destinationLocation.trim(),
      createdAt: new Date().toISOString(),
    })
    stockTransferDialog.value = false
    showFeedback('Movimiento entre almacenes registrado')
  }
  function transferOrigin(movement) {
    return [movement.originWarehouse, movement.originLocation].filter(Boolean).join(' / ') || '-'
  }
  function transferDestination(movement) {
    return (
      [movement.destinationWarehouse, movement.destinationLocation].filter(Boolean).join(' / ') ||
      '-'
    )
  }
  function openLoadDialog() {
    router.push('/expedicion/repartos/nuevo')
  }
  function createLoad() {
    if (!loadForm.orderIds.length) return showFeedback('Selecciona al menos un pedido', 'error')
    if (!loadForm.plate.trim() || !loadForm.driver.trim())
      return showFeedback('Completa patente y chofer', 'error')
    if (loadFormWeightKg.value <= 0)
      return showFeedback('Informa los kilos de cada pedido', 'error')
    if (loadFormWeightKg.value > Number(loadForm.capacityKg || 0))
      return showFeedback('La carga supera la capacidad del camión', 'error')
    const invalidOrder = selectedLoadOrders.value.find(({ order }) =>
      (order.lines || []).some((line) => {
        const requested = Number(line.quantity || 0)
        return requested <= 0 || requested > availableForStoredOrderLine(order, line)
      }),
    )
    if (invalidOrder)
      return showFeedback(
        `El pedido ${invalidOrder.order.documentNumber} supera el stock disponible. Corrígelo antes de crear el reparto.`,
        'error',
      )
    const sequence = loads.value.length + 1
    const load = normalizeLoad({
      id: createId(),
      code: `CARGA-${String(sequence).padStart(3, '0')}`,
      ...clone(loadForm),
      orderIds: selectedLoadOrders.value.map((item) => item.order.id),
      orderDetails: Object.fromEntries(
        selectedLoadOrders.value.map((item) => [item.order.id, clone(item.detail)]),
      ),
      status: 'preparing',
      createdAt: new Date().toISOString(),
    })
    load.orderIds.forEach((orderId) =>
      orders.value
        .find((order) => order.id === orderId)
        ?.lines.forEach((line) => {
          load.allocations[`${orderId}:${line.id}`] = {
            stockRowId: '',
            planned: Number(line.quantity || 0),
            loaded: 0,
          }
        }),
    )
    loads.value.push(load)
    openLoad(load)
  }
  function openLoad(load) {
    router.push({ path: '/expedicion/repartos', query: { load: load.id, step: nextStep(load) } })
  }
  function goToLoads() {
    router.push('/expedicion/repartos')
  }
  function goToOrders() {
    router.push('/expedicion/pedidos')
  }
  function nextStep(load) {
    if (load.status === 'dispatched' || load.status === 'documented') return 'documentacion'
    if (load.status === 'loaded') return 'documentacion'
    if (load.status === 'ready' || load.status === 'loading') return 'romaneo'
    return 'detalle'
  }
  function loadStatusLabel(status) {
    return (
      {
        preparing: 'En preparación',
        ready: 'Lista para cargar',
        loading: 'En carga',
        loaded: 'Cargada',
        documented: 'Documentada',
        dispatched: 'Despachada',
      }[status] || 'Borrador'
    )
  }
  function loadStatusClass(status) {
    return status === 'dispatched'
      ? 'status-success'
      : status === 'loaded' || status === 'ready' || status === 'documented'
        ? 'status-active'
        : 'status-warning'
  }
  function loadClients(load) {
    return load.orderIds
      .map((id) => orders.value.find((order) => order.id === id)?.client)
      .filter(Boolean)
  }
  function loadDestinations(load) {
    return [
      ...new Set(
        load.orderIds
          .map((id) => orders.value.find((order) => order.id === id)?.destination)
          .filter(Boolean),
      ),
    ]
  }
  function loadRequestedBoxes(load) {
    return load.orderIds.reduce((sum, orderId) => {
      const order = orders.value.find((item) => item.id === orderId)
      return sum + (order ? orderBoxes(order) : 0)
    }, 0)
  }
  function repartoNumber(load) {
    return load.code?.replace(/^CARGA-/, 'REP-') || '-'
  }
  function truckCapacityFor(type) {
    return type === 'Balancín' ? 12000 : 24000
  }
  function updateTruckCapacity(type) {
    loadForm.capacityKg = truckCapacityFor(type)
  }
  function loadOrderDetail(orderId) {
    if (!loadForm.orderDetails[orderId]) {
      loadForm.orderDetails[orderId] = {
        position: 'centro',
        weightKg: 0,
      }
    }
    return loadForm.orderDetails[orderId]
  }
  function loadPositionLabel(position) {
    return (
      loadPositionOptions
        .find((option) => option.value === position)
        ?.label.replace(' - ', ' - ') || 'Centro'
    )
  }
  function allocationKey(order, line) {
    return `${order.id}:${line.id}`
  }
  function allocationFor(order, line) {
    const key = allocationKey(order, line)
    if (!activeLoad.value.allocations[key])
      activeLoad.value.allocations[key] = {
        stockRowId: '',
        planned: Number(line.quantity || 0),
        loaded: 0,
      }
    return activeLoad.value.allocations[key]
  }
  function lineMerchandiseKey(line) {
    return line.merchandiseKey || `${line.brand || ''}::${line.product || ''}`
  }
  function availableForStoredOrderLine(order, line) {
    const available = stockRows.value
      .filter(
        (row) =>
          merchandiseKeyFor(row) === lineMerchandiseKey(line) &&
          row.caliber === String(line.caliber),
      )
      .reduce((total, row) => total + stockAvailable(row), 0)
    const requestedInOrder = (order.lines || [])
      .filter(
        (candidate) =>
          candidate.id !== line.id &&
          lineMerchandiseKey(candidate) === lineMerchandiseKey(line) &&
          String(candidate.caliber) === String(line.caliber),
      )
      .reduce((total, candidate) => total + Math.max(0, Number(candidate.quantity || 0)), 0)
    return Math.max(0, available - requestedInOrder)
  }
  function availableForAllocation(order, line) {
    const allocation = allocationFor(order, line)
    const stockRow = stockRows.value.find((row) => row.id === allocation.stockRowId)
    if (!stockRow) return 0
    const usedByOtherLines = activeAllocationRows.value
      .filter((item) => item.key !== allocationKey(order, line))
      .filter((item) => item.allocation.stockRowId === stockRow.id)
      .reduce((total, item) => total + Math.max(0, Number(item.allocation.planned || 0)), 0)
    return Math.max(0, stockAvailable(stockRow, activeLoad.value.id) - usedByOtherLines)
  }
  function selectAllocationStock(order, line) {
    const allocation = allocationFor(order, line)
    const maximum = availableForAllocation(order, line)
    allocation.planned = Math.min(Math.max(0, Number(allocation.planned || 0)), maximum)
    allocation.loaded = Math.min(Math.max(0, Number(allocation.loaded || 0)), maximum)
  }
  function updateAllocationPlanned(order, line, value) {
    const allocation = allocationFor(order, line)
    allocation.planned = Math.min(
      Math.max(0, Number(value || 0)),
      availableForAllocation(order, line),
    )
    allocation.loaded = Math.min(Number(allocation.loaded || 0), allocation.planned)
  }
  function reservedForStock(stockRowId, excludedLoadId = null) {
    return loads.value
      .filter((load) => load.status !== 'dispatched' && load.id !== excludedLoadId)
      .reduce(
        (sum, load) =>
          sum +
          Object.values(load.allocations || {})
            .filter((item) => item.stockRowId === stockRowId)
            .reduce((part, item) => part + Number(item.planned || 0), 0),
        0,
      )
  }
  function dispatchedForStock(stockRowId, excludedLoadId = null) {
    return loads.value
      .filter((load) => load.status === 'dispatched' && load.id !== excludedLoadId)
      .reduce(
        (sum, load) =>
          sum +
          Object.values(load.allocations || {})
            .filter((item) => item.stockRowId === stockRowId)
            .reduce((part, item) => part + Math.max(0, Number(item.loaded || 0)), 0),
        0,
      )
  }
  function stockAvailable(row, excludedLoadId = null) {
    return row
      ? Math.max(
          0,
          row.boxes -
            reservedForStock(row.id, excludedLoadId) -
            dispatchedForStock(row.id, excludedLoadId),
        )
      : 0
  }
  function stockLabel(stockRowId) {
    const row = stockRows.value.find((item) => item.id === stockRowId)
    return row ? `${row.brand} · ${row.caliber} · Lote ${row.lot}` : 'Sin lote asociado'
  }
  function confirmPreparation() {
    const rows = activeAllocationRows.value
    if (
      !rows.length ||
      rows.some(({ allocation }) => !allocation.stockRowId || Number(allocation.planned || 0) <= 0)
    )
      return showFeedback('Asocia lote y cantidad en todos los renglones', 'error')
    const requestedByStock = rows.reduce(
      (totals, { allocation }) => ({
        ...totals,
        [allocation.stockRowId]:
          (totals[allocation.stockRowId] || 0) + Number(allocation.planned || 0),
      }),
      {},
    )
    const invalid = Object.entries(requestedByStock).some(
      ([stockRowId, requested]) =>
        requested >
        stockAvailable(
          stockRows.value.find((row) => row.id === stockRowId),
          activeLoad.value.id,
        ),
    )
    if (invalid) return showFeedback('La reserva supera el stock del lote seleccionado', 'error')
    activeLoad.value.status = 'ready'
    goToLoadStep('romaneo')
    showFeedback('Carga lista para romaneo')
  }
  function copyPlannedToLoaded() {
    activeAllocationRows.value.forEach(({ allocation }) => {
      allocation.loaded = Number(allocation.planned || 0)
    })
    showFeedback('Cantidades planificadas copiadas')
  }
  function confirmLoading() {
    if (!activeLoad.value.loading.responsible.trim())
      return showFeedback('Informa el responsable de carga', 'error')
    if (activeAllocationRows.value.every(({ allocation }) => Number(allocation.loaded || 0) <= 0))
      return showFeedback('Informa las cantidades cargadas', 'error')
    activeLoad.value.status = 'loaded'
    activeOrders.value.forEach((order) => dispatchFor(order))
    goToLoadStep('documentacion')
    showFeedback('Romaneo confirmado')
  }
  function dispatchFor(order) {
    if (!activeLoad.value.dispatch[order.id])
      activeLoad.value.dispatch[order.id] = {
        remito: '',
        mode: dmfEligible(order) ? 'dmf' : 'delivery',
      }
    return activeLoad.value.dispatch[order.id]
  }
  function dmfEligible(order) {
    return /coqui|fason/i.test(`${order.client} ${order.destination}`)
  }
  function dispatchOptions(order) {
    const options = [{ label: 'Entrega / remito interno', value: 'delivery' }]
    if (dmfEligible(order)) options.push({ label: 'DMF · Despacho Mercadería Fason', value: 'dmf' })
    return options
  }
  function confirmDocumentation() {
    if (activeOrders.value.some((order) => !dispatchFor(order).remito.trim()))
      return showFeedback('Completa el remito de cada cliente', 'error')
    activeLoad.value.status = 'dispatched'
    activeLoad.value.dispatchedAt = new Date().toISOString()
    showFeedback('Salida confirmada')
  }
  function loadedForOrder(orderId) {
    return activeAllocationRows.value
      .filter((item) => item.order.id === orderId)
      .reduce((sum, item) => sum + Number(item.allocation.loaded || 0), 0)
  }
  function loadLoadedBoxes(load) {
    return Object.values(load.allocations || {}).reduce(
      (sum, item) => sum + Number(item.loaded || 0),
      0,
    )
  }
  function canOpenLoadStep(step) {
    if (!activeLoad.value) return false
    if (step === 'detalle') return true
    if (step === 'romaneo')
      return ['ready', 'loading', 'loaded', 'documented', 'dispatched'].includes(
        activeLoad.value.status,
      )
    if (step === 'documentacion')
      return ['loaded', 'documented', 'dispatched'].includes(activeLoad.value.status)
    return false
  }
  function loadStepDone(step) {
    if (step === 'detalle')
      return ['ready', 'loading', 'loaded', 'documented', 'dispatched'].includes(
        activeLoad.value?.status,
      )
    if (step === 'romaneo')
      return ['loaded', 'documented', 'dispatched'].includes(activeLoad.value?.status)
    if (step === 'documentacion') return activeLoad.value?.status === 'dispatched'
    return false
  }
  function goToLoadStep(step) {
    router.push({ path: '/expedicion/repartos', query: { load: activeLoad.value.id, step } })
  }
  function number(value) {
    return Math.max(0, Number(value || 0)).toLocaleString('es-AR')
  }
  function clone(value) {
    return JSON.parse(JSON.stringify(value))
  }
  function dateTime(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  }
  function showFeedback(message, type = 'success') {
    feedback.message = message
    feedback.type = type
    window.setTimeout(() => {
      feedback.message = ''
    }, 3000)
  }

  return {
    orderForm,
    loadForm,
    stockTransferForm,
    stockTransferDialog,
    feedback,
    loadSteps,
    orderColumns,
    stockColumns,
    loadColumns,
    movementColumns,
    showOrderFormPage,
    showLoadFormPage,
    activeLoad,
    currentLoadStep,
    pendingOrders,
    filteredOrders,
    filteredLoads,
    stockRows,
    dailyStockGroups,
    stockOptions,
    transferStockOptions,
    warehouseTransfers,
    activeOrders,
    activeAllocationRows,
    selectedLoadOrders,
    loadFormWeightKg,
    loadWeightPercent,
    repartoPreviewNumber,
    producedMerchandiseOptions,
    truckTypeOptions,
    loadPositionOptions,
    openOrderForm,
    addOrderLine,
    removeOrderLine,
    selectOrderMerchandise,
    caliberOptionsForLine,
    availableForOrderLine,
    updateOrderLineQuantity,
    stockOptionsForLine,
    stockAvailable,
    availableForAllocation,
    selectAllocationStock,
    updateAllocationPlanned,
    saveOrder,
    orderBoxes,
    orderStatus,
    orderStatusClass,
    isStockBrandOpen,
    toggleStockBrand,
    openWarehouseTransfer,
    saveWarehouseTransfer,
    transferOrigin,
    transferDestination,
    openLoadDialog,
    createLoad,
    openLoad,
    goToLoads,
    goToOrders,
    goToLoadStep,
    canOpenLoadStep,
    loadStepDone,
    loadStatusLabel,
    loadStatusClass,
    loadClients,
    loadDestinations,
    loadRequestedBoxes,
    repartoNumber,
    updateTruckCapacity,
    loadPositionLabel,
    lineLabel,
    stockLabel,
    confirmPreparation,
    copyPlannedToLoaded,
    confirmLoading,
    dispatchFor,
    dispatchOptions,
    confirmDocumentation,
    loadedForOrder,
    loadLoadedBoxes,
    number,
    dateTime,
  }
}
