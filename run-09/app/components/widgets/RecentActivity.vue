<script setup lang="ts">
// <WidgetsRecentActivity /> — shows the latest events recorded in the space.
// Moving an item on the Board inserts a new `column` event and refreshes this list.
const props = defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick } = useDashboardContext()
const limit = computed(() => Number(props.settings?.limit) || 8)

const { data } = await useFetch<{
  space: string
  events: Array<{
    id: string
    item_id: string
    item_title: string
    item_level: string
    at: string
    actor_id: string
    actor_name: string
    kind: string
    detail: string
  }>
}>('/api/widgets/activity', {
  query: computed(() => ({
    space: spaceId.value,
    limit: limit.value,
    _t: refreshTick.value
  })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, limit, refreshTick]
})

function formatTimestamp(iso: string): string {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}
</script>

<template>
  <div class="activity-widget" data-testid="activity-list">
    <div v-if="!data?.events?.length" class="empty-msg">
      No recent events in {{ spaceId }}.
    </div>

    <ul v-else class="event-list">
      <li v-for="ev in data.events" :key="ev.id" class="event-row">
        <span class="event-time">{{ formatTimestamp(ev.at) }}</span>
        <span class="event-actor">{{ ev.actor_name }}</span>
        <span class="event-desc">
          <template v-if="ev.kind === 'column'">
            moved <strong>{{ ev.item_id }}</strong> ({{ ev.item_title }}) to
            <span class="col-tag">{{ ev.detail }}</span>
          </template>
          <template v-else-if="ev.kind === 'created'">
            created <strong>{{ ev.item_id }}</strong> ({{ ev.item_title }})
          </template>
          <template v-else>
            {{ ev.kind }} <span v-if="ev.detail">({{ ev.detail }})</span> on
            <strong>{{ ev.item_id }}</strong> ({{ ev.item_title }})
          </template>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.event-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
  font-size: 0.76rem;
  padding-block: 0.28rem;
  border-block-end: 1px solid #f0f3f6;
}

.event-time {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  color: #656d76;
}

.event-actor {
  font-weight: 600;
  color: #0969da;
}

.event-desc {
  color: #24292f;
  min-inline-size: 0;
}

.col-tag {
  background: #ddf4ff;
  color: #0969da;
  padding-inline: 0.35rem;
  padding-block: 0.05rem;
  border-radius: 4px;
  font-weight: 600;
}

.empty-msg {
  color: #656d76;
  font-size: 0.8rem;
}
</style>
