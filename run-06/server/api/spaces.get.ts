// Nitro server route: this file under server/api automatically becomes the endpoint GET /api/spaces
import { getDb } from '../utils/db'

// defineEventHandler is a Nitro auto-import that wraps a server request handler
export default defineEventHandler((event) => {
  const db = getDb()

  const spaces = db.prepare('SELECT id, name, kind FROM spaces ORDER BY kind DESC, name ASC').all()
  const actors = db.prepare('SELECT id, name, kind, spaces FROM actors ORDER BY name ASC').all()
  const columns = db.prepare('SELECT space, name, state, position FROM columns ORDER BY space, position ASC').all()

  return {
    spaces,
    actors,
    columns
  }
})
