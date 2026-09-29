const DAY_MS = 24 * 60 * 60 * 1000

export function todayISO() {
  return toISODate(new Date())
}

export function toISODate(date) {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

export function daysBetween(startISO, endISO = todayISO()) {
  if (!startISO) return 0
  const start = new Date(`${startISO}T00:00:00`)
  const end = new Date(`${endISO}T00:00:00`)
  return Math.floor((end - start) / DAY_MS)
}

export function monthOf(dateISO) {
  return dateISO?.slice(0, 7) || ''
}

export function formatDate(dateISO) {
  if (!dateISO) return '未记录'
  return dateISO.replaceAll('-', '/')
}
