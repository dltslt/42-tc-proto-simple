// Nitro server route: this file under server/api automatically becomes the endpoint PATCH /api/items/:id
import { getDb } from '../../utils/db'
import { getCurrentActor } from '../../utils/stubs'

// defineEventHandler is a Nuxt/Nitro auto-import for HTTP request handlers
// async and await are JavaScript features for handling asynchronous promises sequentially
export default defineEventHandler(async (event) => {
  // getRouterParam is a Nitro auto-import to extract route parameters from the URL
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Item id is required' })
  }

  // readBody is a Nitro auto-import to parse incoming JSON request body
  const body = await readBody(event)
  const db = getDb()

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: `Item ${id} not found` })
  }

  const updates: string[] = []
  const params: any[] = []

  if (body.title !== undefined) {
    updates.push('title = ?')
    params.push(body.title.trim())
  }

  if (body.description !== undefined) {
    updates.push('description = ?')
    params.push(body.description)
  }

  if (body.effort !== undefined) {
    updates.push('effort = ?')
    params.push(body.effort)
  }

  if (body.scheduled_time !== undefined) {
    updates.push('scheduled_time = ?')
    params.push(body.scheduled_time)
  }

  if (body.lead !== undefined) {
    updates.push('lead = ?')
    params.push(body.lead)
  }

  if (body.kanban !== undefined) {
    updates.push('kanban = ?')
    params.push(body.kanban)

    // Ensure state strictly follows the column's state
    const col = db.prepare('SELECT state FROM columns WHERE space = ? AND name = ?').get(existing.space, body.kanban) as any
    if (col) {
      updates.push('state = ?')
      params.push(col.state)
    }
  }

  if (updates.length > 0) {
    params.push(id)
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    // Log update event
    const actor = getCurrentActor(event)
    const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    db.prepare(`
      INSERT INTO events (id, item_id, at, actor_id, kind, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(eventId, id, new Date().toISOString(), actor, 'updated', `Updated fields: ${Object.keys(body).join(', ')}`)
  }

  const updatedItem = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  return updatedItem
})
