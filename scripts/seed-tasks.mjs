// Writes the seed CSV files for a prototype run.
// parent_id is the hierarchy relation (a parent and child record), not a column
// stored on the item. Timestamps are offsets from 2026-10-30T00:00:00Z.
// A loader that wants "today" shifts every timestamp by the gap between that
// epoch and the day it loads.
//
// From the repository root:
//   node scripts/seed-tasks.mjs --items 10000 --run 2
// Writes <root>/run-02/.data/seed. --run 2 is run-02.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LEVELS = ['project', 'epic', 'story', 'task', 'subtask']
const STATE_OF = {
  backlog: 'unstarted',
  design: 'started',
  build: 'started',
  QA: 'started',
  'in progress': 'started',
  done: 'done',
}
const ORG_COLUMNS = ['backlog', 'design', 'build', 'QA', 'done']
const PERSONAL_COLUMNS = ['backlog', 'in progress', 'done']
const EPOCH = Date.parse('2026-10-30T00:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const SEVERITIES = ['cannot do anything', 'will be stuck', 'slowed down', 'nice to have']

const VERBS = [
  'mend', 'sort', 'check', 'move', 'label', 'pack', 'clear', 'test', 'file', 'mark',
  'lift', 'rinse', 'fold', 'stack', 'count', 'weigh', 'seal', 'trim', 'oil', 'hang',
  'store', 'wash', 'dry', 'align', 'reset', 'open', 'close', 'fill', 'empty', 'tie',
]
const NOUNS = [
  'latch', 'crate', 'shelf', 'ledger', 'valve', 'cable', 'drawer', 'lamp', 'bin', 'chart',
  'hose', 'panel', 'bolt', 'tray', 'spool', 'clamp', 'gauge', 'frame', 'hook', 'rail',
  'drum', 'wick', 'tile', 'plug', 'strap', 'knob', 'pipe', 'brush', 'wedge', 'cord',
  'mat', 'cup', 'lid', 'peg', 'rod', 'tag', 'box', 'key', 'bell', 'net',
]

const PEOPLE = [
  ['person-1', 'Ada'],
  ['person-2', 'Ben'],
  ['person-3', 'Cai'],
  ['person-4', 'Dee'],
  ['person-5', 'Eli'],
  ['person-6', 'Fay'],
  ['person-7', 'Gio'],
  ['person-8', 'Hal'],
  ['person-9', 'Ivy'],
  ['person-10', 'Jon'],
]

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rngFrom(next) {
  return {
    int(bound) {
      return Math.floor(next() * bound)
    },
    pick(list) {
      return list[Math.floor(next() * list.length)]
    },
    shuffle(list) {
      const copy = list.slice()
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const swap = copy[i]
        copy[i] = copy[j]
        copy[j] = swap
      }
      return copy
    },
  }
}

function parseArgs(argv) {
  let items = 10000
  let run = ''
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--items') {
      items = Number(argv[++i])
    } else if (arg.startsWith('--items=')) {
      items = Number(arg.slice('--items='.length))
    } else if (arg === '--run') {
      run = argv[++i]
    } else if (arg.startsWith('--run=')) {
      run = arg.slice('--run='.length)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!Number.isInteger(items) || items < 1) {
    throw new Error('--items must be a positive integer')
  }
  if (!/^[0-9]+$/.test(run)) {
    throw new Error('--run must be a number, for example --run 2')
  }
  const root = dirname(dirname(fileURLToPath(import.meta.url)))
  const runDir = join(root, `run-${run.padStart(2, '0')}`)
  if (!existsSync(runDir)) {
    throw new Error(`No run directory: ${runDir}`)
  }
  return { items, out: join(runDir, '.data', 'seed') }
}

function levelCounts(n) {
  let project = Math.max(1, Math.round((20 * n) / 10000))
  let epic = Math.round((150 * n) / 10000)
  let story = Math.round((1500 * n) / 10000)
  if (project > n) project = n
  if (project + epic > n) epic = n - project
  if (project + epic + story > n) story = n - project - epic
  const remaining = n - project - epic - story
  let task = 0
  let subtask = 0
  if (remaining > 0) {
    task = Math.round(remaining / 1.1)
    if (task < 1) task = 1
    if (task > remaining) task = remaining
    subtask = remaining - task
  }
  return { project, epic, story, task, subtask }
}

function idealQuotas(n) {
  let orgA = Math.round(0.75 * n)
  let orgB = Math.round(0.15 * n)
  let personal = n - orgA - orgB
  if (personal < 0) {
    orgB += personal
    personal = 0
  }
  if (orgB < 0) {
    orgA += orgB
    orgB = 0
  }
  return { orgA, orgB, personal }
}

function splitEven(total, parts) {
  const base = Math.floor(total / parts)
  const extra = total % parts
  return Array.from({ length: parts }, (_, i) => base + (i < extra ? 1 : 0))
}

function used(space) {
  return LEVELS.reduce((sum, level) => sum + space.levels[level], 0)
}

function room(space) {
  return space.quota - used(space) - space.taskReserve
}

