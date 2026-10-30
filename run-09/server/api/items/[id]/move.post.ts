// POST /api/items/:id/move
// Moves an item to another kanban column in its space, keeps `tasks.state` in
// sync with `columns.state`, and appends a `column` event to `events`.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  const actor = currentActor(event)
  // readBody parses the JSON request body sent by $fetch on the client.
  const body = await readBody<{ kanban?: string }>(event)
  const targetColumn = String(body?.kanban || '').trim()

  if (!id || !targetColumn) {
    throw createError({ statusCode: 400, statusMessage: 'Missing item id or target column' })
  }

  if (!can(actor, 'move', id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden by policy' })
  }

  const db = useDatabase()

  const { rows: itemRows } = await db.sql`
    SELECT id, space, kanban, state FROM tasks WHERE id = ${id}
  `
  const item = (itemRows as Array<Record<string, string>>)[0]
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const { rows: colRows } = await db.sql`
    SELECT name, state FROM columns WHERE space = ${item.space} AND name = ${targetColumn}
  `
  const col = (colRows as Array<Record<string, string>>)[0]
  if (!col) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown column for space' })
  }

  await db.sql`
    UPDATE tasks SET kanban = ${col.name}, state = ${col.state} WHERE id = ${id}
  `

  const eventId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const storedAt = unshifted(Date.now())
  await db.sql`
    INSERT INTO events (id, item_id, at, actor_id, kind, detail)
    VALUES (${eventId}, ${id}, ${storedAt}, ${actor}, 'column', ${col.name})
  `

  return { ok: true, id, kanban: col.name, state: col.state, eventId }
})
