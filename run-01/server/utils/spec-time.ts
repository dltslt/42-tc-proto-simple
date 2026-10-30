// Timestamps live on the seed's fictional calendar, whose "today" is
// 2026-10-30 (the AGENTS.md database rule). Real wall-clock time is somewhere
// else, so every stored time is shifted by the gap between the two:
//
//   read:  stored (seed calendar)  ->  displayed (real calendar)
//   write: real now                ->  stored (seed calendar)
//
// The offset is fixed once per server start. A server that runs for hours
// drifts by hours against the seed calendar — irrelevant for a prototype, and
// it keeps the arithmetic to one constant.

// The moment the seed calls "today".
const SPEC_TODAY_MS = Date.parse('2026-10-30T00:00:00Z')

// Gap between the seed calendar and the real one, in milliseconds.
const OFFSET_MS = SPEC_TODAY_MS - Date.now()

// Real now -> a stored time just after the newest seed event, so new items
// sort above everything the seed wrote.
export function toSpecTime(realNow: number): string {
  return new Date(realNow + OFFSET_MS).toISOString()
}

// Stored time -> the time shown in the interface, back on the real calendar.
export function toRealTime(storedIso: string): string {
  return new Date(Date.parse(storedIso) - OFFSET_MS).toISOString()
}