// Largest-remainder split, then any leftover goes to the spaces that still
// have room, in list order. `total` must fit in the rooms.
function give(total, spaces, roomOf) {
  const caps = spaces.map(roomOf)
  const capSum = caps.reduce((sum, cap) => sum + cap, 0)
  if (total > capSum) {
    throw new Error(`Cannot place ${total} items into ${capSum} open slots`)
  }
  if (total === 0) return spaces.map(() => 0)
  const amounts = caps.map((cap) => Math.floor((total * cap) / capSum))
  let left = total - amounts.reduce((sum, amount) => sum + amount, 0)
  const order = caps
    .map((cap, index) => ({
      index,
      frac: capSum === 0 ? 0 : (total * cap) / capSum - amounts[index],
    }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index)
  let guard = 0
  while (left > 0) {
    let placed = false
    for (const { index } of order) {
      if (left === 0) break
      if (amounts[index] < caps[index]) {
        amounts[index] += 1
        left -= 1
        placed = true
      }
    }
    if (!placed) throw new Error('No open slot while placing items')
    if (++guard > total + spaces.length) throw new Error('Placement did not finish')
  }
  return amounts
}

function blankLevels() {
  return { project: 0, epic: 0, story: 0, task: 0, subtask: 0 }
}

function planSpaces(n) {
  const counts = levelCounts(n)
  const ideal = idealQuotas(n)
  const spaces = [
    {
      id: 'org-a',
      kind: 'org',
      quota: ideal.orgA,
      minProjects: 1,
      minTasks: 0,
      taskReserve: 0,
      levels: blankLevels(),
    },
  ]

  let projectsLeft = counts.project - 1
  let orgBOpen = false
  if (ideal.orgB > 0 && projectsLeft >= 1) {
    const fixture = ideal.orgB >= 4 && projectsLeft >= 2 && counts.task >= 2
    const minProjects = fixture ? 2 : 1
    spaces.push({
      id: 'org-b',
      kind: 'org',
      quota: ideal.orgB,
      minProjects,
      minTasks: fixture ? 2 : 0,
      taskReserve: fixture ? 2 : 0,
      fixture,
      levels: blankLevels(),
    })
    projectsLeft -= minProjects
    orgBOpen = true
  }
  if (!orgBOpen) spaces[0].quota += ideal.orgB

  const personalRooms = Math.min(10, ideal.personal, Math.max(0, projectsLeft))
  if (personalRooms === 0) {
    spaces[0].quota += ideal.personal
  } else {
    const shares = splitEven(ideal.personal, personalRooms)
    for (let i = 0; i < personalRooms; i++) {
      spaces.push({
        id: `personal-${i + 1}`,
        kind: 'personal',
        quota: shares[i],
        minProjects: 1,
        minTasks: 0,
        taskReserve: 0,
        levels: blankLevels(),
      })
    }
  }

  for (const space of spaces) space.levels.project = space.minProjects
  const extraProjects = counts.project - spaces.reduce((sum, space) => sum + space.levels.project, 0)
  if (extraProjects < 0) throw new Error('Project minimums exceed the project count')
  give(extraProjects, spaces, room).forEach((amount, index) => {
    spaces[index].levels.project += amount
  })

  for (const level of ['epic', 'story']) {
    give(counts[level], spaces, room).forEach((amount, index) => {
      spaces[index].levels[level] += amount
    })
  }

  let reserved = 0
  for (const space of spaces) {
    space.levels.task += space.taskReserve
    reserved += space.taskReserve
    space.taskReserve = 0
  }
  give(counts.task - reserved, spaces, room).forEach((amount, index) => {
    spaces[index].levels.task += amount
  })

  for (const space of spaces) space.levels.subtask = room(space)

  repairSubtaskPiles(spaces)

  const got = blankLevels()
  for (const space of spaces) {
    for (const level of LEVELS) got[level] += space.levels[level]
    if (used(space) !== space.quota) {
      throw new Error(`${space.id} holds ${used(space)} items, quota is ${space.quota}`)
    }
  }
  for (const level of LEVELS) {
    if (got[level] !== counts[level]) {
      throw new Error(`${level} count is ${got[level]}, expected ${counts[level]}`)
    }
  }
  return spaces
}

// A space that has more subtasks than tasks swaps with a space that can
// take a subtask and still give every subtask its own task.
function repairSubtaskPiles(spaces) {
  const donorOk = (space) =>
    space.levels.task - 1 >= space.minTasks && space.levels.task - 1 >= space.levels.subtask + 1
  let guard = 0
  for (;;) {
    const needy = spaces.find((space) => space.levels.subtask > space.levels.task)
    if (!needy) return
    const donor = spaces.find(donorOk)
    if (!donor) return
    needy.levels.subtask -= 1
    needy.levels.task += 1
    donor.levels.task -= 1
    donor.levels.subtask += 1
    if (++guard > 100000) throw new Error('Subtask repair did not finish')
  }
}

function buildActors() {
  const rows = PEOPLE.map(([id, name], index) => {
    const n = index + 1
    const spaces = [`personal-${n}:admin`]
    if (n <= 6) spaces.push(`org-a:${n === 1 ? 'admin' : 'member'}`)
    if (n === 7) spaces.push('org-a:member', 'org-b:member')
    if (n === 8) spaces.push('org-b:admin')
    if (n > 8) spaces.push('org-b:member')
    return { id, name, kind: 'person', spaces: spaces.join(';') }
  })
  rows.push(
    { id: 'agent-1', name: 'Quill', kind: 'agent', spaces: '' },
    { id: 'agent-2', name: 'Loom', kind: 'agent', spaces: '' },
  )
  return rows
}

function membersOf(actors) {
  const map = new Map()
  for (const actor of actors) {
    if (!actor.spaces) continue
    for (const membership of actor.spaces.split(';')) {
      const [space] = membership.split(':')
      if (!map.has(space)) map.set(space, [])
      map.get(space).push(actor.id)
    }
  }
  return map
}

function titleFor(rng) {
  return `${capitalize(rng.pick(VERBS))} the ${rng.pick(NOUNS)}`
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildItems(spaces, rng) {
  const items = []
  let next = 1
  for (const space of spaces) {
    space.items = []
    for (const level of LEVELS) {
      for (let i = 0; i < space.levels[level]; i++) {
        const item = {
          id: `item-${next++}`,
          space: space.id,
          level,
          title: titleFor(rng),
          parent_id: '',
          kanban: '',
          state: '',
          lead: '',
          contributors: '',
          description: '',
          effort: '',
          scheduled_time: '',
        }
        items.push(item)
        space.items.push(item)
      }
    }
  }
  for (const space of spaces) linkSpace(space)
  applyFixture(spaces)
  return items
}

function ofLevel(space, level) {
  return space.items.filter((item) => item.level === level)
}

function linkOnto(children, parents) {
  if (children.length === 0) return
  if (parents.length === 0) throw new Error(`No parent for ${children[0].level}`)
  children.forEach((child, index) => {
    child.parent_id = parents[index % parents.length].id
  })
}

function linkSpace(space) {
  const projects = ofLevel(space, 'project')
  const epics = ofLevel(space, 'epic')
  const stories = ofLevel(space, 'story')
  const tasks = ofLevel(space, 'task')
  const subtasks = ofLevel(space, 'subtask')
  linkOnto(epics, projects)
  linkOnto(stories, epics.length > 0 ? epics : projects)
  linkOnto(tasks, stories.length > 0 ? stories : epics.length > 0 ? epics : projects)
  linkOnto(subtasks, tasks.length > 0 ? tasks : stories.length > 0 ? stories : projects)
}

function applyFixture(spaces) {
  const orgB = spaces.find((space) => space.fixture)
  if (!orgB) return
  const projects = ofLevel(orgB, 'project')
  const tasks = ofLevel(orgB, 'task')
  if (projects.length < 2 || tasks.length < 2) {
    orgB.fixture = false
    return
  }
  projects[0].title = 'Dinner'
  projects[1].title = 'Buy cutlery'
  tasks[0].title = 'cut the bread'
  tasks[0].parent_id = projects[0].id
  tasks[1].title = 'bread knife'
  tasks[1].parent_id = projects[1].id
  tasks[0].fixture = 'cut the bread'
  tasks[1].fixture = 'bread knife'
  projects[0].fixture = 'Dinner'
  projects[1].fixture = 'Buy cutlery'
}

function stateCounts(size) {
  let done = Math.round(0.4 * size)
  let started = Math.round(0.25 * size)
  let unstarted = size - done - started
  if (unstarted < 0) {
    const take = Math.min(done, -unstarted)
    done -= take
    unstarted += take
  }
  if (unstarted < 0) {
    started += unstarted
    unstarted = 0
  }
  return { unstarted, started, done }
}

function splitStarted(started) {
  const base = Math.floor(started / 3)
  const extra = started % 3
  return {
    design: base + (extra > 0 ? 1 : 0),
    build: base + (extra > 1 ? 1 : 0),
    QA: base,
  }
}

function assignKanban(spaces, rng) {
  for (const space of spaces) {
    const { unstarted, started, done } = stateCounts(space.items.length)
    const bag = []
    for (let i = 0; i < unstarted; i++) bag.push('backlog')
    if (space.kind === 'org') {
      const columns = splitStarted(started)
      for (const name of ['design', 'build', 'QA']) {
        for (let i = 0; i < columns[name]; i++) bag.push(name)
      }
    } else {
      for (let i = 0; i < started; i++) bag.push('in progress')
    }
    for (let i = 0; i < done; i++) bag.push('done')
    if (bag.length !== space.items.length) {
      throw new Error(`Column plan for ${space.id} has ${bag.length} slots`)
    }
    const dealt = rng.shuffle(bag)
    space.items.forEach((item, index) => {
      item.kanban = dealt[index]
      item.state = STATE_OF[item.kanban]
    })
  }
}

function byActorId(a, b) {
  const [aKind, aNum] = a.split('-')
  const [bKind, bNum] = b.split('-')
  if (aKind !== bKind) return aKind < bKind ? -1 : 1
  return Number(aNum) - Number(bNum)
}

function assignContributors(items, members, rng) {
  const agentCount = Math.round(0.05 * items.length)
  const withAgent = new Set(rng.shuffle(items).slice(0, agentCount).map((item) => item.id))
  const agents = ['agent-1', 'agent-2']
  for (const item of items) {
    const people = members.get(item.space) ?? []
    const chosen = []
    if (withAgent.has(item.id)) {
      const extras = people.length === 0 ? 0 : rng.int(Math.min(2, people.length) + 1)
      chosen.push(...rng.shuffle(people).slice(0, extras), rng.pick(agents))
    } else if (people.length > 0) {
      const count = rng.int(Math.min(3, people.length) + 1)
      chosen.push(...rng.shuffle(people).slice(0, count))
    }
    chosen.sort(byActorId)
    item.contributors = chosen.join(';')
    item.lead = chosen.length === 0 ? '' : rng.pick(chosen)
  }
}

function scaled(n, at10k) {
  return Math.round((at10k * n) / 10000)
}

function sentences(rng) {
  const count = 1 + rng.int(3)
  const parts = []
  for (let i = 0; i < count; i++) {
    parts.push(`${capitalize(rng.pick(VERBS))} the ${rng.pick(NOUNS)}.`)
  }
  return parts.join(' ')
}

function effortValue(rng) {
  const steps = 1 + rng.int(80)
  return String(steps / 2)
}

function scheduledInstant(rng) {
  const day = -60 + rng.int(151)
  const minute = rng.int(24 * 60)
  return new Date(EPOCH + day * DAY + minute * 60 * 1000).toISOString()
}

function pickSet(items, quota, required, rng) {
  const chosen = []
  const seen = new Set()
  for (const item of required) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    chosen.push(item)
  }
  for (const item of rng.shuffle(items)) {
    if (chosen.length >= quota) break
    if (seen.has(item.id)) continue
    seen.add(item.id)
    chosen.push(item)
  }
  return chosen
}

function assignDetails(items, rng) {
  const required = items.filter((item) => item.fixture === 'cut the bread' || item.fixture === 'bread knife')
  const described = new Set(pickSet(items, Math.round(0.5 * items.length), [], rng).map((item) => item.id))
  const withEffort = new Set(
    pickSet(items, Math.max(Math.round(0.7 * items.length), required.length), required, rng).map((item) => item.id),
  )
  const withTime = new Set(
    pickSet(items, Math.max(Math.round(0.3 * items.length), required.length), required, rng).map((item) => item.id),
  )
  for (const item of items) {
    item.description = described.has(item.id) ? sentences(rng) : ''
    item.effort = withEffort.has(item.id) ? effortValue(rng) : ''
    item.scheduled_time = withTime.has(item.id) ? scheduledInstant(rng) : ''
  }
}

function buildRelations(items) {
  return items
    .filter((item) => item.parent_id)
    .map((item) => ({ parent_id: item.parent_id, child_id: item.id }))
}

function buildCatalog(actors) {
  const spaces = []
  for (const actor of actors) {
    if (actor.kind !== 'person') continue
    const n = actor.id.slice('person-'.length)
    spaces.push({ id: `personal-${n}`, name: actor.name, kind: 'personal' })
  }
  spaces.push(
    { id: 'org-a', name: 'Organisation A', kind: 'organisation' },
    { id: 'org-b', name: 'Organisation B', kind: 'organisation' },
  )
  const members = []
  for (const actor of actors) {
    if (!actor.spaces) continue
    for (const membership of actor.spaces.split(';')) {
      const [space, role] = membership.split(':')
      members.push({ space, actor_id: actor.id, role })
    }
  }
  const columns = []
  for (const space of spaces) {
    const list = space.kind === 'organisation' ? ORG_COLUMNS : PERSONAL_COLUMNS
    list.forEach((name, index) => {
      columns.push({
        space: space.id,
        name,
        state: STATE_OF[name],
        position: String(index + 1),
      })
    })
  }
  return { spaces, members, columns }
}

function buildTags() {
  return NOUNS.map((name, index) => ({ id: `tag-${index + 1}`, name: capitalize(name) }))
}

function buildItemTags(items, tags, rng) {
  const rows = []
  for (const item of items) {
    const count = rng.int(4)
    const chosen = new Set()
    while (chosen.size < count) chosen.add(rng.int(tags.length))
    for (const index of [...chosen].sort((a, b) => a - b)) {
      rows.push({ item_id: item.id, tag_id: tags[index].id })
    }
  }
  return rows
}

function crossRoom(items) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const projects = new Map()
  for (const item of items) {
    const project = projectOf(item, byId).id
    if (!projects.has(item.space)) projects.set(item.space, new Set())
    projects.get(item.space).add(project)
  }
  for (const ids of projects.values()) if (ids.size >= 2) return true
  return false
}

