<script setup lang="ts">
// WidgetGrid manages the 12-column dashboard layout, the widget catalogue bar,
// and persistence to `/api/layout` (per-person copy vs space default).
import type { WidgetItem, WidgetType } from '~/composables/useLayout'
import { WIDGET_CATALOGUE } from '~/composables/useLayout'

const { actorId, spaceId } = useDashboardContext()

// ref() creates a reactive reference. Assign to `.value` in script; read bare in <template>.
const saving = ref(false)
const draggedId = ref<string | null>(null)
const catalogueOpen = ref(false)

// Fetch the active layout whenever spaceId or actorId changes.
const { data: layoutResp, refresh: refreshLayout } = await useFetch<{
  space: string
  actor: string
  source: 'personal' | 'default'
  layout: { widgets: WidgetItem[] }
}>('/api/layout', {
  query: computed(() => ({ space: spaceId.value })),
  headers: computed(() => ({ 'x-actor': actorId.value })),
  watch: [spaceId, actorId]
})

const widgets = computed<WidgetItem[]>(() => layoutResp.value?.layout?.widgets || [])
const layoutSource = computed(() => layoutResp.value?.source || 'default')

// Save the modified widget list as the current person's copy on the server.
async function savePersonalLayout(nextWidgets: WidgetItem[]) {
  saving.value = true
  try {
    // $fetch is Nuxt's imperative HTTP client for user-triggered actions (PUT/POST/DELETE).
    const res = await $fetch<{
      space: string
      actor: string
      source: 'personal' | 'default'
      layout: { widgets: WidgetItem[] }
    }>('/api/layout', {
      method: 'PUT',
      query: { space: spaceId.value },
      headers: { 'x-actor': actorId.value },
      body: { widgets: nextWidgets }
    })
    if (layoutResp.value) {
      layoutResp.value = res
    } else {
      await refreshLayout()
    }
  } finally {
    saving.value = false
  }
}

async function saveAsSpaceDefault() {
  saving.value = true
  try {
    await $fetch('/api/layout', {
      method: 'PUT',
      query: { space: spaceId.value, scope: 'default' },
      headers: { 'x-actor': actorId.value },
      body: { widgets: widgets.value }
    })
    await refreshLayout()
  } finally {
    saving.value = false
  }
}

async function resetToDefault() {
  saving.value = true
  try {
    const res = await $fetch<{
      space: string
      actor: string
      source: 'personal' | 'default'
      layout: { widgets: WidgetItem[] }
    }>('/api/layout', {
      method: 'DELETE',
      query: { space: spaceId.value },
      headers: { 'x-actor': actorId.value }
    })
    layoutResp.value = res
  } finally {
    saving.value = false
  }
}

function addFromCatalogue(type: WidgetType) {
  const entry = WIDGET_CATALOGUE.find(c => c.type === type)
  if (!entry) return
  const maxBottom = widgets.value.reduce((acc, w) => Math.max(acc, w.y + w.h), 1)
  const newWidget: WidgetItem = {
    id: `w-${type}-${Date.now().toString(36)}`,
    type,
    x: 1,
    y: maxBottom,
    w: entry.defaultW,
    h: entry.defaultH,
    settings: { ...entry.defaultSettings }
  }
  savePersonalLayout([...widgets.value, newWidget])
}

function removeWidget(id: string) {
  savePersonalLayout(widgets.value.filter(w => w.id !== id))
}

function moveWidget(id: string, dx: number, dy: number) {
  const next = widgets.value.map(w => {
    if (w.id !== id) return w
    const nx = Math.max(1, Math.min(13 - w.w, w.x + dx))
    const ny = Math.max(1, w.y + dy)
    return { ...w, x: nx, y: ny }
  })
  savePersonalLayout(next)
}

function resizeWidget(id: string, dw: number, dh: number) {
  const next = widgets.value.map(w => {
    if (w.id !== id) return w
    const nw = Math.max(3, Math.min(13 - w.x, w.w + dw))
    const nh = Math.max(1, Math.min(5, w.h + dh))
    return { ...w, w: nw, h: nh }
  })
  savePersonalLayout(next)
}

function updateSetting(id: string, key: string, value: string | number | boolean) {
  const next = widgets.value.map(w => {
    if (w.id !== id) return w
    return {
      ...w,
      settings: { ...w.settings, [key]: value }
    }
  })
  savePersonalLayout(next)
}

