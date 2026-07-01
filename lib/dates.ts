const MS_PER_DAY = 86_400_000

/**
 * How many whole days have elapsed since `isoDate`.
 * Returns `null` when the input is null/undefined.
 */
export function daysSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null
  return (Date.now() - new Date(isoDate).getTime()) / MS_PER_DAY
}

/**
 * How many whole days remain until `isoDate`.
 * Negative values mean the date is in the past.
 */
export function daysUntil(isoDate: string): number {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / MS_PER_DAY)
}

/**
 * How many days since a Date object.
 * Used by Gmail relationship intelligence which works with Date objects.
 */
export function daysSinceDate(date: Date): number {
  return (Date.now() - date.getTime()) / MS_PER_DAY
}

/** Clamp a value to [min, max] and round to integer. */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}
