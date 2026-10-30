// A file in server/api/ becomes an HTTP route automatically.
// The `.get.ts` suffix restricts this handler to GET requests: GET /api/actors.
// defineEventHandler and useDatabase are auto-imported by Nitro (Nuxt's server engine).
export default defineEventHandler(async (event) => {
  const db = useDatabase()
  const actor = currentActor(event)

  // db.sql is a tagged template literal that runs a parameterised query via db0.
  const { rows: actors } = await db.sql`
    SELECT id, name, kind, spaces FROM actors WHERE kind = 'person' ORDER BY id
  `
  const { rows: spaces } = await db.sql`
    SELECT id, name, kind FROM spaces ORDER BY kind DESC, id ASC
  `
  const { rows: members } = await db.sql`
    SELECT space, actor_id, role FROM members
  `

  return { currentActor: actor, actors, spaces, members }
})
