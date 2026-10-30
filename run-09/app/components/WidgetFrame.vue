<script setup lang="ts">
// A Vue Single-File Component (SFC) combines script, template, and scoped CSS.
// <script setup> exposes top-level variables and functions directly to <template>.
import type { WidgetItem } from '~/composables/useLayout'
import { getCatalogueMeta } from '~/composables/useLayout'

const props = defineProps<{
  widget: WidgetItem
}>()

const emit = defineEmits<{
  move: [dx: number, dy: number]
  resize: [dw: number, dh: number]
  remove: []
  dragStart: [id: string]
  dropOn: [targetId: string]
}>()

// computed() derives a reactive value that updates whenever props.widget changes.
const meta = computed(() => getCatalogueMeta(props.widget.type))

const gridStyle = computed(() => ({
  gridColumn: `${props.widget.x} / span ${props.widget.w}`,
  gridRow: `${props.widget.y} / span ${props.widget.h}`
}))

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.widget.id)
  }
  emit('dragStart', props.widget.id)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  emit('dropOn', props.widget.id)
}
</script>

<template>
  <section
    class="widget-frame"
    :style="gridStyle"
    :data-widget-id="widget.id"
    :data-widget-type="widget.type"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent
    @drop="onDrop"
  >
    <header class="widget-header">
      <div class="widget-title-group">
        <span class="drag-handle" title="Drag onto another widget to swap positions">⋮⋮</span>
        <h2 class="widget-title">{{ meta.title }}</h2>
        <span class="widget-coords" title="Grid column, row, width × height">
          c{{ widget.x }}:r{{ widget.y }} · {{ widget.w }}×{{ widget.h }}
        </span>
      </div>

      <div class="widget-controls">
        <!-- Slot where each widget injects its own inline setting controls -->
        <slot name="settings" />

        <div class="control-group" role="group" aria-label="Move widget">
          <button type="button" class="ctrl-btn" title="Move left" @click="emit('move', -1, 0)">◀</button>
          <button type="button" class="ctrl-btn" title="Move right" @click="emit('move', 1, 0)">▶</button>
          <button type="button" class="ctrl-btn" title="Move up" @click="emit('move', 0, -1)">▲</button>
          <button type="button" class="ctrl-btn" title="Move down" @click="emit('move', 0, 1)">▼</button>
        </div>

        <div class="control-group" role="group" aria-label="Resize widget">
          <button type="button" class="ctrl-btn" title="Narrower" @click="emit('resize', -1, 0)">W−</button>
          <button type="button" class="ctrl-btn" title="Wider" @click="emit('resize', 1, 0)">W+</button>
          <button type="button" class="ctrl-btn" title="Shorter" @click="emit('resize', 0, -1)">H−</button>
          <button type="button" class="ctrl-btn" title="Taller" @click="emit('resize', 0, 1)">H+</button>
        </div>

        <button
          type="button"
          class="ctrl-btn remove-btn"
          title="Remove widget from grid"
          @click="emit('remove')"
        >
          ×
        </button>
      </div>
    </header>

    <div class="widget-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.widget-frame {
  container: widget / inline-size;
  background: #ffffff;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  min-block-size: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.widget-header {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.4rem;
  padding-block: 0.45rem;
  padding-inline: 0.65rem;
  background: #f6f8fa;
  border-block-end: 1px solid #e5e9f0;
}

.widget-title-group {
  display: flex;
  align-items: safe center;
  gap: 0.4rem;
  min-inline-size: 0;
  margin-inline-end: auto;
}

.drag-handle {
  cursor: grab;
  color: #8c959f;
  font-size: 0.85rem;
  user-select: none;
}

.widget-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1f2328;
  white-space: nowrap;
}

.widget-coords {
  font-size: 0.7rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #656d76;
  background: #eaeef2;
  padding-block: 0.1rem;
  padding-inline: 0.35rem;
  border-radius: 4px;
}

.widget-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.3rem;
}

.control-group {
  display: inline-flex;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
}

.ctrl-btn {
  appearance: none;
  border: 0;
  border-inline-end: 1px solid #e5e9f0;
  background: #ffffff;
  color: #24292f;
  font-size: 0.68rem;
  line-height: 1;
  padding-block: 0.25rem;
  padding-inline: 0.35rem;
  cursor: pointer;
}

.ctrl-btn:last-child {
  border-inline-end: 0;
}

.ctrl-btn:hover {
  background: #eef2f6;
}

.remove-btn {
  border: 1px solid #d0d7de;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #cf222e;
  padding-inline: 0.45rem;
}

.remove-btn:hover {
  background: #ffebe9;
  border-color: #ff818266;
}

.widget-body {
  flex: 1 1 auto;
  padding: 0.65rem;
  overflow-y: auto;
  scrollbar-gutter: stable;
  min-inline-size: 0;
  min-block-size: 0;
}
</style>
