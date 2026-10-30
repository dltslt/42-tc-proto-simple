<script setup lang="ts">
// <WidgetsBlockersSeverity /> — open blockers in the space grouped by the spec's
// four severities: `cannot do anything`, `will be stuck`, `slowed down`, `nice to have`.
const props = defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick } = useDashboardContext()

const includeDone = computed(() => (props.settings?.includeDone ? '1' : '0'))

const { data } = await useFetch<{
  space: string
  total: number
  groups: Array<{
    severity: string
    items: Array<{
      id: string
      severity: string
      blocker_item_id: string
      blocker_title: string
      blocker_state: string
      blocker_kanban: string
      blocked_item_id: string
      blocked_title: string
      blocked_state: string
      blocked_kanban: string
    }>
  }>
}>('/api/widgets/blockers', {
  query: computed(() => ({
    space: spaceId.value,
    includeDone: includeDone.value,
    _t: refreshTick.value
  })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, includeDone, refreshTick]
})

function severityClass(sev: string): string {
  if (sev === 'cannot do anything') return 'sev-critical'
  if (sev === 'will be stuck') return 'sev-high'
  if (sev === 'slowed down') return 'sev-medium'
  return 'sev-low'
}
</script>

<template>
  <div class="blockers-widget">
    <div
      v-for="group in data?.groups || []"
      :key="group.severity"
      class="sev-group"
      :class="severityClass(group.severity)"
    >
      <div class="sev-header">
        <span class="sev-name">{{ group.severity }}</span>
        <span class="sev-count">{{ group.items.length }}</span>
      </div>

      <ul v-if="group.items.length" class="blocker-list">
        <li v-for="b in group.items" :key="b.id" class="blocker-row">
          <span class="b-pair">
            <strong>{{ b.blocker_item_id }}</strong> ({{ b.blocker_title }},
            <em>{{ b.blocker_kanban }}</em>)
            <span class="arrow">→ blocks →</span>
            <strong>{{ b.blocked_item_id }}</strong> ({{ b.blocked_title }},
            <em>{{ b.blocked_kanban }}</em>)
          </span>
        </li>
      </ul>
      <div v-else class="sev-none">None</div>
    </div>
  </div>
</template>

<style scoped>
.blockers-widget {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@container widget (inline-size > 520px) {
  .blockers-widget {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.sev-group {
  border: 1px solid #e5e9f0;
  border-radius: 6px;
  padding: 0.45rem 0.55rem;
  border-inline-start-width: 4px;
}

.sev-critical {
  border-inline-start-color: #cf222e;
  background: #fff8f8;
}

.sev-high {
  border-inline-start-color: #bc4c00;
  background: #fffaf5;
}

.sev-medium {
  border-inline-start-color: #9a6700;
  background: #fffef5;
}

.sev-low {
  border-inline-start-color: #57606a;
  background: #f8fafc;
}

.sev-header {
  display: flex;
  align-items: safe center;
  justify-content: space-between;
  font-size: 0.76rem;
  font-weight: 600;
  margin-block-end: 0.3rem;
}

.sev-count {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(0, 0, 0, 0.06);
  padding-inline: 0.35rem;
  border-radius: 999px;
  font-size: 0.7rem;
}

.blocker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.blocker-row {
  font-size: 0.75rem;
  color: #24292f;
  line-height: 1.35;
}

.arrow {
  color: #cf222e;
  font-weight: 600;
  margin-inline: 0.2rem;
}

.sev-none {
  font-size: 0.72rem;
  color: #8c959f;
}
</style>