function onDropOnWidget(targetId: string) {
  const srcId = draggedId.value
  draggedId.value = null
  if (!srcId || srcId === targetId) return
  const src = widgets.value.find(w => w.id === srcId)
  const dst = widgets.value.find(w => w.id === targetId)
  if (!src || !dst) return

  const next = widgets.value.map(w => {
    if (w.id === src.id) {
      const clampedX = Math.max(1, Math.min(13 - w.w, dst.x))
      return { ...w, x: clampedX, y: dst.y }
    }
    if (w.id === dst.id) {
      const clampedX = Math.max(1, Math.min(13 - w.w, src.x))
      return { ...w, x: clampedX, y: src.y }
    }
    return w
  })
  savePersonalLayout(next)
}
</script>

<template>
  <div class="dashboard-wrap">
    <section class="toolbar-bar">
      <div class="layout-status">
        <span
          class="status-pill"
          :class="layoutSource === 'personal' ? 'is-personal' : 'is-default'"
          data-testid="layout-source"
        >
          {{ layoutSource === 'personal' ? `Personal layout (${actorId})` : `Space default (${spaceId})` }}
        </span>
        <span class="status-hint">
          <template v-if="layoutSource === 'personal'">
            You are viewing your own saved copy. Other members still see {{ spaceId }}'s default.
          </template>
          <template v-else>
            Move, resize, add, remove, or configure any widget to create your personal copy.
          </template>
        </span>
      </div>

      <div class="toolbar-actions">
        <button
          type="button"
          class="action-btn"
          data-testid="toggle-catalogue"
          @click="catalogueOpen = !catalogueOpen"
        >
          {{ catalogueOpen ? 'Hide widget catalogue' : '+ Add widget from catalogue' }}
        </button>

        <button
          type="button"
          class="action-btn"
          data-testid="reset-layout"
          :disabled="layoutSource === 'default' || saving"
          @click="resetToDefault"
        >
          Reset to space's default
        </button>

        <button
          type="button"
          class="action-btn secondary"
          title="Overwrite the space's default layout (allow-all policy stub)"
          :disabled="saving"
          @click="saveAsSpaceDefault"
        >
          Save as space default
        </button>
      </div>
    </section>

    <section v-if="catalogueOpen" class="catalogue-drawer" data-testid="widget-catalogue">
      <div class="catalogue-header">
        <strong>Widget catalogue</strong>
        <span>Click any widget to add a new instance to the bottom of your grid:</span>
      </div>
      <div class="catalogue-cards">
        <button
          v-for="item in WIDGET_CATALOGUE"
          :key="item.type"
          type="button"
          class="catalogue-card"
          :data-testid="`add-widget-${item.type}`"
          @click="addFromCatalogue(item.type)"
        >
          <span class="cat-title">+ {{ item.title }}</span>
          <span class="cat-desc">{{ item.description }}</span>
          <span class="cat-size">Default span: {{ item.defaultW }} cols × {{ item.defaultH }} rows</span>
        </button>
      </div>
    </section>

    <div class="widget-grid" data-testid="widget-grid">
      <WidgetFrame
        v-for="w in widgets"
        :key="w.id"
        :widget="w"
        @move="(dx, dy) => moveWidget(w.id, dx, dy)"
        @resize="(dw, dh) => resizeWidget(w.id, dw, dh)"
        @remove="removeWidget(w.id)"
        @drag-start="id => (draggedId = id)"
        @drop-on="targetId => onDropOnWidget(targetId)"
      >
        <template #settings>
          <!-- Per-widget settings stored inside the layout configuration -->
          <label v-if="w.type === 'counts'" class="setting-ctrl">
            <span>Group:</span>
            <select
              :value="w.settings.by || 'column'"
              @change="updateSetting(w.id, 'by', ($event.target as HTMLSelectElement).value)"
            >
              <option value="column">column</option>
              <option value="state">state</option>
            </select>
          </label>

          <template v-else-if="w.type === 'board'">
            <label class="setting-ctrl">
              <span>Level:</span>
              <select
                :value="w.settings.level || 'task'"
                @change="updateSetting(w.id, 'level', ($event.target as HTMLSelectElement).value)"
              >
                <option value="project">project</option>
                <option value="epic">epic</option>
                <option value="story">story</option>
                <option value="task">task</option>
                <option value="subtask">subtask</option>
              </select>
            </label>
            <label class="setting-ctrl checkbox">
              <input
                type="checkbox"
                :checked="Boolean(w.settings.mine)"
                @change="updateSetting(w.id, 'mine', ($event.target as HTMLInputElement).checked)"
              >
              <span>Mine</span>
            </label>
          </template>

          <label v-else-if="w.type === 'upcoming'" class="setting-ctrl">
            <span>Range:</span>
            <select
              :value="Number(w.settings.days) || 7"
              @change="updateSetting(w.id, 'days', Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="7">7 days</option>
              <option :value="14">14 days</option>
              <option :value="30">30 days</option>
              <option :value="60">60 days</option>
            </select>
          </label>

          <label v-else-if="w.type === 'activity'" class="setting-ctrl">
            <span>Show:</span>
            <select
              :value="Number(w.settings.limit) || 8"
              @change="updateSetting(w.id, 'limit', Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="5">5</option>
              <option :value="8">8</option>
              <option :value="15">15</option>
            </select>
          </label>

          <label v-else-if="w.type === 'touched'" class="setting-ctrl">
            <span>Show:</span>
            <select
              :value="Number(w.settings.limit) || 6"
              @change="updateSetting(w.id, 'limit', Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="4">4</option>
              <option :value="6">6</option>
              <option :value="10">10</option>
            </select>
          </label>

          <label v-else-if="w.type === 'blockers'" class="setting-ctrl checkbox">
            <input
              type="checkbox"
              :checked="Boolean(w.settings.includeDone)"
              @change="updateSetting(w.id, 'includeDone', ($event.target as HTMLInputElement).checked)"
            >
            <span>Include done</span>
          </label>
        </template>

        <WidgetsNextItems v-if="w.type === 'next'" :settings="w.settings" />
        <WidgetsBlockersSeverity v-else-if="w.type === 'blockers'" :settings="w.settings" />
        <WidgetsRecentActivity v-else-if="w.type === 'activity'" :settings="w.settings" />
        <WidgetsCountsChart v-else-if="w.type === 'counts'" :settings="w.settings" />
        <WidgetsUpcomingItems v-else-if="w.type === 'upcoming'" :settings="w.settings" />
        <WidgetsLastTouched v-else-if="w.type === 'touched'" :settings="w.settings" />
        <WidgetsMiniBoard v-else-if="w.type === 'board'" :settings="w.settings" />
      </WidgetFrame>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.toolbar-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  padding-block: 0.6rem;
  padding-inline: 0.9rem;
}

