<script setup lang="ts">
// <WidgetsCountsChart /> — items per kanban column or per state, drawn by hand
// with plain HTML elements and CSS widths (no charting library).
const props = defineProps<{
  settings: Record<string, any>
}>()

const { actorId, spaceId, refreshTick } = useDashboardContext()
const by = computed(() => (props.settings?.by === 'state' ? 'state' : 'column'))

const { data } = await useFetch<{
  space: string
  by: 'column' | 'state'
  bars: Array<{ label: string; state: string; count: number }>
}>('/api/widgets/counts', {
  query: computed(() => ({
    space: spaceId.value,
    by: by.value,
    _t: refreshTick.value
  })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId, by, refreshTick]
})

const maxCount = computed(() => {
  const counts = (data.value?.bars || []).map(b => b.count)
  return Math.max(1, ...counts)
})

const totalCount = computed(() =>
  (data.value?.bars || []).reduce((sum, b) => sum + b.count, 0)
)

function barWidthPercent(count: number): string {
  return `${Math.round((count / maxCount.value) * 100)}%`
}
</script>

<template>
  <div class="counts-widget" data-testid="counts-chart">
    <div class="chart-summary">
      <span>Grouped by <strong>{{ by }}</strong></span>
      <span>Total: <strong>{{ totalCount }}</strong> items</span>
    </div>

    <div class="bars-list">
      <div
        v-for="bar in data?.bars || []"
        :key="bar.label"
        class="bar-row"
        :data-bar-label="bar.label"
        :data-bar-count="bar.count"
      >
        <div class="bar-label">
          <span class="bar-name">{{ bar.label }}</span>
          <span class="bar-state">{{ bar.state }}</span>
        </div>

        <div class="bar-track">
          <div
            class="bar-fill"
            :class="`fill-${bar.state}`"
            :style="{ inlineSize: barWidthPercent(bar.count) }"
          />
        </div>

        <span class="bar-value">{{ bar.count }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.counts-widget {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.chart-summary {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #57606a;
}

.bars-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-row {
  display: grid;
  grid-template-columns: 110px 1fr 36px;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.78rem;
}

.bar-label {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.bar-name {
  font-weight: 600;
  color: #1f2328;
}

.bar-state {
  font-size: 0.66rem;
  color: #656d76;
}

.bar-track {
  block-size: 18px;
  background: #eaeef2;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  block-size: 100%;
  min-inline-size: 4px;
  border-radius: 4px;
  transition: inline-size 0.2s ease;
}

.fill-unstarted {
  background: #8c959f;
}

.fill-started {
  background: #0969da;
}

.fill-done {
  background: #1a7f37;
}

.bar-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  text-align: end;
  color: #1f2328;
}
</style>
