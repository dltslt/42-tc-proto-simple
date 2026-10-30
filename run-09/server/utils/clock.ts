// Seed timestamps are written relative to this base day. A read that wants
// "today" shifts them by (today - base). Run day 2026-10-30 = base, shift 0.
const SEED_BASE = Date.parse('2026-10-30T00:00:00Z')

export function shiftMs(): number {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return today.getTime() - SEED_BASE
}

/** Turn a stored ISO time into "as seen today". Empty stays empty. */
export function shifted(iso: string): string {
  if (!iso) return ''
  return new Date(Date.parse(iso) + shiftMs()).toISOString()
}

/** Turn a "today" time back into the stored time scale (for SQL comparisons). */
export function unshifted(ms: number): string {
  return new Date(ms - shiftMs()).toISOString()
}
