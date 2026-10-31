// Nitro server route: this file under server/api automatically becomes the endpoint POST /api/items
import { getDb } from '../../utils/db'
import { getDefaultColumn, getCurrentActor } from '../../utils/stubs'

// Hierarchy step down map
function getNextLevel(parentLevel: string): string {
  switch (parentLevel) {
    case 'space':
      return 'project'
    case 'project':
      return 'epic'
    case 'epic':
      return 'story'
    case 'story':
      return 'task'
    case 'task':
    case 'subtask':
    default:
      return 'subtask'
  }
}

// defineEventHandler is a Nuxt/Nitro auto-import for HTTP request handlers
// async and await are JavaScript features for handling asynchronous promises sequentially
export default defineEventHandler(async (event) => {
  // readBody is a Nitro auto-import to parse incoming JSON request body
  const body = await readBody(event)
  const title = (body.title || '').trim()

  if (!title) {
    // createError is a Nuxt auto-import that throws structured HTTP errors
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }

  const db = getDb()
  const actor = getCurrentActor(event)

  let spaceId = body.space
  let parentId = body.parentId || ''
  let parentLevel = 'space'

  // Resolve space and parent relation
  if (parentId.startsWith('space:')) {
    spaceId = parentId.replace(/^space:/, '')
    parentId = ''
    parentLevel = 'space'
  } else if (parentId) {
    const parentRow = db.prepare('SELECT id, space, level FROM tasks WHERE id = ?').get(parentId) as any
    if (parentRow) {
      spaceId = parentRow.space
      parentLevel = parentRow.level
    }
  }

  if (!spaceId) {
    const defaultSpace = db.prepare('SELECT id FROM spaces LIMIT 1').get() as any
    spaceId = defaultSpace ? defaultSpace.id : 'org-a'
  }

  // Determine child level
  const level = body.level || getNextLevel(parentLevel)

  // Determine kanban column and state
  const defaultCol = getDefaultColumn(spaceId)
  const kanban = body.kanban || defaultCol.name
  const colRow = db.prepare('SELECT state FROM columns WHERE space = ? AND name = ?').get(spaceId, kanban) as any
  const state = colRow ? colRow.state : 'unstarted'

  // Generate next unique item ID
  const allIds = db.prepare("SELECT id FROM tasks WHERE id LIKE 'item-%'").all() as Array<{ id: string }>
  let maxNum = 0
  for (const row of allIds) {
    const num = parseInt(row.id.replace('item-', ''), 10)
    if (!isNaN(num) && num > maxNum) {
      maxNum = num
    }
  }
  const newId = `item-${maxNum + 1}`

  const lead = body.lead || actor
  const contributors = body.contributors || actor
  const description = body.description || ''
  const effort = body.effort || ''
  const scheduledTime = body.scheduled_time || ''

  // Insert into tasks table
  db.prepare(`
    INSERT INTO tasks (id, space, level, title, parent_id, kanban, state, lead, contributors, description, effort, scheduled_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newId, spaceId, level, title, parentId, kanban, state, lead, contributors, description, effort, scheduledTime)

  // Insert into relations table if it has a parent
  if (parentId) {
    db.prepare('INSERT OR IGNORE INTO relations (parent_id, child_id) VALUES (?, ?)').run(parentId, newId)
  }

  // Record creation event in events table
  const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  db.prepare(`
    INSERT INTO events (id, item_id, at, actor_id, kind, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(eventId, newId, new Date().toISOString(), actor, 'created', `Created ${level} "${title}"`)

  const createdItem = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId)
  return createdItem
})