function projectOf(item, byId) {
  let current = item
  const seen = new Set()
  while (current.parent_id) {
    if (seen.has(current.id)) break
    seen.add(current.id)
    current = byId.get(current.parent_id)
  }
  return current
}

function buildBlockers(items, rng) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const bySpace = new Map()
  for (const item of items) {
    if (!bySpace.has(item.space)) bySpace.set(item.space, [])
    bySpace.get(item.space).push(item)
  }
  const knife = items.find((item) => item.fixture === 'bread knife')
  const bread = items.find((item) => item.fixture === 'cut the bread')
  let count = scaled(items.length, 800)
  if (knife && bread && count < 1) count = 1
  const crossTarget = crossRoom(items) ? Math.round(0.1 * count) : 0
  const blockers = []
  const used = new Set()
  const degree = new Map()

  function rootsDiffer(a, b) {
    return projectOf(a, byId).id !== projectOf(b, byId).id
  }

  function add(blocker, blocked, severity) {
    if (!blocker || !blocked || blocker.id === blocked.id || blocker.space !== blocked.space) return false
    const key = `${blocker.id}|${blocked.id}`
    if (used.has(key)) return false
    if ((degree.get(blocker.id) ?? 0) >= 2 || (degree.get(blocked.id) ?? 0) >= 2) return false
    used.add(key)
    degree.set(blocker.id, (degree.get(blocker.id) ?? 0) + 1)
    degree.set(blocked.id, (degree.get(blocked.id) ?? 0) + 1)
    blockers.push({
      id: `blocker-${blockers.length + 1}`,
      blocker_item_id: blocker.id,
      blocked_item_id: blocked.id,
      severity,
    })
    return true
  }

  if (knife && bread) add(knife, bread, 'cannot do anything')

  const spaceIds = [...bySpace.keys()]
  let guard = 0
  while (blockers.filter((row) => rootsDiffer(byId.get(row.blocker_item_id), byId.get(row.blocked_item_id))).length < crossTarget) {
    if (++guard > 100000) throw new Error('Could not place cross-project blockers')
    const group = bySpace.get(rng.pick(spaceIds))
    const byProject = new Map()
    for (const item of group) {
      const project = projectOf(item, byId).id
      if (!byProject.has(project)) byProject.set(project, [])
      byProject.get(project).push(item)
    }
    const projects = [...byProject.keys()]
    if (projects.length < 2) continue
    const left = rng.pick(projects)
    const right = rng.pick(projects.filter((id) => id !== left))
    add(rng.pick(byProject.get(left)), rng.pick(byProject.get(right)), rng.pick(SEVERITIES))
  }

  guard = 0
  while (blockers.length < count) {
    if (++guard > 100000) throw new Error('Could not place blockers')
    const group = bySpace.get(rng.pick(spaceIds))
    const byProject = new Map()
    for (const item of group) {
      const project = projectOf(item, byId).id
      if (!byProject.has(project)) byProject.set(project, [])
      byProject.get(project).push(item)
    }
    const crowded = [...byProject.values()].filter((list) => list.length >= 2)
    if (crowded.length === 0) continue
    const list = rng.pick(crowded)
    const blocker = rng.pick(list)
    const blocked = rng.pick(list.filter((item) => item.id !== blocker.id))
    add(blocker, blocked, rng.pick(SEVERITIES))
  }
  return blockers
}

