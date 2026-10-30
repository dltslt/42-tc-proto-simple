// Files in server/utils/ are auto-imported into every server route by Nitro.
// This module is the one place that knows how items are read from SQLite.

/** One item as the client sees it: a tasks row plus its tag names. */
export interface Item {
  id: string
  space: string
  level: string
  title: string
  parent_id: string
  kanban: string
  state: string
  lead: string
  contributors: string[]
  effort: number | null
  scheduled_time: string // ISO string, or '' when not scheduled
  tags: string[]
}

// useDatabase() is a Nitro auto-import (db0). It returns the "default"
// connection configured in nuxt.config.ts.
export const db = () => useDatabase()

const ITEM_SQL = `
  SELECT t.*, COALESCE(GROUP_CONCAT(g.name, ';'), '') AS tag_names
  FROM tasks t
  LEFT JOIN item_tags it ON it.item_id = t.id
  LEFT JOIN tags g ON g.id = it.tag_id`

/** Turns the raw TEXT columns into typed fields. */
function toItem(row: any): Item {
  return {
    id: row.id,
    space: row.space,
    level: row.level,
    title: row.title,
    parent_id: row.parent_id,
    kanban: row.kanban,
    state: row.state,
    lead: row.lead,
    contributors: row.contributors ? row.contributors.split(';') : [],
    effort: row.effort === '' ? null : Number(row.effort),
    scheduled_time: row.scheduled_time,
    tags: row.tag_names ? row.tag_names.split(';') : []
  }
}

// `async` marks a function that returns a Promise; `await` waits for one
// without blocking the server.
export async function itemsInSpace(space: string): Promise<Item[]> {
  const rows = await db().prepare(`${ITEM_SQL} WHERE t.space = ? GROUP BY t.id`).all(space)
  return rows.map(toItem)
}

export async function itemById(id: string): Promise<Item | undefined> {
  const row = await db().prepare(`${ITEM_SQL} WHERE t.id = ? GROUP BY t.id`).get(id)
  return row ? toItem(row) : undefined
}
