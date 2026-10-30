// Brackets in a filename become a URL parameter: GET /api/spaces/:space/columns.
export default defineEventHandler(async (event) => {
  // getRouterParam reads `:space` from the URL path.
  const space = getRouterParam(event, 'space') || 'org-a'
  const db = useDatabase()

  const { rows: columns } = await db.sql`
    SELECT space, name, state, CAST(position AS INTEGER) AS position
    FROM columns
    WHERE space = ${space}
    ORDER BY CAST(position AS INTEGER) ASC
  `
  return { space, columns }
})
