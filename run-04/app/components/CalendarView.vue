<script setup lang="ts">
// Calendar view. Which items: filtered items with a scheduled time; items with
// effort but no time sit in the tray. How drawn: a week (7 tall days) or a
// month (6×7 grid) of small chips. Primary action: drag a chip to a day.
const { filtered } = useFilter()
const { reschedule } = useItems()

const mode = ref<'week' | 'month'>('week')
const anchor = ref(startOfDay(new Date())) // a day inside the shown period

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function monday(d: Date) { return addDays(d, -((d.getDay() + 6) % 7)) } // weeks start on Monday
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` // local day id

// The days on screen: 7 for a week, 42 (six full weeks) for a month.
const days = computed(() => {
  const a = anchor.value
  const first = mode.value === 'week' ? monday(a) : monday(new Date(a.getFullYear(), a.getMonth(), 1))
  return Array.from({ length: mode.value === 'week' ? 7 : 42 }, (_, i) => addDays(first, i))
})

// Scheduled items grouped by local day, sorted by time within the day.
const byDay = computed(() => {
  const m = new Map<string, Item[]>()
  for (const it of filtered.value) {
    if (!it.scheduled_time) continue
    const k = key(new Date(it.scheduled_time))
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(it)
  }
  for (const list of m.values()) list.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
  return m
})

const tray = computed(() => filtered.value.filter((it) => !it.scheduled_time && it.effort !== null))

const title = computed(() =>
  mode.value === 'week'
    ? `Week of ${days.value[0]!.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : anchor.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
)

function step(n: number) {
  const a = new Date(anchor.value)
  if (mode.value === 'week') a.setDate(a.getDate() + 7 * n)
  else a.setMonth(a.getMonth() + n, 1)
  anchor.value = a
}

const over = ref('')
// Dropping keeps the item's time of day; a tray item gets 09:00 (a stub).
function onDrop(e: DragEvent, day: Date) {
  over.value = ''
  const id = e.dataTransfer?.getData('text/item')
  const item = filtered.value.find((it) => it.id === id)
  if (!item) return
  const when = new Date(day)
  if (item.scheduled_time) {
    const old = new Date(item.scheduled_time)
    when.setHours(old.getHours(), old.getMinutes())
    if (key(old) === key(day)) return
  } else when.setHours(9, 0)
  reschedule(item.id, when)
}

const today = key(new Date())
const inMonth = (d: Date) => mode.value === 'week' || d.getMonth() === anchor.value.getMonth()
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <section>
    <h2>Calendar
      <button :aria-pressed="mode === 'week'" @click="mode = 'week'">week</button>
      <button :aria-pressed="mode === 'month'" @click="mode = 'month'">month</button>
      <button @click="step(-1)">‹</button>
      <button @click="anchor = startOfDay(new Date())">today</button>
      <button @click="step(1)">›</button>
      <span class="muted">{{ title }}</span>
    </h2>
    <div class="layout">
      <div :class="['grid', mode]">
        <div v-for="d in days" :key="key(d)"
             :class="['day', { today: key(d) === today, out: !inMonth(d), 'drop-target': over === key(d) }]"
             @dragover.prevent="over = key(d)" @dragleave="over = ''" @drop="onDrop($event, d)">
          <div class="date">{{ d.toLocaleDateString(undefined, mode === 'week' ? { weekday: 'short', day: 'numeric' } : { day: 'numeric' }) }}</div>
          <div v-for="it in byDay.get(key(d)) ?? []" :key="it.id" class="entry">
            <span class="muted time">{{ hhmm(it.scheduled_time) }}</span>
            <ItemCard :item="it" size="chip" />
          </div>
        </div>
      </div>
      <aside>
        <h3>Tray <span class="muted">{{ tray.length }}</span></h3>
        <p class="muted hint">Effort, no time. Drag onto a day.</p>
        <ItemCard v-for="it in tray" :key="it.id" :item="it" size="chip" />
      </aside>
    </div>
  </section>
</template>

<style scoped>
section { display: flex; flex-direction: column; }
h2 { font-size: 15px; margin: 0 0 6px; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
h3 { font-size: 13px; margin: 0; }
.layout { display: grid; grid-template-columns: 1fr 160px; gap: 6px; flex: 1; min-height: 0; }
.grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px; }
.grid.week .day { min-height: 200px; }
.grid.month .day { min-height: 64px; }
.day { border: 1px solid var(--line); border-radius: 3px; padding: 2px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.day.out { opacity: 0.45; }
.day.today .date { color: var(--accent); font-weight: 600; }
.date { font-size: 11px; color: var(--muted); }
.entry { display: flex; flex-direction: column; min-width: 0; }
.time { font-size: 10px; }
aside { display: flex; flex-direction: column; gap: 2px; overflow: auto; border-left: 1px solid var(--line); padding-left: 6px; }
.hint { font-size: 11px; margin: 0 0 4px; }
</style>
