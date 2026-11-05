export function commas(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function price(p) {
  if (typeof p !== 'number' || isNaN(p)) return '--'
  let d
  if (p >= 10000) d = 0
  else if (p >= 100) d = 2
  else if (p >= 1) d = 3
  else if (p >= 0.01) d = 4
  else d = 7
  const parts = p.toFixed(d).split('.')
  return '$' + commas(parts[0]) + (parts[1] ? '.' + parts[1] : '')
}

export function compact(v) {
  if (typeof v !== 'number' || isNaN(v)) return '--'
  const a = Math.abs(v)
  if (a >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T'
  if (a >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B'
  if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  return '$' + commas(Math.round(v).toString())
}

export function pct(v) {
  if (typeof v !== 'number' || isNaN(v)) return '--'
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}

export function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

export function hhmm(t) {
  const d = new Date(t)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}
