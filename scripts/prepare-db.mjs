// Builds run-NN/.data/app.sqlite from the brief's seed count.
// Run from the run directory. make setup does that.
// In template/ there is no run number, so this exits without writing a file.
//
// The brief is the row for this run in README.md. Its Seed line is the count.

import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const TABLES = [
  ['actors.csv', 'actors'],
  ['spaces.csv', 'spaces'],
  ['members.csv', 'members'],
  ['columns.csv', 'columns'],
  ['tasks.csv', 'tasks'],
  ['relations.csv', 'relations'],
  ['tags.csv', 'tags'],
  ['item_tags.csv', 'item_tags'],
  ['blockers.csv', 'blockers'],
  ['artifacts.csv', 'artifacts'],
  ['item_artifacts.csv', 'item_artifacts'],
  ['events.csv', 'events'],
]

function briefForRun(runName) {
  const readme = readFileSync(join(root, 'README.md'), 'utf8')
  for (const line of readme.split('\n')) {
    const match = line.match(/^\|\s*(run-\d+)\s*\|\s*([a-z0-9-]+)\s*\|/)
    if (match && match[1] === runName) return match[2]
  }
  return null
}

function seedCount(briefName) {
  const text = readFileSync(join(root, 'briefs', `${briefName}.md`), 'utf8')
  const match = text.match(/\*\*Seed:\*\*\s*([0-9][0-9,]*)/)
  if (!match) throw new Error(`${briefName}.md has no Seed line`)
  return Number(match[1].replaceAll(',', ''))
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      field = ''
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
    } else if (char !== '\r') field += char
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
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

async function loadSqlite(runDir, schema) {
  const { DatabaseSync } = await import('node:sqlite')
  const databasePath = join(runDir, '.data', 'app.sqlite')
  rmSync(databasePath, { force: true })
  rmSync(`${databasePath}-wal`, { force: true })
  rmSync(`${databasePath}-shm`, { force: true })
  const db = new DatabaseSync(databasePath)
  db.exec(schema)
  db.exec('BEGIN')
  try {
    for (const [file, table] of TABLES) {
      const columns = columnsOf(schema, table)
      const records = parseCsv(readFileSync(join(runDir, '.data', 'seed', file), 'utf8'))
      const header = records[0] ? Object.keys(records[0]) : columns
      if (header.join() !== columns.join() && records.length > 0) {
        const missing = columns.filter((column) => !header.includes(column))
        if (missing.length > 0) throw new Error(`${file} is missing ${missing.join(', ')}`)
      }
      const statement = db.prepare(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      )
      for (const record of records) statement.run(...columns.map((column) => record[column] ?? ''))
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  } finally {
    db.close()
  }
}

async function main() {
  const runDir = resolve(process.cwd())
  const runName = basename(runDir)
  const suffix = runName.match(/-([0-9]+)$/)
  if (!suffix) {
    console.log('No run number in the directory name. Skipping the database.')
    return
  }
  if (suffix[1].length !== 2) {
    throw new Error(`${runName} is not a valid run directory. The run number must always contain two digits. A single digit needs a leading zero: run-01, not run-1.`)
  }
  if (dirname(runDir) !== root) {
    throw new Error(`Run this from a run directory inside ${root}`)
  }
  const brief = briefForRun(runName)
  if (!brief) throw new Error(`README.md has no row for ${runName}`)
  const count = seedCount(brief)
  const seeded = spawnSync(
    process.execPath,
    [join(root, 'scripts', 'seed-tasks.mjs'), '--items', String(count), '--run', suffix[1]],
    { stdio: 'inherit' },
  )
  if (seeded.status !== 0) process.exit(seeded.status ?? 1)
  await loadSqlite(runDir, readFileSync(join(root, 'scripts', 'schema.sql'), 'utf8'))
  console.log(`SQLite: ${join(runDir, '.data', 'app.sqlite')} (${count} items)`)
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
