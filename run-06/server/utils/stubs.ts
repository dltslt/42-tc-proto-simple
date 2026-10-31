// Product stubs kept in one named place as specified in AGENTS.md

import { getDb } from './db'

export interface Actor {
  id: string
  name: string
  kind: string
  spaces: string
}

// Stub 1: Policy check can(actor, action, resource)
// Allows everything by default unless a specific brief rule specifies otherwise
export function can(actorId: string, action: string, resource: string): boolean {
  return true
}

// Stub 2: Ordering of "what to show next"
// Strategy: In-progress ('started') first, then backlog ('unstarted'), then 'done', sub-ordered by id
export function getTaskOrderSql(): string {
  return `ORDER BY 
    CASE state 
      WHEN 'started' THEN 1 
      WHEN 'unstarted' THEN 2 
      WHEN 'done' THEN 3 
      ELSE 4 
    END, 
    id ASC`
}

// Stub 3: Where a new item goes before it has a column (default: the first unstarted column)
export function getDefaultColumn(spaceId: string): { name: string; state: string } {
  const db = getDb()
  const stmt = db.prepare(
    "SELECT name, state FROM columns WHERE space = ? AND state = 'unstarted' ORDER BY position ASC LIMIT 1"
  )
  const row = stmt.get(spaceId) as { name: string; state: string } | undefined
  if (row) {
    return row
  }
  return { name: 'backlog', state: 'unstarted' }
}

// Identity stub: reads current actor id from request header or cookie
export function getCurrentActor(event: any): string {
  const header = getHeader(event, 'x-lerch-actor')
  const cookie = getCookie(event, 'lerch_actor')
  return header || cookie || 'actor-1'
}
