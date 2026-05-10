const DEFAULT_TIME_ZONE = 'Asia/Kolkata'

/**
 * Formats a Date object as a YYYY-MM-DD string in the app timezone.
 * Avoids UTC offset issues with toISOString() and deployment server timezone drift.
 */
export function formatDateKey(
  date: Date,
  timeZone = process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? DEFAULT_TIME_ZONE
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Returns today's date as a YYYY-MM-DD string in the app timezone. */
export function todayDateKey(): string {
  return formatDateKey(new Date())
}

/**
 * Adds (or subtracts) `days` to a YYYY-MM-DD string and returns the result.
 * e.g. addDaysToDateKey('2025-05-01', -6) -> '2025-04-25'
 */
export function addDaysToDateKey(
  dateStr: string,
  days: number,
  timeZone = process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? DEFAULT_TIME_ZONE
): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return formatDateKey(d, timeZone)
}

/**
 * Returns an array of 7 YYYY-MM-DD strings ending at `todayStr`, oldest first.
 * e.g. lastSevenDateKeys('2025-05-10') -> ['2025-05-04', ..., '2025-05-10']
 */
export function lastSevenDateKeys(todayStr = todayDateKey()): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToDateKey(todayStr, i - 6))
}