function buildArtifacts(items, rng) {
  const count = scaled(items.length, 2000)
  let shared = Math.round(0.15 * count)
  if (count >= 8 && shared < 1) shared = 1
  const artifacts = []
  const links = []
  for (let i = 0; i < count; i++) {
    const id = `artifact-${i + 1}`
    const wanted = i < shared ? 2 + rng.int(2) : 1
    const take = Math.min(wanted, items.length)
    const chosen = new Set()
    let guard = 0
    while (chosen.size < take && ++guard < take * 20) chosen.add(rng.int(items.length))
    artifacts.push({
      id,
      title: `Notes on the ${rng.pick(NOUNS)}`,
      url: `https://example.test/a/${id}`,
    })
    for (const index of [...chosen].sort((a, b) => a - b)) {
      links.push({ item_id: items[index].id, artifact_id: id })
    }
  }
  return { artifacts, links }
}

function buildEvents(items, blockers, members, rng) {
  const incidents = new Map()
  for (const blocker of blockers) {
    for (const id of [blocker.blocker_item_id, blocker.blocked_item_id]) {
      if (!incidents.has(id)) incidents.set(id, [])
      incidents.get(id).push(blocker.id)
    }
  }
  const rows = []
  let next = 1
  for (const item of items) {
    const columns = item.space.startsWith('personal-') ? PERSONAL_COLUMNS : ORG_COLUMNS
    const current = columns.indexOf(item.kanban)
    const blockerIds = incidents.get(item.id) ?? []
    const details = [{ kind: 'created', detail: '' }]
    const roomForEarlier = 4 - 2 - blockerIds.length
    if (current > 0 && roomForEarlier >= 1) details.push({ kind: 'column', detail: columns[0] })
    details.push({ kind: 'column', detail: item.kanban })
    for (const id of blockerIds) details.push({ kind: 'blocker', detail: id })

    const start = EPOCH - (60 * DAY) + rng.int(30 * DAY)
    const step = Math.max(60 * 1000, Math.floor((EPOCH - start) / details.length))
    const people = members.get(item.space) ?? []
    const actor = item.lead || people[0] || 'person-1'
    details.forEach((entry, index) => {
      rows.push({
        id: `event-${next++}`,
        item_id: item.id,
        at: new Date(Math.min(EPOCH, start + index * step)).toISOString(),
        actor_id: actor,
        kind: entry.kind,
        detail: entry.detail,
      })
    })
  }
  return rows
}