.layout-status {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.6rem;
  margin-inline-end: auto;
}

.status-pill {
  font-size: 0.76rem;
  font-weight: 600;
  padding-block: 0.2rem;
  padding-inline: 0.55rem;
  border-radius: 999px;
}

.status-pill.is-default {
  background: #ddf4ff;
  color: #0969da;
  border: 1px solid #54aeff66;
}

.status-pill.is-personal {
  background: #dafbe1;
  color: #1a7f37;
  border: 1px solid #4ac26b66;
}

.status-hint {
  font-size: 0.8rem;
  color: #57606a;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.action-btn {
  appearance: none;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding-block: 0.35rem;
  padding-inline: 0.7rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #24292f;
  cursor: pointer;
}

.action-btn:hover:not(:disabled) {
  background: #eaeef2;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.secondary {
  color: #57606a;
}

.catalogue-drawer {
  background: #ffffff;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.catalogue-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.82rem;
  color: #57606a;
}

.catalogue-header strong {
  color: #1f2328;
}

.catalogue-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.6rem;
}

.catalogue-card {
  text-align: start;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.catalogue-card:hover {
  background: #eef4ff;
  border-color: #0969da;
}

.cat-title {
  font-weight: 600;
  font-size: 0.84rem;
  color: #0969da;
}

.cat-desc {
  font-size: 0.75rem;
  color: #57606a;
}

.cat-size {
  font-size: 0.68rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #656d76;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: minmax(155px, auto);
  gap: 0.85rem;
}

@media (max-width: 900px) {
  .widget-grid {
    display: flex;
    flex-direction: column;
  }
}

.setting-ctrl {
  display: inline-flex;
  align-items: safe center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: #57606a;
}

.setting-ctrl select {
  font-size: 0.72rem;
  padding-block: 0.12rem;
  padding-inline: 0.3rem;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  background: #ffffff;
}

.setting-ctrl.checkbox {
  cursor: pointer;
}
</style>
