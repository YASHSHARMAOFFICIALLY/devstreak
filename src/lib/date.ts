const DEFAULT_TIME_ZONE = 'Asia/Kolkata'

export function formatDateKey(date: Date, timeZone = process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function todayDateKey() {
  return formatDateKey(new Date())
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

export function lastSevenDateKeys(endDateKey = todayDateKey()) {
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(endDateKey, index - 6))
}