function csvField(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

function toCsv(rows, headers) {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => csvField(row[header])).join(','))
  }
  return `${lines.join('\n')}\n`
}

function checkActors(actors) {
  const persons = actors.filter((actor) => actor.kind === 'person')
  const agents = actors.filter((actor) => actor.kind === 'agent')
  if (persons.length !== 10 || agents.length !== 2) {
    throw new Error('Expected 10 persons and 2 agents')
  }
  if (agents.some((actor) => actor.spaces !== '')) {
    throw new Error('Agents are contributors, not space members')
  }
  const orgA = []
  const orgB = []
  for (const person of persons) {
    const memberships = person.spaces.split(';')
    const personal = `personal-${person.id.slice('person-'.length)}:admin`
    if (!memberships.includes(personal)) {
      throw new Error(`${person.id} does not administer their personal space`)
    }
    for (const membership of memberships) {
      if (membership.startsWith('org-a:')) orgA.push(person.id)
      if (membership.startsWith('org-b:')) orgB.push(person.id)
    }
  }
  if (orgA.length !== 7 || orgB.length !== 4) {
    throw new Error(`Organisation membership is ${orgA.length} and ${orgB.length}`)
  }
  const both = orgA.filter((id) => orgB.includes(id))
  if (both.length !== 1) throw new Error('One person must sit in both organisations')
}

