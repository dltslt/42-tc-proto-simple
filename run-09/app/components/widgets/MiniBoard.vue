<script setup lang="ts">
// <WidgetsMiniBoard /> — a compact kanban board for one hierarchy level.
// Changing a card's column `<select>` posts to `/api/items/:id/move` and bumps
// `refreshTick` so Counts chart, Recent activity, Last touched, and My next items
// all update immediately.
const props = defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick, triggerDataRefresh } = useDashboardContext()

const level = computed(() => String(props.settings?.level || 'task'))
const mine = computed(() => (props.settings?.mine ? '1' : '0'))
const movingId = ref<string | null>(null)

const { data } = await useFetch<{
  space: string
  level: string
  onlyMine: boolean
  columns: Array<{ name: string; state: string; position: number }>
  items: Array<{
    id: string
    level: string
    title: string
    kanban: string
    state: string
    lead: string
    effort: string
  }>
}>('/api/widgets/board', {
  query: computed(() => ({
    space: spaceId.value,
    level: level.value,
    mine: mine.value,
    _t: refreshTick.value
  })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, level, mine, refreshTick]
})

function itemsForColumn(colName: string) {
  return (data.value?.items || []).filter(i => i.kanban === colName)
}

async function moveItem(itemId: string, newColumn: string) {
  movingId.value = itemId
  try {
    await $fetch(`/api/items/${itemId}/move`, {
      method: 'POST',
      headers: { 'x-actor': actorId.value },
      body: { kanban: newColumn }
    })
    triggerDataRefresh()
  } finally {
    movingId.value = null
  }
}
</script>

<template>
  <div class="board-widget" data-testid="mini-board">
    <div class="board-columns">
      <div
        v-for="col in data?.columns || []"
        :key="col.name"
        class="board-col"
        :data-column="col.name"
      >
        <div class="col-header">
          <span class="col-name">{{ col.name }}</span>
          <span class="col-count">{{ itemsForColumn(col.name).length }}</span>
        </div>

        <div class="col-cards">
          <div
            v-for="item in itemsForColumn(col.name)"
            :key="item.id"
            class="board-card"
            :data-item-id="item.id"
          >
            <div class="card-top">
              <span class="card-id">{{ item.id }}</span>
              <span v-if="item.lead" class="card-lead">{{ item.lead }}</span>
            </div>
            <div class="card-title">{{ item.title }}</div>
            <div class="card-Move">
              <label class="move-label">
                <span>Col:</span>
                <select
                  class="move-select"
                  :data-testid="`move-${item.id}`"
                  :value="item.kanban"
                  :disabled="movingId === item.id"
                  @change="moveItem(item.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option
                    v-for="c in data?.columns || []"
                    :key="c.name"
                    :value="c.name"
                  >
                    {{ c.name }}
                  </option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
  gap: 0.5rem;
  align-items: start;
}

.board-col {
  background: #f6f8fa;
  border: 1px solid #e5e9f0;
  border-radius: 6px;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-inline-size: 0;
}

.col-header {
  display: flex;
  justify-content: space-between;
  align-items: safe center;
  font-size: 0.75rem;
  font-weight: 600;
  padding-inline: 0.2rem;
}

.col-count {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  background: #eaeef2;
  padding-inline: 0.35rem;
  border-radius: 999px;
}

.col-cards {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-block-size: 240px;
  overflow-y: auto;
}

.board-card {
  background: #ffffff;
  border: 1px solid #d8dee4;
  border-radius: 5px;
  padding: 0.38rem 0.45rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  font-size: 0.74rem;
}

.card-top {
  display: flex;
  justify-content: space-between;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  color: #57606a;
}

.card-title {
  font-weight: 500;
  color: #1f2328;
}

.move-label {
  display: flex;
  align-items: safe center;
  justify-content: space-between;
  gap: 0.25rem;
  font-size: 0.68rem;
  color: #57606a;
}

.move-select {
  font-size: 0.68rem;
  padding: 0.1rem 0.25rem;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  background: #f6f8fa;
  max-inline-size: 100%;
}
</style>
