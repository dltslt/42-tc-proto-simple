<script setup lang="ts">
// <WidgetsUpcomingItems /> — items scheduled in the next N days (default 7).
// When the 100-item seed has no items inside the 7-day window, it also lists
// the nearest future scheduled items so the reader can see what comes next.
const props = defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick } = useDashboardContext()
const days = computed(() => Number(props.settings?.days) || 7)

const { data } = await useFetch<{
  space: string
  days: number
  items: Array<{
    id: string
    level: string
    title: string
    kanban: string
    state: string
    effort: string
    scheduled_time: string
  }>
  nearest: Array<{
    id: string
    level: string
    title: string
    kanban: string
    state: string
    effort: string
    scheduled_time: string
  }>
}>('/api/widgets/upcoming', {
  query: computed(() => ({
    space: spaceId.value,
    days: days.value,
    _t: refreshTick.value
  })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, days, refreshTick]
})

function formatDate(iso: string): string {
  return iso ? iso.slice(0, 10) : ''
}
</script>

<template>
  <div class="upcoming-widget">
    <ul v-if="data?.items?.length" class="up-list">
      <li v-for="item in data.items" :key="item.id" class="up-row">
        <span class="up-date">{{ formatDate(item.scheduled_time) }}</span>
        <span class="up-id">{{ item.id }}</span>
        <span class="up-title">{{ item.title }}</span>
        <span class="up-col">{{ item.kanban }}</span>
      </li>
    </ul>

    <div v-else class="fallback-wrap">
      <p class="window-note">
        0 items scheduled strictly within the next {{ days }} days (try setting Range to 14 or 30 days).
        Nearest upcoming in {{ spaceId }}:
      </p>
      <ul v-if="data?.nearest?.length" class="up-list">
        <li v-for="item in data.nearest" :key="item.id" class="up-row">
          <span class="up-date">{{ formatDate(item.scheduled_time) }}</span>
          <span class="up-id">{{ item.id }}</span>
          <span class="up-title">{{ item.title }}</span>
          <span class="up-col">{{ item.kanban }}</span>
        </li>
      </ul>
      <div v-else class="empty-msg">No future scheduled items in {{ spaceId }}.</div>
    </div>
  </div>
</template>

<style scoped>
.up-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.up-row {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.4rem;
  padding-block: 0.3rem;
  padding-inline: 0.45rem;
  border: 1px solid #eaeef2;
  border-radius: 6px;
  font-size: 0.77rem;
}

.up-date {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  background: #ddf4ff;
  color: #0969da;
  padding-inline: 0.35rem;
  padding-block: 0.08rem;
  border-radius: 4px;
}

.up-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #57606a;
}

.up-title {
  font-weight: 500;
  color: #1f2328;
}

.up-col {
  margin-inline-start: auto;
  font-size: 0.7rem;
  color: #57606a;
  background: #f6f8fa;
  padding-inline: 0.35rem;
  border-radius: 4px;
  border: 1px solid #d0d7de;
}

.window-note {
  margin: 0 0 0.45rem;
  font-size: 0.73rem;
  color: #57606a;
  background: #fff8c5;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
}

.empty-msg {
  font-size: 0.78rem;
  color: #656d76;
}
</style>