function ancestorChain(item, byId) {
  const chain = [item]
  const seen = new Set([item.id])
  let current = item
  while (current.parent_id) {
    const parent = byId.get(current.parent_id)
    if (!parent) throw new Error(`${item.id} points at a missing parent`)
    if (seen.has(parent.id)) throw new Error(`Cycle at ${parent.id}`)
    if (parent.space !== item.space) throw new Error(`${item.id} crosses spaces`)
    seen.add(parent.id)
    chain.push(parent)
    current = parent
    if (chain.length > 5) throw new Error(`${item.id} is deeper than 5`)
  }
  return chain
}

function checkItems(items, spaces, members) {
  if (items.length !== spaces.reduce((sum, space) => sum + space.quota, 0)) {
    throw new Error('Item count does not match the space quotas')
  }
  const byId = new Map(items.map((item) => [item.id, item]))
  let maxDepth = 1
  let fullChain = false
  const tasksWithSubtasks = new Set()
  for (const item of items) {
    if (!STATE_OF[item.kanban]) throw new Error(`${item.id} has an unknown column`)
    if (item.state !== STATE_OF[item.kanban]) {
      throw new Error(`${item.id} state ${item.state} does not follow ${item.kanban}`)
    }
    const space = spaces.find((candidate) => candidate.id === item.space)
    const allowed = space.kind === 'org' ? ORG_COLUMNS : PERSONAL_COLUMNS
    if (!allowed.includes(item.kanban)) {
      throw new Error(`${item.kanban} is not a column of ${item.space}`)
    }
    const isProject = item.level === 'project'
    if (isProject !== (item.parent_id === '')) {
      throw new Error(`${item.id} parent link does not match its level`)
    }
    const chain = ancestorChain(item, byId)
    maxDepth = Math.max(maxDepth, chain.length)
    if (chain.map((node) => node.level).join('>') === 'subtask>task>story>epic>project') {
      fullChain = true
    }
    if (item.level === 'subtask' && chain[1]?.level === 'task') tasksWithSubtasks.add(chain[1].id)

    const listed = item.contributors ? item.contributors.split(';') : []
    if (listed.length > 3) throw new Error(`${item.id} has more than 3 contributors`)
    if ((item.lead === '') !== (listed.length === 0)) {
      throw new Error(`${item.id} lead does not match its contributors`)
    }
    if (item.lead && !listed.includes(item.lead)) {
      throw new Error(`${item.id} lead is not a contributor`)
    }
    const allowedPeople = new Set(members.get(item.space) ?? [])
    for (const id of listed) {
      const isAgent = id === 'agent-1' || id === 'agent-2'
      if (!isAgent && !allowedPeople.has(id)) {
        throw new Error(`${item.id} contributor ${id} is not a member of ${item.space}`)
      }
    }
  }

  for (const space of spaces) {
    const rows = items.filter((item) => item.space === space.id)
    const expected = stateCounts(rows.length)
    const states = { unstarted: 0, started: 0, done: 0 }
    const columns = {}
    for (const row of rows) {
      states[row.state] += 1
      columns[row.kanban] = (columns[row.kanban] ?? 0) + 1
    }
    for (const state of ['unstarted', 'started', 'done']) {
      const actual = states[state]
      const want = state === 'unstarted' ? expected.unstarted : state === 'started' ? expected.started : expected.done
      if (actual !== want) throw new Error(`${space.id} ${state} is ${actual}, expected ${want}`)
    }
    if (space.kind === 'org') {
      const started = splitStarted(expected.started)
      for (const name of ['design', 'build', 'QA']) {
        if ((columns[name] ?? 0) !== started[name]) {
          throw new Error(`${space.id} column ${name} is ${columns[name] ?? 0}`)
        }
      }
    }
  }

  const taskCount = items.filter((item) => item.level === 'task').length
  if (taskCount >= 20) {
    const share = tasksWithSubtasks.size / taskCount
    if (share < 0.05 || share > 0.15) {
      throw new Error(`Tasks with subtasks are ${(share * 100).toFixed(1)}%`)
    }
  }
  const levelsPresent = LEVELS.every((level) => items.some((item) => item.level === level))
  if (levelsPresent && !fullChain) throw new Error('No chain of 5 levels')
  if (maxDepth > 5) throw new Error(`Depth is ${maxDepth}`)

  const orgB = spaces.find((space) => space.id === 'org-b')
  if (orgB?.fixture) {
    const dinner = items.find((item) => item.fixture === 'Dinner')
    const cutlery = items.find((item) => item.fixture === 'Buy cutlery')
    const bread = items.find((item) => item.fixture === 'cut the bread')
    const knife = items.find((item) => item.fixture === 'bread knife')
    if (!dinner || !cutlery || !bread || !knife) throw new Error('The bread example is missing')
    if (bread.parent_id !== dinner.id || knife.parent_id !== cutlery.id) {
      throw new Error('The bread example is not parented')
    }
    if ([dinner, cutlery, bread, knife].some((item) => item.space !== 'org-b')) {
      throw new Error('The bread example is not in organisation B')
    }
  }

  const agentItems = items.filter((item) => item.contributors.split(';').some((id) => id.startsWith('agent-')))
  if (agentItems.length !== Math.round(0.05 * items.length)) {
    throw new Error(`Agent contributors are on ${agentItems.length} items`)
  }
  return { maxDepth, fullChain }
}

function validEffort(text) {
  if (!/^\d+(?:\.5)?$/.test(text)) return false
  const value = Number(text)
  const steps = Math.round(value * 2)
  return steps >= 1 && steps <= 80 && Math.abs(value * 2 - steps) < 1e-9
}

