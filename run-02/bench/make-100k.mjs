// Builds bench/bench-100k.sqlite: the 10,000-item seed of .data/seed,
// copied ten times into one file. Each copy k (k = 1..9) adds 10000 * k to
// every numeric id, so item-1351 in copy 2 becomes item-21351. Spaces,
// actors, columns, tags, and artifacts are shared by all copies, which keeps
// the shape of the data (levels, states, ratios) and multiplies what the
// queries read. Run it from the run directory after `make setup`:
//
//   node bench/make-100k.mjs
//
// The seed CSVs live in .data/seed, which is gitignored and rebuilt by
// `make setup`; the generated .sqlite file is committed, so this script only
// needs to run again if the seed changes.

import { readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const runDir = dirname(here)
const COPIES = 10

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1 } else quoted = false
      } else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n') {
      row.push(field); field = ''
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
    } else if (char !== '\r') field += char
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])))
}

function columnsOf(schema, table) {
  const match = schema.match(new RegExp(`CREATE TABLE ${table} \\(([\\s\\S]*?)\\);`))
  if (!match) throw new Error(`schema.sql has no table ${table}`)
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('PRIMARY KEY') && !line.startsWith('--'))
    .map((line) => line.split(/\s+/)[0].replace(/,$/, ''))
}

// 'item-1351' at copy 2 -> 'item-21351'. Rows whose id is not a `prefix-N`
// (there are none in the seed) would fail loudly here.
function remap(value, prefix, offset) {
  if (!value) return value
  const number = Number(value.slice(prefix.length))
  if (!Number.isFinite(number)) throw new Error(`cannot remap id ${value}`)
  return `${prefix}${number + offset}`
}

const { DatabaseSync } = await import('node:sqlite')
const root = dirname(runDir)
const schema = readFileSync(join(root, 'scripts', 'schema.sql'), 'utf8')
const outPath = join(here, 'bench-100k.sqlite')
rmSync(outPath, { force: true })

const db = new DatabaseSync(outPath)
db.exec(schema)
db.exec('BEGIN')
const maxUsed = {}
try {
  for (const [file, table] of [
    ['actors.csv', 'actors'], ['spaces.csv', 'spaces'], ['members.csv', 'members'],
    ['columns.csv', 'columns'], ['tags.csv', 'tags'], ['artifacts.csv', 'artifacts'],
  ]) {
    // Tables without an item id: copied once, shared by every copy.
    const columns = columnsOf(schema, table)
    const statement = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
    for (const record of parseCsv(readFileSync(join(runDir, '.data', 'seed', file), 'utf8'))) {
      statement.run(...columns.map((column) => record[column] ?? ''))
    }
  }
  for (let copy = 0; copy < COPIES; copy++) {
    // The item tables: id columns shift, each with its own prefix. A column
    // not listed here (tag_id, artifact_id, actor_id, at, ...) is shared.
    // The offset per prefix is the highest number that prefix has used so
    // far, so ids from earlier copies never collide. The id column of the
    // CSV names the prefix: item-3 in tasks, event-12 in events, and so on.
    const remapOf = {
      tasks: { id: 'item-', parent_id: 'item-' },
      relations: { parent_id: 'item-', child_id: 'item-' },
      item_tags: { item_id: 'item-' },
      blockers: { id: 'blocker-', blocker_item_id: 'item-', blocked_item_id: 'item-' },
      item_artifacts: { item_id: 'item-' },
      events: { id: 'event-', item_id: 'item-' },
    }
    for (const [file, table] of [
      ['tasks.csv', 'tasks'],
      ['relations.csv', 'relations'],
      ['item_tags.csv', 'item_tags'],
      ['blockers.csv', 'blockers'],
      ['item_artifacts.csv', 'item_artifacts'],
      ['events.csv', 'events'],
    ]) {
      const columns = columnsOf(schema, table)
      const statement = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
      const records = parseCsv(readFileSync(join(runDir, '.data', 'seed', file), 'utf8'))
      if (copy === 0 && remapOf[table].id) {
        // One pass over the CSV to learn how far this id prefix is numbered.
        maxUsed[remapOf[table].id] = Math.max(...records.map((record) => Number(record.id.slice(remapOf[table].id.length))))
      }
      for (const record of records) {
        const shifted = { ...record }
        for (const [column, prefix] of Object.entries(remapOf[table])) {
          shifted[column] = remap(record[column], prefix, copy * maxUsed[prefix])
        }
        statement.run(...columns.map((column) => shifted[column] ?? ''))
      }
    }
  }
  db.exec('COMMIT')
} catch (error) {
  db.exec('ROLLBACK')
  throw error
}
const count = db.prepare('SELECT count(*) AS count FROM tasks').get().count
db.close()
console.log(`${outPath}: ${count} items`)
