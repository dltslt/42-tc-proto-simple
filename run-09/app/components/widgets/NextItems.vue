<script setup lang="ts">
// <WidgetsNextItems /> — auto-imported by Nuxt from app/components/widgets/NextItems.vue.
// Shows the current person's items that are not done, ordered by the stub in
// server/utils/ordering.ts, and names that ordering at the top of the widget.
defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick } = useDashboardContext()

const { data } = await useFetch<{
  actor: string
  ordering: string
  items: Array<{
    id: string
    level: string
    title: string
    kanban: string
    state: string
    lead: string
    effort: string
    scheduled_time: string
  }>
}>('/api/widgets/next', {
  query: computed(() => ({ space: spaceId.value, _t: refreshTick.value })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, refreshTick]
})

function formatShortDate(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}
</script>

<template>
  <div class="next-widget">
    <p class="ordering-note">
      Ordering (OPEN stub): <strong>{{ data?.ordering }}</strong>
    </p>

    <div v-if="!data?.items?.length" class="empty-msg">
      No open items assigned to {{ actorId }} in {{ spaceId }}.
    </div>

    <ul v-else class="item-list">
      <li v-for="item in data.items" :key="item.id" class="item-row">
        <span class="state-dot" :class="`state-${item.state}`" :title="item.state" />
        <span class="item-id">{{ item.id }}</span>
        <span class="item-level">{{ item.level }}</span>
        <span class="item-title">{{ item.title }}</span>
        <span class="item-meta">
          <span class="pill col-pill">{{ item.kanban }}</span>
          <span v-if="item.effort" class="pill effort-pill">{{ item.effort }}h</span>
          <span v-if="item.scheduled_time" class="pill date-pill">
            {{ formatShortDate(item.scheduled_time) }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.next-widget {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ordering-note {
  margin: 0;
  font-size: 0.74rem;
  color: #57606a;
  background: #f6f8fa;
  padding-block: 0.3rem;
  padding-inline: 0.5rem;
  border-radius: 4px;
  border-inline-start: 3px solid #0969da;
}

.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.4rem;
  padding-block: 0.35rem;
  padding-inline: 0.45rem;
  border: 1px solid #eaeef2;
  border-radius: 6px;
  font-size: 0.8rem;
}

.state-dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.state-started {
  background: #0969da;
}

.state-unstarted {
  background: #8c959f;
}

.item-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #57606a;
}

.item-level {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #656d76;
  background: #eff2f5;
  padding-block: 0.08rem;
  padding-inline: 0.35rem;
  border-radius: 3px;
}

.item-title {
  font-weight: 500;
  color: #1f2328;
  min-inline-size: 0;
}

.item-meta {
  margin-inline-start: auto;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pill {
  font-size: 0.7rem;
  padding-block: 0.1rem;
  padding-inline: 0.38rem;
  border-radius: 999px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  color: #24292f;
}

.effort-pill {
  background: #fff8c5;
  border-color: #d4a72c55;
}

.date-pill {
  background: #ddf4ff;
  border-color: #54aeff55;
}

.empty-msg {
  color: #656d76;
  font-size: 0.8rem;
  padding: 0.5rem 0;
}
</style>