function checkRecords(bundle) {
  const { items, actors, catalog, relations, tags, itemTags, blockers, artifacts, links, events } = bundle
  const byId = new Map(items.map((item) => [item.id, item]))
  const actorIds = new Set(actors.map((actor) => actor.id))

  if (catalog.spaces.length !== 12) throw new Error('Expected 10 personal spaces and 2 organisations')
  const memberKey = catalog.members.map((row) => `${row.space}:${row.actor_id}:${row.role}`).join(';')
  const actorKey = actors
    .flatMap((actor) => (actor.spaces ? actor.spaces.split(';').map((entry) => {
      const [space, role] = entry.split(':')
      return `${space}:${actor.id}:${role}`
    }) : []))
    .join(';')
  if (memberKey !== actorKey) throw new Error('members.csv does not match the actors')

  const columnKey = new Set(catalog.columns.map((row) => `${row.space}|${row.name}|${row.state}`))
  if (catalog.columns.length !== 10 * 3 + 2 * 5) throw new Error('Column catalog has the wrong size')
  for (const row of catalog.columns) {
    if (STATE_OF[row.name] !== row.state) throw new Error(`Column ${row.name} has state ${row.state}`)
  }

  const relationKey = relations.map((row) => `${row.parent_id}|${row.child_id}`).join(';')
  const parentKey = items.filter((item) => item.parent_id).map((item) => `${item.parent_id}|${item.id}`).join(';')
  if (relationKey !== parentKey) throw new Error('relations.csv does not match parent_id')

  if (tags.length !== 40) throw new Error('Expected 40 tags')
  const tagIds = new Set(tags.map((tag) => tag.id))
  const tagsOnItem = new Map()
  for (const row of itemTags) {
    if (!byId.has(row.item_id) || !tagIds.has(row.tag_id)) throw new Error('item_tags.csv points at an unknown id')
    if (!tagsOnItem.has(row.item_id)) tagsOnItem.set(row.item_id, new Set())
    const set = tagsOnItem.get(row.item_id)
    if (set.has(row.tag_id)) throw new Error(`${row.item_id} repeats ${row.tag_id}`)
    set.add(row.tag_id)
    if (set.size > 3) throw new Error(`${row.item_id} has more than 3 tags`)
  }

  const described = items.filter((item) => item.description !== '')
  if (described.length !== Math.round(0.5 * items.length)) {
    throw new Error(`Descriptions are on ${described.length} items`)
  }
  for (const item of described) {
    const sentences = item.description.split('. ').length
    if (sentences < 1 || sentences > 3 || !item.description.endsWith('.')) {
      throw new Error(`${item.id} description is not one to three sentences`)
    }
  }

  const breadTasks = items.filter((item) => item.fixture === 'cut the bread' || item.fixture === 'bread knife')
  const withEffort = items.filter((item) => item.effort !== '')
  const withTime = items.filter((item) => item.scheduled_time !== '')
  if (withEffort.length !== Math.max(Math.round(0.7 * items.length), breadTasks.length)) {
    throw new Error(`Effort is on ${withEffort.length} items`)
  }
  if (withTime.length !== Math.max(Math.round(0.3 * items.length), breadTasks.length)) {
    throw new Error(`Scheduled time is on ${withTime.length} items`)
  }
  for (const item of withEffort) {
    if (!validEffort(item.effort)) throw new Error(`${item.id} effort is ${item.effort}`)
  }
  const earliest = EPOCH - 60 * DAY
  const latest = EPOCH + 90 * DAY + DAY
  for (const item of withTime) {
    const at = Date.parse(item.scheduled_time)
    if (Number.isNaN(at) || at < earliest || at >= latest) {
      throw new Error(`${item.id} scheduled time is outside the window`)
    }
  }
  for (const item of breadTasks) {
    if (!item.effort || !item.scheduled_time) throw new Error(`${item.title} needs effort and a scheduled time`)
  }

  const wantBlockers = Math.max(scaled(items.length, 800), breadTasks.length === 2 ? 1 : 0)
  if (blockers.length !== wantBlockers) throw new Error(`Blockers are ${blockers.length}, expected ${wantBlockers}`)
  let cross = 0
  for (const row of blockers) {
    if (!SEVERITIES.includes(row.severity)) throw new Error(`Severity ${row.severity} is unknown`)
    const blocker = byId.get(row.blocker_item_id)
    const blocked = byId.get(row.blocked_item_id)
    if (!blocker || !blocked || blocker.space !== blocked.space || blocker.id === blocked.id) {
      throw new Error(`${row.id} is not a link inside one space`)
    }
    if (projectOf(blocker, byId).id !== projectOf(blocked, byId).id) cross += 1
  }
  if (blockers.length >= 10 && crossRoom(items) && cross !== Math.round(0.1 * blockers.length)) {
    throw new Error(`Cross-project blockers are ${cross}`)
  }
  if (breadTasks.length === 2) {
    const knife = items.find((item) => item.fixture === 'bread knife')
    const bread = items.find((item) => item.fixture === 'cut the bread')
    const link = blockers.find((row) => row.blocker_item_id === knife.id && row.blocked_item_id === bread.id)
    if (!link || link.severity !== 'cannot do anything') throw new Error('The bread knife blocker is missing')
  }

  const wantArtifacts = scaled(items.length, 2000)
  if (artifacts.length !== wantArtifacts) throw new Error(`Artifacts are ${artifacts.length}, expected ${wantArtifacts}`)
  const linksByArtifact = new Map()
  for (const row of links) {
    if (!byId.has(row.item_id)) throw new Error(`${row.artifact_id} points at an unknown item`)
    if (!linksByArtifact.has(row.artifact_id)) linksByArtifact.set(row.artifact_id, new Set())
    linksByArtifact.get(row.artifact_id).add(row.item_id)
  }
  let shared = 0
  for (const artifact of artifacts) {
    if (!artifact.title || !artifact.url.startsWith('https://')) throw new Error(`${artifact.id} needs a title and a URL`)
    const linked = linksByArtifact.get(artifact.id)
    if (!linked || linked.size < 1) throw new Error(`${artifact.id} is not linked to an item`)
    if (linked.size > 1) shared += 1
  }
  if (artifacts.length >= 8 && shared < 1) throw new Error('No artifact is shared by several items')

  const eventsByItem = new Map()
  for (const row of events) {
    if (!eventsByItem.has(row.item_id)) eventsByItem.set(row.item_id, [])
    eventsByItem.get(row.item_id).push(row)
    if (!actorIds.has(row.actor_id)) throw new Error(`${row.id} actor ${row.actor_id} is unknown`)
  }
  for (const item of items) {
    const mine = eventsByItem.get(item.id) ?? []
    if (mine.length < 2 || mine.length > 4) throw new Error(`${item.id} has ${mine.length} events`)
    if (mine[0].kind !== 'created') throw new Error(`${item.id} does not start with created`)
    let previous = -Infinity
    const columnEvents = []
    for (const row of mine) {
      const at = Date.parse(row.at)
      if (Number.isNaN(at) || at < previous || at > EPOCH) throw new Error(`${row.id} is out of order`)
      previous = at
      if (row.kind === 'column') columnEvents.push(row)
    }
    if (columnEvents.length === 0 || columnEvents[columnEvents.length - 1].detail !== item.kanban) {
      throw new Error(`${item.id} column history does not end on ${item.kanban}`)
    }
    if (columnEvents.length > 1 && !columnKey.has(`${item.space}|${columnEvents[0].detail}|${STATE_OF[columnEvents[0].detail]}`)) {
      throw new Error(`${item.id} names an unknown column`)
    }
  }
  for (const row of blockers) {
    for (const itemId of [row.blocker_item_id, row.blocked_item_id]) {
      const mine = eventsByItem.get(itemId) ?? []
      if (!mine.some((event) => event.kind === 'blocker' && event.detail === row.id)) {
        throw new Error(`${row.id} has no event on ${itemId}`)
      }
    }
  }
}

