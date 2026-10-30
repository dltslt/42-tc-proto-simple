<script setup lang="ts">
// List view. Which items: everything the shared filter lets through.
// How drawn: one table row per item, the seven card fields as cells.
// Primary action: sort (by column, effort, or scheduled time).
const { filtered } = useFilter()
const { columns, actorName } = useMeta()

type Key = 'kanban' | 'effort' | 'scheduled_time'
const sortKey = ref<Key>('kanban')
const asc = ref(true)

function sortBy(k: Key) {
  if (sortKey.value === k) asc.value = !asc.value
  else { sortKey.value = k; asc.value = true }
}

// The column sorts by its board position, not by its name.
const colPos = computed(() => new Map(columns.value.map((c) => [c.name, Number(c.position)])))

// The value to sort on; null means "empty", and empties always go last.
function value(it: Item): number | null {
  if (sortKey.value === 'kanban') return colPos.value.get(it.kanban) ?? null
  if (sortKey.value === 'effort') return it.effort
  return it.scheduled_time ? Date.parse(it.scheduled_time) : null
}

const rows = computed(() =>
  [...filtered.value].sort((a, b) => {
    const x = value(a), y = value(b)
    if (x === null) return y === null ? 0 : 1
    if (y === null) return -1
    return asc.value ? x - y : y - x
  })
)

const arrow = (k: Key) => (sortKey.value === k ? (asc.value ? ' ▲' : ' ▼') : '')
const fmt = (iso: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<template>
  <section>
    <h2>List <span class="muted">· {{ rows.length }} items</span></h2>
    <table>
      <thead>
        <tr>
          <th>title</th><th>level</th>
          <th><button @click="sortBy('kanban')">column{{ arrow('kanban') }}</button></th>
          <th><button @click="sortBy('effort')">effort{{ arrow('effort') }}</button></th>
          <th><button @click="sortBy('scheduled_time')">scheduled{{ arrow('scheduled_time') }}</button></th>
          <th>contributors</th><th>tags</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="it in rows" :key="it.id" :class="it.state">
          <td>{{ it.title }}</td>
          <td class="muted">{{ it.level }}</td>
          <td><span class="col">{{ it.kanban }}</span></td>
          <td>{{ it.effort ?? '—' }}</td>
          <td>{{ fmt(it.scheduled_time) }}</td>
          <td class="muted">{{ it.contributors.map(actorName).join(', ') }}</td>
          <td class="muted">{{ it.tags.join(', ') }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
h2 { font-size: 15px; margin: 0 0 6px; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 3px 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { position: sticky; top: -8px; background: var(--panel); font-weight: 500; }
th button { border: none; padding: 0; background: none; font-weight: 500; color: var(--accent); }
tr td:first-child { border-left: 3px solid var(--line); }
tr.started td:first-child { border-left-color: orange; }
tr.done td:first-child { border-left-color: seagreen; }
.col { font-size: 12px; padding: 0 4px; border-radius: 3px; background: var(--drop); }
</style>
