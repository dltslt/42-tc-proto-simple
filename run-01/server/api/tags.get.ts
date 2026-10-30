// GET /api/tags — the tag catalogue. The item detail offers every tag as a
// checkbox; ticking one PATCHes the item's tag list.
import { all } from '../utils/db'

export default defineEventHandler(async () => {
  return await all('SELECT id, name FROM tags ORDER BY name')
})
