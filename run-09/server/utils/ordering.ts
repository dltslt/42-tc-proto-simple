// Product stub: the ordering of "what to show next". The spec has no rule
// (OPEN). This run uses "started first, soonest scheduled, smallest effort".
// It is an SQL ORDER BY fragment for the `tasks` table.
export const NEXT_ORDERING_NAME = 'started first, then soonest scheduled, then smallest effort'

export const NEXT_ORDER_BY = `
  CASE state WHEN 'started' THEN 0 ELSE 1 END,
  CASE WHEN scheduled_time = '' THEN 1 ELSE 0 END,
  scheduled_time,
  CAST(effort AS REAL)`
