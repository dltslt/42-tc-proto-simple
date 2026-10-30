// The ten queries of the bench, in one place, in brief order.
// Each function takes the open database and its parameters and returns
// { sql, params, rows }. The route measures the time around the call, so the
// ms on /bench covers every statement of the query, not just the first.
import type { Database } from 'db0'

export type QueryResult = {
  // The SQL text travels to /bench so the page can show what ran.
  sql: string
  params: unknown[]
  rows: unknown[]
  note?: string
}

async function all(db: Database, sql: string, params: unknown[] = []): Promise<unknown[]> {
  // prepare().all(...params) runs the statement with ? placeholders bound,
  // so values never end up inside the SQL string.
  return db.prepare(sql).all(...params)
}

export function get<T>(row: unknown, key: string): T {
  return (row as Record<string, T>)[key]
}

// 1. The items in one kanban column of one space, 50 per page, newest change
//    first. "Newest change" is the last event of the item; tasks has no
//    updated-at column, so the ordering reads MAX(events.at) per item.
export function q1ColumnPage(db: Database, space: string, kanban: string, page: number): Promise<QueryResult> {
  const sql = `SELECT t.id, t.level, t.title, t.state, t.lead,
    (SELECT MAX(e.at) FROM events e WHERE e.item_id = t.id) AS changed_at
  FROM tasks t
  WHERE t.space = ? AND t.kanban = ?
  ORDER BY changed_at DESC
  LIMIT 50 OFFSET ?`
  const params = [space, kanban, page * 50]
  return all(db, sql, params).then((rows) => ({ sql, params, rows }))
}

// 2. One item with everything the item panel shows: children, the parent
//    chain up to the root, tags, artifacts, and blockers in both directions,
//    each with the other item's title. The chain is a recursive CTE: a
//    WITH RECURSIVE query joins its own output until a row adds nothing new.
export async function q2ItemPanel(db: Database, id: string): Promise<QueryResult> {
  const statements: Array<[string, unknown[]]> = [
    ['SELECT * FROM tasks WHERE id = ?', [id]],
    [`SELECT t.* FROM relations r JOIN tasks t ON t.id = r.child_id WHERE r.parent_id = ?`, [id]],
    [`WITH RECURSIVE up(id, parent_id, depth) AS (
      SELECT id, parent_id, 0 FROM tasks WHERE id = ?
      UNION ALL
      SELECT t.id, t.parent_id, up.depth + 1 FROM tasks t JOIN up ON t.id = up.parent_id WHERE up.parent_id != ''
    ) SELECT id, parent_id, depth FROM up ORDER BY depth`, [id]],
    [`SELECT g.name FROM item_tags it JOIN tags g ON g.id = it.tag_id WHERE it.item_id = ?`, [id]],
    [`SELECT a.title, a.url FROM item_artifacts ia JOIN artifacts a ON a.id = ia.artifact_id WHERE ia.item_id = ?`, [id]],
    [`SELECT b.severity, t.title AS blocker_title FROM blockers b JOIN tasks t ON t.id = b.blocker_item_id WHERE b.blocked_item_id = ?`, [id]],
    [`SELECT b.severity, t.title AS blocked_title FROM blockers b JOIN tasks t ON t.id = b.blocked_item_id WHERE b.blocker_item_id = ?`, [id]],
  ]
  const sql = statements.map(([statement]) => statement).join(';\n')
  const params = statements.flatMap(([, bound]) => bound)
  const parts: unknown[][] = []
  for (const [statement, bound] of statements) parts.push(await all(db, statement, bound))
  return { sql, params, rows: parts, note: 'seven statements: item, children, parent chain, tags, artifacts, blockers in, blockers out' }
}

// 3. The whole subtree under one project, all levels. Another recursive CTE,
//    walking down the relations table (the parent-and-child record).
export function q3Subtree(db: Database, rootId: string): Promise<QueryResult> {
  const sql = `WITH RECURSIVE sub(id) AS (
    SELECT id FROM tasks WHERE id = ?
    UNION ALL
    SELECT r.child_id FROM relations r JOIN sub ON r.parent_id = sub.id
  ) SELECT t.id, t.space, t.level, t.title, t.parent_id, t.kanban, t.state
  FROM sub JOIN tasks t ON t.id = sub.id
  ORDER BY t.level, t.id`
  const params = [rootId]
  return all(db, sql, params).then((rows) => ({ sql, params, rows }))
}

// 4. All open blockers in a space, grouped by severity, with both titles.
//    "Open" is a prototype reading: the blocked item is not done. The severity
//    lives on the blocker link itself, where the spec stores it.
export async function q4OpenBlockers(db: Database, space: string): Promise<QueryResult> {
  const countSql = `SELECT b.severity, count(*) AS count FROM blockers b
    JOIN tasks t ON t.id = b.blocked_item_id
    WHERE t.space = ? AND t.state != 'done'
    GROUP BY b.severity`
  const listSql = `SELECT b.severity,
      bt.title AS blocked_title, kt.title AS blocker_title
    FROM blockers b
    JOIN tasks bt ON bt.id = b.blocked_item_id
    JOIN tasks kt ON kt.id = b.blocker_item_id
    WHERE bt.space = ? AND bt.state != 'done'
    ORDER BY CASE b.severity
      WHEN 'cannot do anything' THEN 0 WHEN 'will be stuck' THEN 1
      WHEN 'slowed down' THEN 2 ELSE 3 END, bt.title`
  const counts = await all(db, countSql, [space])
  const rows = await all(db, listSql, [space])
  return {
    sql: `${countSql};\n${listSql}`,
    params: [space, space],
    rows: [{ counts }, ...rows],
    note: 'two statements: counts grouped by severity, then the list with both titles',
  }
}

