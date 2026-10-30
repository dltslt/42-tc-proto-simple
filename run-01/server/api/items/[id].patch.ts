// PATCH /api/items/:id — edit one item in place. Each field saves on its own,
// one request per field, no form. A move (body.kanban) and a field edit both
// arrive here; each change writes exactly one event.
import { all, get, run } from '../../utils/db'
import { appendEvent, itemTags, shapeItem, type ItemRow } from '../../utils/items'
import { can } from '../../utils/stubs'
import { currentUserId } from '../../utils/current-user'

interface PatchBody {
  kanban?: string
  title?: string
  description?: string
  effort?: string
  contributors?: string[]
  tags?: string[]
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const actorId = await currentUserId(event)
  if (!actorId) {
    throw createError({ statusCode: 401, statusMessage: 'Pick a current user first' })
  }

  const row = await get<ItemRow & { columnState: string }>(
    `SELECT t.*, c.state AS columnState
       FROM tasks t JOIN columns c ON c.space = t.space AND c.name = t.kanban
      WHERE t.id = ?`,
    [id],
  )
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'No such item' })
  }
  if (!(await can(actorId, 'edit', `item:${id}`))) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed' })
  }

  const body = await readBody<PatchBody>(event)

  // -- The move. ----------------------------------------------------------
  // The column decides the state: look the column up, take its `state`, and
  // write both together. This is the one place a move happens, so
  // tasks.state and tasks.kanban cannot drift apart. No approval, no gate
  // (out of scope for this brief; `can` would be the hook).
  if (body.kanban !== undefined && body.kanban !== row.kanban) {
    const column = await get<{ name: string, state: string }>(
      'SELECT name, state FROM columns WHERE space = ? AND name = ?',
      [row.space, body.kanban],
    )
    if (!column) {
      throw createError({ statusCode: 400, statusMessage: 'No such column in this space' })
    }
    await run('UPDATE tasks SET kanban = ?, state = ? WHERE id = ?', [column.name, column.state, id])
    await appendEvent(id, actorId, 'column', column.name)
  }

  // -- Plain text fields. Each changed field gets its own event. ----------
  for (const field of ['title', 'description', 'effort'] as const) {
    const value = body[field]
    if (value !== undefined && value !== row[field]) {
      await run(`UPDATE tasks SET ${field} = ? WHERE id = ?`, [value, id])
      await appendEvent(id, actorId, 'edit', `${field}: '${row[field] || '(empty)'}' -> '${value}'`)
    }
  }

  // -- Contributors: an array of actor ids, stored as a `;` list. ---------
  if (body.contributors !== undefined) {
    const joined = [...new Set(body.contributors)].join(';')
    if (joined !== row.contributors) {
      await run('UPDATE tasks SET contributors = ? WHERE id = ?', [joined, id])
      const names = await all<{ name: string }>(
        `SELECT name FROM actors WHERE id IN (${body.contributors.map(() => '?').join(',') || "''"})`,
        body.contributors,
      )
      await appendEvent(id, actorId, 'edit', `contributors: ${names.map(n => n.name).join(', ') || '(nobody)'}`)
    }
  }

  // -- Tags: set the full list, then log what the diff was. ---------------
  if (body.tags !== undefined) {
    const before = new Set((await itemTags(id)).map(t => t.id))
    const after = new Set(body.tags)
    const added = [...after].filter(t => !before.has(t))
    const removed = [...before].filter(t => !after.has(t))
    if (added.length || removed.length) {
      await run('DELETE FROM item_tags WHERE item_id = ?', [id])
      for (const tagId of after) {
        await run('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)', [id, tagId])
      }
      const names = await all<{ id: string, name: string }>(
        `SELECT id, name FROM tags WHERE id IN (${[...after].map(() => '?').join(',') || "''"})`,
        [...after],
      )
      const byId = new Map(names.map(n => [n.id, n.name]))
      const describe = (ids: string[]) => ids.map(i => byId.get(i) ?? i).join(', ') || '(none)'
      await appendEvent(id, actorId, 'tags', `added: ${describe(added)}; removed: ${describe(removed)}`)
    }
  }

  const updated = await get<ItemRow & { columnState: string }>(
    `SELECT t.*, c.state AS columnState
       FROM tasks t JOIN columns c ON c.space = t.space AND c.name = t.kanban
      WHERE t.id = ?`,
    [id],
  )
  return shapeItem(updated!, await itemTags(id))
})
