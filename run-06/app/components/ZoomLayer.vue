<script setup lang="ts">
// Nuxt auto-import: ref creates a reactive mutable reference variable
// Nuxt auto-import: computed creates a reactive derived value that caches based on dependencies
import { ref, computed } from 'vue'

interface Column {
  space: string
  name: string
  state: string
  position: string
}

interface Item {
  id: string
  space: string
  level: string
  title: string
  parent_id?: string
  kanban?: string
  state?: string
  lead?: string
  contributors?: string
  description?: string
  effort?: string
  scheduled_time?: string
}

const props = defineProps<{
  current: Item
  children: Item[]
  columns: Column[]
  isSpace: boolean
}>()

// Nuxt auto-import: defineEmits registers custom events for parent-child communication
const emit = defineEmits<{
  (e: 'zoom', id: string): void
  (e: 'create-child', title: string): void
  (e: 'update-item', updates: Partial<Item>): void
  (e: 'update-child', payload: { id: string; kanban: string }): void
}>()

// Vue ref: reactive state for new child input
const newChildTitle = ref('')

// Vue ref: toggle view modes ('tiles' | 'board' | 'split')
const viewMode = ref<'tiles' | 'board' | 'split'>('tiles')

// Vue ref: inline editing state for current item description
const isEditingDesc = ref(false)
const descDraft = ref(props.current.description || '')

// Compute child level name for display
const expectedChildLevel = computed(() => {
  switch (props.current.level) {
    case 'space': return 'project'
    case 'project': return 'epic'
    case 'epic': return 'story'
    case 'story': return 'task'
    default: return 'subtask'
  }
})

// Children grouped by kanban column for the board view
const childrenByColumn = computed(() => {
  const map: Record<string, Item[]> = {}
  for (const col of props.columns) {
    map[col.name] = []
  }
  for (const child of props.children) {
    const colName = child.kanban || props.columns[0]?.name || 'backlog'
    if (!map[colName]) {
      map[colName] = []
    }
    map[colName].push(child)
  }
  return map
})

function handleCreateChild() {
  const val = newChildTitle.value.trim()
  if (!val) return
  emit('create-child', val)
  newChildTitle.value = ''
}

function handleColumnChange(event: Event) {
  const select = event.target as HTMLSelectElement
  emit('update-item', { kanban: select.value })
}

function handleChildColumnChange(childId: string, event: Event) {
  const select = event.target as HTMLSelectElement
  emit('update-child', { id: childId, kanban: select.value })
}

function saveDescription() {
  isEditingDesc.value = false
  emit('update-item', { description: descDraft.value })
}

