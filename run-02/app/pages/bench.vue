<script setup lang="ts">
// A run's one page lives in app/pages/. app.vue renders <NuxtPage>, which
// swaps in the page component for the current URL. The router is part of
// Nuxt; a file here becomes the route /bench automatically.
// ref makes a reactive value; assigning to it re-renders the page.
const results = ref<Array<Record<string, unknown>>>([])
const running = ref(false)
const progress = ref('')
const totalMs = ref(0)
const startedAt = ref('')

// The query set is fixed, so the page names it instead of reading it
// from the server. The SQL itself comes with every response.
const QUERIES = [
  { id: 1, label: 'column page, newest change first' },
  { id: 2, label: 'item panel: children, parent chain, tags, artifacts, blockers' },
  { id: 3, label: 'project subtree, all levels' },
  { id: 4, label: 'open blockers grouped by severity, both titles' },
  { id: 5, label: "one person's open items, every space they are a member of" },
  { id: 6, label: 'scheduled time in one week' },
  { id: 7, label: 'items with a tag, and their other tags counted' },
  { id: 8, label: 'move item to another column, event in same transaction' },
  { id: 9, label: 'counts per column and per state' },
  { id: 10, label: 'title search, first 20 hits' },
]

const RUNS = 20

// Which file the server reads, so a 10k and a 100k run are never confused.
const info = ref<Record<string, unknown> | null>(null)
$fetch('/api/dbinfo').then((response) => { info.value = response })

// $fetch is Nuxt's request helper; unlike useFetch it does not cache or
// re-run on navigation, which is what repeated timing calls want.
async function runAll() {
  running.value = true
  results.value = []
  totalMs.value = 0
  const t0 = performance.now()
  for (const query of QUERIES) {
    const times: number[] = []
    let sample: unknown[] = []
    let rowCount = 0
    let sql = ''
    let note = ''
    for (let i = 0; i < RUNS; i++) {
      progress.value = `q${query.id}, run ${i + 1}/${RUNS}`
      // await in a loop keeps the requests sequential: parallel requests
      // would compete for the same SQLite file and skew the timings.
      const response = await $fetch<Record<string, unknown>>(`/api/q${query.id}`)
      times.push(Number(response.ms))
      if (i === 0) {
        sample = response.rows as unknown[]
        rowCount = Number(response.rowCount)
        sql = String(response.sql)
        note = String(response.note ?? '')
      }
    }
    const sorted = [...times].sort((a, b) => a - b)
    results.value.push({
      ...query,
      median: sorted[Math.floor(sorted.length / 2)],
      slowest: sorted[sorted.length - 1],
      rowCount,
      sql,
      note,
      sample,
    })
  }
  totalMs.value = Math.round(performance.now() - t0)
  startedAt.value = new Date().toLocaleTimeString()
  progress.value = ''
  running.value = false
}

onMounted(runAll)
</script>

<template>
  <main class="bench">
    <h1>query bench</h1>
    <p v-if="info">database: <code>{{ info.path }}</code> ({{ info.tasks }} items)</p>
    <p>
      Ten queries, {{ RUNS }} runs each, sequential. Times are what the server
      measured around the SQL, in milliseconds. <span v-if="startedAt">Last run finished at {{ startedAt }}.</span>
      <button :disabled="running" @click="runAll">Run again</button>
      <strong v-if="progress">{{ progress }}</strong>
    </p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>query</th>
          <th>median ms</th>
          <th>slowest ms</th>
          <th>rows</th>
          <th>first rows</th>
        </tr>
      </thead>
      <tbody>
        <!-- v-for walks the results array; :key tells Vue which row is which -->
        <tr v-for="result in results" :key="result.id">
          <td>q{{ result.id }}</td>
          <td>
            {{ result.label }}
            <details>
              <summary>sql</summary>
              <code>{{ result.sql }}</code>
              <em v-if="result.note">{{ result.note }}</em>
            </details>
          </td>
          <td class="num">{{ result.median }}</td>
          <td class="num">{{ result.slowest }}</td>
          <td class="num">{{ result.rowCount }}</td>
          <td><code>{{ JSON.stringify(result.sample).slice(0, 120) }}</code></td>
        </tr>
      </tbody>
    </table>
    <p v-if="totalMs">whole bench: {{ totalMs }} ms of client time</p>
  </main>
</template>

<style scoped>
/* scoped: the styles here only apply to this component's elements */
.bench { max-width: 72rem; margin: 0 auto; padding: 1rem 2rem; font-family: system-ui, sans-serif; }
table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
th, td { border: 1px solid #ccc; padding: 0.35rem 0.6rem; text-align: left; vertical-align: top; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
code { font-size: 0.75rem; word-break: break-all; }
summary { cursor: pointer; color: #06c; }
button { margin-left: 0.75rem; }
</style>
