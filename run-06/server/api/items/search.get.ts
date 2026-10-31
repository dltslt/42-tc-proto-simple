// Nitro server route: this file under server/api automatically becomes the endpoint GET /api/items/search
import { getDb } from '../../utils/db'

// defineEventHandler is a Nuxt/Nitro auto-import for HTTP request handlers
export default defineEventHandler((event) => {
  // getQuery is a Nitro auto-import to extract URL query parameters
  const query = getQuery(event)
  const q = ((query.q as string) || '').trim().toLowerCase()

  const db = getDb()

  if (!q) {
    // Return recent or root items if query is empty
    const items = db.prepare('SELECT id, space, level, title, kanban, state, parent_id FROM tasks LIMIT 20').all() as any[]
    return { items: enrichAncestry(db, items) }
  }

  // Search across title, id, or level
  const sql = `
    SELECT id, space, level, title, kanban, state, parent_id 
    FROM tasks 
    WHERE LOWER(title) LIKE ? OR LOWER(id) LIKE ? OR LOWER(level) LIKE ?
    ORDER BY 
      CASE WHEN LOWER(title) = ? THEN 1
           WHEN LOWER(title) LIKE ? THEN 2
           ELSE 3
      END,
      id ASC
    LIMIT 30
  `
  const exact = q
  const prefix = `${q}%`
  const wildcard = `%${q}%`

  const rows = db.prepare(sql).all(wildcard, wildcard, wildcard, exact, prefix) as any[]
  return { items: enrichAncestry(db, rows) }
})

// Helper to build quick breadcrumb path string for search display (e.g. "Store the brush > Pack the shelf")
function enrichAncestry(db: any, items: any[]) {
  return items.map((item) => {
    const chain: string[] = []
    let curr = item
    while (curr && curr.parent_id) {
      const parent = db.prepare('SELECT id, title, parent_id FROM tasks WHERE id = ?').get(curr.parent_id) as any
      if (parent) {
        chain.unshift(parent.title)
        curr = parent
      } else {
        break
      }
    }
    return {
      ...item,
      path: chain.join(' › ')
    }
  })
}
