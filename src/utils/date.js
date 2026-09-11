export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function isValidIsoDate(value) {
  const date = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false

  const parsed = new Date(`${date}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

export function dateFromQuery(value, fallback = todayIsoDate()) {
  return isValidIsoDate(value) ? value : fallback
}

export function dateRangeFromQuery(query = {}, fallback = todayIsoDate()) {
  const exact = query.fecha ?? query.date
  const desde = dateFromQuery(query.desde ?? exact, fallback)
  const hasta = dateFromQuery(query.hasta ?? exact, desde)
  return isValidDateRange(desde, hasta) ? { desde, hasta } : { desde: fallback, hasta: fallback }
}

export function isValidDateRange(desde, hasta) {
  return isValidIsoDate(desde) && isValidIsoDate(hasta) && desde <= hasta
}

export function isSingleDateRange(range) {
  return Boolean(range?.desde && range?.desde === range?.hasta)
}

export function dateInRange(value, range) {
  const date = String(value || '').slice(0, 10)
  return Boolean(date && range?.desde && range?.hasta && date >= range.desde && date <= range.hasta)
}

export function dateQuery(range) {
  const params = new URLSearchParams()
  if (typeof range === 'string') {
    if (range) params.set('fecha', range)
  } else {
    if (range?.desde) params.set('desde', range.desde)
    if (range?.hasta) params.set('hasta', range.hasta)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