function summary(items, maxDepth, counts) {
  const levels = Object.fromEntries(LEVELS.map((level) => [level, 0]))
  const states = { unstarted: 0, started: 0, done: 0 }
  for (const item of items) {
    levels[item.level] += 1
    states[item.state] += 1
  }
  const levelText = LEVELS.map((level) => `${level} ${levels[level]}`).join(', ')
  const stateText = ['unstarted', 'started', 'done'].map((state) => `${state} ${states[state]}`).join(', ')
  return `${items.length} items: ${levelText}; ${stateText}; depth ${maxDepth}; blockers ${counts.blockers}, artifacts ${counts.artifacts}, events ${counts.events}`
}

function main() {
  const { items: count, out } = parseArgs(process.argv.slice(2))
  const rng = rngFrom(mulberry32(0x4c657263))
  const actors = buildActors()
  const spaces = planSpaces(count)
  const items = buildItems(spaces, rng)
  assignKanban(spaces, rng)
  const members = membersOf(actors)
  assignContributors(items, members, rng)
  assignDetails(items, rng)
  const relations = buildRelations(items)
  const catalog = buildCatalog(actors)
  const tags = buildTags()
  const itemTags = buildItemTags(items, tags, rng)
  const blockers = buildBlockers(items, rng)
  const { artifacts, links } = buildArtifacts(items, rng)
  const events = buildEvents(items, blockers, members, rng)

  checkActors(actors)
  const { maxDepth } = checkItems(items, spaces, members)
  checkRecords({ items, actors, catalog, relations, tags, itemTags, blockers, artifacts, links, events })

  const stored = resolve(out)
  mkdirSync(stored, { recursive: true })
  const files = [
    ['actors.csv', actors, ['id', 'name', 'kind', 'spaces']],
    ['spaces.csv', catalog.spaces, ['id', 'name', 'kind']],
    ['members.csv', catalog.members, ['space', 'actor_id', 'role']],
    ['columns.csv', catalog.columns, ['space', 'name', 'state', 'position']],
    ['tasks.csv', items, ['id', 'space', 'level', 'title', 'parent_id', 'kanban', 'state', 'lead', 'contributors', 'description', 'effort', 'scheduled_time']],
    ['relations.csv', relations, ['parent_id', 'child_id']],
    ['tags.csv', tags, ['id', 'name']],
    ['item_tags.csv', itemTags, ['item_id', 'tag_id']],
    ['blockers.csv', blockers, ['id', 'blocker_item_id', 'blocked_item_id', 'severity']],
    ['artifacts.csv', artifacts, ['id', 'title', 'url']],
    ['item_artifacts.csv', links, ['item_id', 'artifact_id']],
    ['events.csv', events, ['id', 'item_id', 'at', 'actor_id', 'kind', 'detail']],
  ]
  for (const [name, rows, headers] of files) writeFileSync(join(stored, name), toCsv(rows, headers))
  console.log(`Wrote ${files.length} files to ${stored}`)
  console.log(summary(items, maxDepth, {
    blockers: blockers.length,
    artifacts: artifacts.length,
    events: events.length,
  }))
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
