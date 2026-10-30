// Item queries and writes shared by the routes. Keeping them here means the
// routes stay thin and the state rule lives in exactly one place.
import { randomUUID } from 'node:crypto'
import { all, get, run } from './db'
import { toSpecTime } from './spec-time'

export interface ItemRow {
  id: string
  space: string
  level: string
  title: string
  parent_id: string
  kanban: string
  state: string
  lead: string
  contributors: string
  description: string
  effort: string
  scheduled_time: string
}

export function shapeItem(
  row: ItemRow & { columnState: string },
  tags: { id: string, name: string }[],
) {
  return {
    id: row.id,
    space: row.space,
    level: row.level,
    title: row.title,
    kanban: row.kanban,
    // The state is always derived from the column here, on read. That is what
    // makes the "state follows the column" rule impossible to break: the two
    // cannot disagree, because only the column is believed.
    state: row.columnState,
    lead: row.lead,
    contributors: row.contributors ? row.contributors.split(';') : [],
    description: row.description,
    effort: row.effort,
    tags,
  }
}

// The space's items, newest created first (the ordering experiment named in
// server/utils/stubs.ts). The created time is the item's first event.
export async function listItems(space: string) {
  return await all(`
    SELECT t.*, c.state AS columnState,
           (SELECT e.at FROM events e
             WHERE e.item_id = t.id AND e.kind = 'created'
             ORDER BY e.at DESC LIMIT 1) AS createdAt
    FROM tasks t
    JOIN columns c ON c.space = t.space AND c.name = t.kanban
    WHERE t.space = ?
    ORDER BY createdAt DESC, t.id DESC
  `, [space])
}

export async function itemTags(itemId: string) {
  return await all<{ id: string, name: string }>(`
    SELECT g.id, g.name
    FROM item_tags it JOIN tags g ON g.id = it.tag_id
    WHERE it.item_id = ?
    ORDER BY g.name
  `, [itemId])
}

// The first column of a space whose `state` matches, in `position` order.
// Used both for new items (first `unstarted` column, the stub) and for the
// close gesture (first `done` column).
export async function firstColumnOfState(space: string, state: string) {
  return await get<{ name: string, state: string }>(
    'SELECT name, state FROM columns WHERE space = ? AND state = ? ORDER BY position LIMIT 1',
    [space, state],
  )
}

// Every event write goes through here, so every action that changes an item
// is logged exactly once. `at` is stored on the seed's calendar (spec-time).
export async function appendEvent(itemId: string, actorId: string, kind: string, detail: string) {
  await run(
    'INSERT INTO events (id, item_id, at, actor_id, kind, detail) VALUES (?, ?, ?, ?, ?, ?)',
    [`event-${randomUUID()}`, itemId, toSpecTime(Date.now()), actorId, kind, detail],
  )
}