// Drag & drop handlers for kanban board
function onDragStart(event: DragEvent, childId: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', childId)
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDrop(event: DragEvent, targetColumn: string) {
  event.preventDefault()
  if (event.dataTransfer) {
    const childId = event.dataTransfer.getData('text/plain')
    if (childId) {
      emit('update-child', { id: childId, kanban: targetColumn })
    }
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <section class="zoom-layer" aria-labelledby="layer-heading">
    <!-- Layer Header / Current Item Card -->
    <header class="layer-header" :class="`level-${current.level}`">
      <div class="header-main">
        <div class="header-meta">
          <span class="level-pill">{{ current.level }}</span>
          <span class="id-tag" v-if="!isSpace">{{ current.id }}</span>
          
          <!-- Column / State selector for non-space items -->
          <div v-if="!isSpace && columns.length > 0" class="state-selector-wrapper">
            <label :for="`item-kanban-${current.id}`" class="sr-only">Kanban Column</label>
            <select
              :id="`item-kanban-${current.id}`"
              class="column-select"
              :value="current.kanban"
              @change="handleColumnChange"
            >
              <option v-for="col in columns" :key="col.name" :value="col.name">
                {{ col.name }} ({{ col.state }})
              </option>
            </select>
          </div>
        </div>

        <h1 id="layer-heading" class="item-title">
          {{ current.title }}
        </h1>

        <!-- Editable description -->
        <div class="item-description-block">
          <div v-if="!isEditingDesc" class="description-view" @click="isEditingDesc = true">
            <p v-if="current.description">{{ current.description }}</p>
            <p v-else class="description-placeholder">+ Add notes or description...</p>
          </div>
          <div v-else class="description-edit">
            <textarea
              v-model="descDraft"
              rows="3"
              class="description-input"
              placeholder="Enter item description..."
              @keydown.esc="isEditingDesc = false"
            ></textarea>
            <div class="desc-actions">
              <button type="button" class="btn-save" @click="saveDescription">Save</button>
              <button type="button" class="btn-cancel" @click="isEditingDesc = false">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Metadata row -->
        <div v-if="!isSpace" class="item-details-row">
          <div v-if="current.lead" class="detail-item">
            <span class="detail-label">Lead:</span>
            <span class="detail-val">{{ current.lead }}</span>
          </div>
          <div v-if="current.contributors" class="detail-item">
            <span class="detail-label">Contributors:</span>
            <span class="detail-val">{{ current.contributors }}</span>
          </div>
          <div v-if="current.effort" class="detail-item">
            <span class="detail-label">Effort:</span>
            <span class="detail-val">{{ current.effort }}</span>
          </div>
          <div v-if="current.scheduled_time" class="detail-item">
            <span class="detail-label">Scheduled:</span>
            <span class="detail-val">{{ current.scheduled_time }}</span>
          </div>
        </div>
      </div>

      <!-- Controls: View switcher & Child counter -->
      <div class="header-controls">
        <div class="children-count">
          <strong>{{ children.length }}</strong> children
        </div>
        <div class="view-switcher" role="radiogroup" aria-label="View mode">
          <button
            type="button"
            class="view-btn"
            :class="{ 'is-active': viewMode === 'tiles' }"
            @click="viewMode = 'tiles'"
          >
            Tiles
          </button>
          <button
            type="button"
            class="view-btn"
            :class="{ 'is-active': viewMode === 'board' }"
            @click="viewMode = 'board'"
          >
            Board
          </button>
          <button
            type="button"
            class="view-btn"
            :class="{ 'is-active': viewMode === 'split' }"
            @click="viewMode = 'split'"
          >
            Split
          </button>
        </div>
      </div>
    </header>

    <!-- Quick Child Creation Input: takes title and Enter -->
    <div class="child-creation-bar">
      <label for="new-child-input" class="creation-label">
        + Add {{ expectedChildLevel }}:
      </label>
      <input
        id="new-child-input"
        v-model="newChildTitle"
        type="text"
        class="creation-input"
        :placeholder="`Type ${expectedChildLevel} title and press Enter...`"
        @keydown.enter="handleCreateChild"
      />
      <button 
        type="button" 
        class="creation-submit-btn" 
        :disabled="!newChildTitle.trim()"
        @click="handleCreateChild"
      >
        Add
      </button>
    </div>

    <!-- Main Content Area: Tiles, Board, or Split -->
    <div class="layer-content" :class="`mode-${viewMode}`">
      <!-- Section A: Children Tiles -->
      <section 
        v-if="viewMode === 'tiles' || viewMode === 'split'" 
        class="tiles-section"
        aria-label="Child item tiles"
      >
        <div v-if="children.length === 0" class="empty-state">
          <p>No {{ expectedChildLevel }} items here yet.</p>
          <p class="empty-hint">Use the input above to create the first one.</p>
        </div>

        <div v-else class="tiles-grid">
          <article
            v-for="child in children"
            :key="child.id"
            class="child-card"
            :class="`state-${child.state}`"
            tabindex="0"
            role="button"
            :aria-label="`Zoom into ${child.title}`"
            @click="emit('zoom', child.id)"
            @keydown.enter="emit('zoom', child.id)"
          >
            <div class="card-top">
              <span class="card-level-tag">{{ child.level }}</span>
              <span class="card-id">{{ child.id }}</span>
              <span class="card-kanban-tag">{{ child.kanban }}</span>
            </div>

            <h3 class="card-title">{{ child.title }}</h3>

            <p v-if="child.description" class="card-description">
              {{ child.description }}
            </p>

            <div class="card-bottom">
              <span v-if="child.lead" class="card-lead">👤 {{ child.lead }}</span>
              <span v-if="child.effort" class="card-effort">⏱ {{ child.effort }}</span>
              <button 
                type="button" 
                class="card-zoom-btn" 
                @click.stop="emit('zoom', child.id)"
              >
                Zoom in →
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- Section B: Board (Kanban Columns) -->
      <section 
        v-if="viewMode === 'board' || viewMode === 'split'" 
        class="board-section"
        aria-label="Kanban board of children"
      >
        <div class="board-columns">
          <div
            v-for="col in columns"
            :key="col.name"
            class="board-column"
            @dragover="onDragOver"
            @drop="onDrop($event, col.name)"
          >
            <header class="column-header">
              <span class="column-title">{{ col.name }}</span>
              <span class="column-state-badge" :class="`state-${col.state}`">
                {{ col.state }}
              </span>
              <span class="column-count">{{ (childrenByColumn[col.name] || []).length }}</span>
            </header>

            <div class="column-cards">
              <div
                v-for="item in childrenByColumn[col.name]"
                :key="item.id"
                class="board-card"
                draggable="true"
                @dragstart="onDragStart($event, item.id)"
                @click="emit('zoom', item.id)"
              >
                <div class="board-card-header">
                  <span class="card-level-tag">{{ item.level }}</span>
                  <span class="card-id">{{ item.id }}</span>
                </div>
                <div class="board-card-title">{{ item.title }}</div>
                
                <div class="board-card-footer" @click.stop>
                  <!-- Quick column mover dropdown -->
                  <label :for="`move-${item.id}`" class="sr-only">Move column</label>
                  <select
                    :id="`move-${item.id}`"
                    class="quick-move-select"
                    :value="item.kanban"
                    @change="handleChildColumnChange(item.id, $event)"
                  >
                    <option v-for="c in columns" :key="c.name" :value="c.name">
                      → {{ c.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="(childrenByColumn[col.name] || []).length === 0" class="column-empty">
                Drop items here
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.zoom-layer {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #ffffff;
  overflow-y: auto;
}

/* Layer Header */
.layer-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #d0d7de;
  background: #fafbfc;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.header-main {
  flex: 1;
  min-width: 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.level-pill {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: #eef2f6;
  color: #24292f;
}

.level-space .level-pill { background: #e8eaed; color: #3c4043; }
.level-project .level-pill { background: #e1f0da; color: #1e4620; }
.level-epic .level-pill { background: #ede7f6; color: #4a148c; }
.level-story .level-pill { background: #e3f2fd; color: #0d47a1; }
.level-task .level-pill { background: #fff3e0; color: #e65100; }
.level-subtask .level-pill { background: #fce4ec; color: #880e4f; }

.id-tag {
  font-size: 0.75rem;
  color: #57606a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.state-selector-wrapper {
  margin-left: 0.5rem;
}

.column-select {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  background: #ffffff;
  color: #24292f;
  cursor: pointer;
}

.item-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #1f2328;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.item-description-block {
  margin-bottom: 0.75rem;
}

.description-view {
  cursor: pointer;
  color: #424a53;
  font-size: 0.9rem;
  line-height: 1.5;
}

.description-view:hover {
  color: #0969da;
}

.description-placeholder {
  color: #8c959f;
  font-style: italic;
  margin: 0;
}

.description-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.description-input {
  width: 100%;
  padding: 0.5rem;
  font-family: inherit;
  font-size: 0.875rem;
  border: 1px solid #0969da;
  border-radius: 6px;
  resize: vertical;
}

.desc-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-save {
  padding: 0.25rem 0.75rem;
  background: #1f883d;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-cancel {
  padding: 0.25rem 0.75rem;
  background: #eaeef2;
  color: #24292f;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.item-details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
  color: #57606a;
}

.detail-label {
  font-weight: 600;
  margin-right: 0.25rem;
}

.detail-val {
  color: #24292f;
}

/* Header Controls */
.header-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.children-count {
  font-size: 0.85rem;
  color: #57606a;
}

.view-switcher {
  display: inline-flex;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 0.35rem 0.75rem;
  background: #ffffff;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  color: #57606a;
  border-right: 1px solid #d0d7de;
}

.view-btn:last-child {
  border-right: none;
}

.view-btn.is-active {
  background: #0969da;
  color: #ffffff;
  font-weight: 600;
}

/* Quick Child Creation Bar */
.child-creation-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
}

.creation-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #57606a;
  white-space: nowrap;
}

.creation-input {
  flex: 1;
  padding: 0.45rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #ffffff;
  color: #24292f;
}

.creation-input:focus {
  outline: 2px solid #0969da;
  border-color: transparent;
}

.creation-submit-btn {
  padding: 0.45rem 0.9rem;
  background: #0969da;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.creation-submit-btn:disabled {
  background: #8c959f;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Main Content Layouts */
.layer-content {
  padding: 1.5rem;
  display: flex;
  flex: 1;
  gap: 1.5rem;
}

.layer-content.mode-tiles .tiles-section {
  flex: 1;
}

.layer-content.mode-board .board-section {
  flex: 1;
}

.layer-content.mode-split .tiles-section,
.layer-content.mode-split .board-section {
  flex: 1;
  min-width: 0;
}

/* Tiles View */
.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.child-card {
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.child-card:hover {
  transform: translateY(-2px);
  border-color: #0969da;
  box-shadow: 0 4px 10px rgba(9, 105, 218, 0.12);
}

.child-card:focus-visible {
  outline: 2px solid #0969da;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.card-level-tag {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1f3f5;
  color: #57606a;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

.card-id {
  font-size: 0.7rem;
  color: #8c959f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card-kanban-tag {
  margin-left: auto;
  font-size: 0.65rem;
  background: #eef2f6;
  color: #24292f;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2328;
  margin: 0 0 0.5rem 0;
  line-height: 1.35;
}

.card-description {
  font-size: 0.8rem;
  color: #57606a;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.card-bottom {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #57606a;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f2f4;
}

.card-zoom-btn {
  background: transparent;
  border: none;
  color: #0969da;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.card-zoom-btn:hover {
  background: #eef2f6;
}

/* Board (Kanban) View */
.board-columns {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  align-items: flex-start;
  padding-bottom: 1rem;
}

.board-column {
  flex: 0 0 240px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.column-header {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.column-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #24292f;
  text-transform: capitalize;
}

.column-state-badge {
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: 600;
}

.column-state-badge.state-unstarted { background: #f1f3f5; color: #57606a; }
.column-state-badge.state-started { background: #dafbe1; color: #1a7f37; }
.column-state-badge.state-done { background: #ddf4ff; color: #0969da; }

.column-count {
  margin-left: auto;
  font-size: 0.7rem;
  background: #eaeef2;
  color: #57606a;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-weight: 600;
}

.column-cards {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  min-height: 120px;
}

.board-card {
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 0.6rem;
  cursor: grab;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.board-card:hover {
  border-color: #0969da;
}

.board-card-header {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.3rem;
}

.board-card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #24292f;
  margin-bottom: 0.4rem;
  line-height: 1.3;
}

.board-card-footer {
  display: flex;
  justify-content: flex-end;
}

.quick-move-select {
  font-size: 0.65rem;
  padding: 0.15rem 0.3rem;
  border: 1px solid #d0d7de;
  border-radius: 3px;
  background: #f6f8fa;
  color: #57606a;
  cursor: pointer;
}

.column-empty {
  padding: 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: #8c959f;
  border: 1px dashed #d0d7de;
  border-radius: 6px;
  margin-top: auto;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #57606a;
  background: #f6f8fa;
  border: 1px dashed #d0d7de;
  border-radius: 8px;
}

.empty-hint {
  font-size: 0.8rem;
  color: #8c959f;
  margin-top: 0.25rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