// 5. One person's items that are not done, across every space they are a
//    member of. Two awkward SQL parts on purpose: the membership read goes
//    through the members table, and a contributor sits in a `;` list, which
//    only a LIKE match can find. This is the cost of the default "one space
//    per task" answer, measured.
export function q5PersonOpen(db: Database, actorId: string): Promise<QueryResult> {
  const sql = `SELECT t.id, t.space, t.level, t.title, t.kanban, t.state, t.lead
  FROM tasks t
  WHERE t.state != 'done'
    AND t.space IN (SELECT m.space FROM members m WHERE m.actor_id = ?)
    AND (t.lead = ? OR t.contributors LIKE '%' || ? || '%')
  ORDER BY t.space, t.level`
  const params = [actorId, actorId, actorId]
  return all(db, sql, params).then((rows) => ({ sql, params, rows }))
}

// 6. Items with a scheduled time in a given week, for a calendar. The seed
//    stores ISO timestamps, and ISO strings sort as text, so a plain range
//    compare finds the week. The route computes the bounds from any date.
export function q6Week(db: Database, start: string, end: string): Promise<QueryResult> {
  const sql = `SELECT id, space, level, title, scheduled_time, effort
  FROM tasks
  WHERE scheduled_time != '' AND scheduled_time >= ? AND scheduled_time < ?
  ORDER BY scheduled_time`
  const params = [start, end]
  return all(db, sql, params).then((rows) => ({ sql, params, rows }))
}

// 7. Items with a given tag, plus how many of each other tag those items
//    carry. The co-occurrence count is the data behind a filter panel.
export async function q7Tag(db: Database, tagName: string): Promise<QueryResult> {
  const itemsSql = `SELECT t.id, t.title, t.kanban FROM tasks t
    JOIN item_tags it ON it.item_id = t.id
    JOIN tags g ON g.id = it.tag_id
    WHERE g.name = ?`
  const coSql = `SELECT g.name, count(*) AS count FROM item_tags it
    JOIN tags g ON g.id = it.tag_id
    WHERE it.item_id IN (
      SELECT it2.item_id FROM item_tags it2
      JOIN tags g2 ON g2.id = it2.tag_id WHERE g2.name = ?
    ) AND g.name != ?
    GROUP BY g.name ORDER BY count DESC`
  const rows = await all(db, itemsSql, [tagName])
  const counts = await all(db, coSql, [tagName, tagName])
  return {
    sql: `${itemsSql};\n${coSql}`,
    params: [tagName, tagName, tagName],
    rows: [{ items: rows.length, counts }, ...rows],
    note: 'two statements: the tagged items, then the counts of their other tags',
  }
}

// 8. Moving one item to another column, writing its event in the same
//    transaction. The state column must follow the kanban column through the
//    columns table, so the read of the column's state joins the write.
//    BEGIN/COMMIT make both writes land together or not at all; db0 has no
//    transaction helper, so the raw statements do it.
export async function q8Move(db: Database, id: string, to: string): Promise<QueryResult> {
  const sql = `-- inside BEGIN
    SELECT state FROM columns WHERE space = (SELECT space FROM tasks WHERE id = ?) AND name = ?
    UPDATE tasks SET kanban = ?, state = ? WHERE id = ?
    INSERT INTO events (id, item_id, at, actor_id, kind, detail)
      VALUES ('evt-' || lower(hex(randomblob(8))), ?, ?, ?, 'column', ?)
    -- COMMIT`
  await db.exec('BEGIN')
  try {
    const row = await db.prepare('SELECT space, state FROM columns WHERE name = ? AND space = (SELECT space FROM tasks WHERE id = ?)').get(to, id)
    const state = get<string>(row, 'state')
    await db.prepare('UPDATE tasks SET kanban = ?, state = ? WHERE id = ?').run(to, state, id)
    await db.prepare(
      `INSERT INTO events (id, item_id, at, actor_id, kind, detail)
       VALUES ('evt-' || lower(hex(randomblob(8))), ?, ?, ?, 'column', ?)`,
    ).run(id, new Date().toISOString(), 'person-1', to)
    await db.exec('COMMIT')
    return { sql, params: [id, to], rows: [{ id, kanban: to, state }], note: 'transaction: column read, task update, event insert' }
  } catch (error) {
    await db.exec('ROLLBACK')
    throw error
  }
}

// 9. Counts per column and per state for a space, the data for a chart.
export async function q9Counts(db: Database, space: string): Promise<QueryResult> {
  const byKanban = `SELECT kanban, count(*) AS count FROM tasks WHERE space = ? GROUP BY kanban`
  const byState = `SELECT state, count(*) AS count FROM tasks WHERE space = ? GROUP BY state`
  const kanbanRows = await all(db, byKanban, [space])
  const stateRows = await all(db, byState, [space])
  return {
    sql: `${byKanban};\n${byState}`,
    params: [space, space],
    rows: [{ by_kanban: kanbanRows, by_state: stateRows }],
    note: 'two statements: counts per kanban column, counts per state',
  }
}

// 10. Title search for a word, first 20 hits. LIKE with a leading wildcard
//     reads every row; SQLite has no index for it. A full-text index (FTS5)
//     is the real answer and stays out of this run on purpose.
export function q10Search(db: Database, word: string): Promise<QueryResult> {
  const sql = `SELECT id, space, level, title FROM tasks
  WHERE title LIKE '%' || ? || '%'
  LIMIT 20`
  const params = [word]
  return all(db, sql, params).then((rows) => ({ sql, params, rows }))
}
