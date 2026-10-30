<script setup lang="ts">
// <WidgetsLastTouched /> — items the acting person changed most recently,
// derived from the `events` table. Moving an item on the Board updates this list.
const props = defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick } = useDashboardContext()
const limit = computed(() => Number(props.settings?.limit) || 6)

const { data } = await useFetch<{
  space: string
  actor: string
  items: Array<{
    id: string
    level: string
    title: string
    kanban: string
    state: string
    last_at: string
    last_action: string
  }>
}>('/api/widgets/touched', {
  query: computed(() => ({
    space: spaceId.value,
    limit: limit.value,
    _t: refreshTick.value
  })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, limit, refreshTick]
})

function formatTime(iso: string): string {
  return iso ? iso.replace('T', ' ').slice(0, 16) : ''
}
</script>

<template>
  <div class="touched-widget" data-testid="touched-list">
    <div v-if="!data?.items?.length" class="empty-msg">
      No recorded events by {{ actorId }} in {{ spaceId }}.
    </div>

    <ul v-else class="touched-list">
      <li v-for="item in data.items" :key="item.id" class="touched-row">
        <div class="touched-main">
          <span class="t-id">{{ item.id }}</span>
          <span class="t-title">{{ item.title }}</span>
          <span class="t-col">{{ item.kanban }}</span>
        </div>
        <div class="touched-sub">
          <span>{{ item.last_action }}</span>
          <span class="t-time">{{ formatTime(item.last_at) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.touched-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.touched-row {
  padding: 0.35rem 0.45rem;
  border: 1px solid #eaeef2;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.touched-main {
  display: flex;
  align-items: safe center;
  gap: 0.4rem;
  font-size: 0.78rem;
}

.t-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #57606a;
}

.t-title {
  font-weight: 600;
  color: #1f2328;
}

.t-col {
  margin-inline-start: auto;
  font-size: 0.68rem;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  padding-inline: 0.35rem;
  border-radius: 4px;
}

.touched-sub {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #656d76;
}

.t-time {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.empty-msg {
  font-size: 0.78rem;
  color: #656d76;
}
</style>
