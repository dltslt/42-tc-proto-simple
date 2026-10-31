<script setup lang="ts">
// Nuxt auto-import: ref, computed, watch, nextTick, onMounted, onUnmounted from Vue
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface SearchItem {
  id: string
  space: string
  level: string
  title: string
  kanban: string
  state: string
  parent_id?: string
  path?: string
}

interface CommandAction {
  id: string
  type: 'command'
  title: string
  description: string
  handler: () => void
}

const props = defineProps<{
  isOpen: boolean
  canZoomOut: boolean
  animationsEnabled: boolean
  spaces: Array<{ id: string; name: string }>
}>()

// Nuxt auto-import: defineEmits registers custom events
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'zoom', id: string): void
  (e: 'zoom-out'): void
  (e: 'focus-new-item'): void
  (e: 'toggle-animations'): void
  (e: 'switch-space', spaceId: string): void
}>()

// Vue ref: reactive search query string
const query = ref('')

// Vue ref: input element reference for auto-focus
const inputRef = ref<HTMLInputElement | null>(null)

// Vue ref: search results from server
const searchResults = ref<SearchItem[]>([])

// Vue ref: active selection index for keyboard arrow navigation
const activeIndex = ref(0)

// Vue ref: loading state during fetch
const isLoading = ref(false)

// Built-in commands
const commands = computed<CommandAction[]>(() => {
  const list: CommandAction[] = [
    {
      id: 'cmd-new-item',
      type: 'command',
      title: 'Action: New Item Here',
      description: 'Focus input to create a new child item in this layer',
      handler: () => {
        emit('focus-new-item')
        emit('close')
      }
    },
    {
      id: 'cmd-toggle-anim',
      type: 'command',
      title: `Toggle Animations (Currently: ${props.animationsEnabled ? 'ON' : 'OFF'})`,
      description: 'Turn zoom transitions and motion on or off',
      handler: () => {
        emit('toggle-animations')
      }
    }
  ]

  if (props.canZoomOut) {
    list.unshift({
      id: 'cmd-zoom-out',
      type: 'command',
      title: 'Action: Zoom Out (Jump Up One Level)',
      description: 'Navigate up to the parent layer',
      handler: () => {
        emit('zoom-out')
        emit('close')
      }
    })
  }

  // Add space switch commands
  for (const sp of props.spaces) {
    list.push({
      id: `cmd-space-${sp.id}`,
      type: 'command',
      title: `Switch Space: ${sp.name}`,
      description: `Open space ${sp.name} as outermost layer`,
      handler: () => {
        emit('switch-space', sp.id)
        emit('close')
      }
    })
  }

  return list
})

// Filtered commands matching query
const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return commands.value
  return commands.value.filter(
    c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
})

// Combined navigable list: matching items + commands
const combinedEntries = computed(() => {
  return [
    ...searchResults.value.map(item => ({ type: 'item' as const, data: item })),
    ...filteredCommands.value.map(cmd => ({ type: 'command' as const, data: cmd }))
  ]
})

// Fetch search results when query changes
// async and await handle asynchronous execution sequentially
async function performSearch(val: string) {
  isLoading.value = true
  try {
    // $fetch is a Nuxt auto-import for making type-safe HTTP requests
    const res: any = await $fetch(`/api/items/search?q=${encodeURIComponent(val)}`)
    searchResults.value = res.items || []
  } catch (err) {
    searchResults.value = []
  } finally {
    isLoading.value = false
    activeIndex.value = 0
  }
}

// Vue watch: reacts to query changes with reactive fetch
watch(query, (newVal) => {
  performSearch(newVal)
})

// Reset and auto-focus when opened
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      query.value = ''
      activeIndex.value = 0
      performSearch('')
      // nextTick waits until the DOM has finished updating
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

function selectEntry(index: number) {
  const entry = combinedEntries.value[index]
  if (!entry) return

  if (entry.type === 'item') {
    emit('zoom', entry.data.id)
    emit('close')
  } else if (entry.type === 'command') {
    entry.data.handler()
  }
}

// Global keyboard navigation within the command pane
function onKeyDown(e: KeyboardEvent) {
  if (!props.isOpen) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (combinedEntries.value.length > 0) {
      activeIndex.value = (activeIndex.value + 1) % combinedEntries.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (combinedEntries.value.length > 0) {
      activeIndex.value = (activeIndex.value - 1 + combinedEntries.value.length) % combinedEntries.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    selectEntry(activeIndex.value)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div v-if="isOpen" class="command-backdrop" @click.self="emit('close')">
    <div class="command-modal" role="dialog" aria-modal="true" aria-label="Command Pane">
      <!-- Search Input Bar -->
      <div class="search-bar">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="command-input"
          placeholder="Type an item title or command (e.g. 'cut the bread', 'zoom out')..."
        />
        <span class="esc-badge" @click="emit('close')">ESC</span>
      </div>

      <!-- Navigation & Selection Results -->
      <div class="results-list" role="listbox">
        <!-- Section: Items -->
        <div v-if="searchResults.length > 0" class="results-group">
          <div class="group-header">ITEMS ({{ searchResults.length }})</div>
          <div
            v-for="(item, idx) in searchResults"
            :key="item.id"
            class="result-row item-row"
            :class="{ 'is-selected': idx === activeIndex }"
            role="option"
            :aria-selected="idx === activeIndex"
            @mouseenter="activeIndex = idx"
            @click="selectEntry(idx)"
          >
            <div class="row-main">
              <div class="item-title-line">
                <span class="item-level-tag" :class="`level-${item.level}`">{{ item.level }}</span>
                <span class="item-title">{{ item.title }}</span>
                <span class="item-id">{{ item.id }}</span>
              </div>
              <div v-if="item.path" class="item-path">{{ item.path }}</div>
            </div>
            <div class="row-side">
              <span class="kanban-badge">{{ item.kanban }}</span>
              <span class="enter-hint">↵ Go</span>
            </div>
          </div>
        </div>

        <!-- Section: Commands -->
        <div v-if="filteredCommands.length > 0" class="results-group">
          <div class="group-header">COMMANDS</div>
          <div
            v-for="(cmd, cmdIdx) in filteredCommands"
            :key="cmd.id"
            class="result-row command-row"
            :class="{ 'is-selected': searchResults.length + cmdIdx === activeIndex }"
            role="option"
            :aria-selected="searchResults.length + cmdIdx === activeIndex"
            @mouseenter="activeIndex = searchResults.length + cmdIdx"
            @click="selectEntry(searchResults.length + cmdIdx)"
          >
            <div class="row-main">
              <div class="command-title">⚡ {{ cmd.title }}</div>
              <div class="command-desc">{{ cmd.description }}</div>
            </div>
            <div class="row-side">
              <span class="enter-hint">↵ Run</span>
            </div>
          </div>
        </div>

        <!-- Empty Results -->
        <div v-if="combinedEntries.length === 0 && !isLoading" class="no-results">
          No matching items or commands found for "{{ query }}"
        </div>
      </div>

      <!-- Footer Help -->
      <footer class="command-footer">
        <span class="key-tip"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span class="key-tip"><kbd>↵</kbd> Select</span>
        <span class="key-tip"><kbd>Esc</kbd> Close</span>
        <span class="key-tip"><kbd>Ctrl+P</kbd> Toggle anytime</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.command-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(27, 31, 36, 0.45);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 10vh;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.command-modal {
  width: 90%;
  max-width: 640px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid #d0d7de;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 75vh;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #d0d7de;
  background: #fafbfc;
}

.search-icon {
  font-size: 1rem;
  color: #57606a;
}

.command-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  font-family: inherit;
  color: #1f2328;
  outline: none;
}

.esc-badge {
  font-size: 0.7rem;
  background: #eef2f6;
  color: #57606a;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  cursor: pointer;
}

.results-list {
  padding: 0.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.results-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.group-header {
  font-size: 0.65rem;
  font-weight: 700;
  color: #57606a;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.result-row.is-selected {
  background: #0969da;
  color: #ffffff;
}

.result-row.is-selected .item-title,
.result-row.is-selected .item-id,
.result-row.is-selected .item-path,
.result-row.is-selected .command-title,
.result-row.is-selected .command-desc,
.result-row.is-selected .enter-hint {
  color: #ffffff;
}

.row-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.item-title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-level-tag {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  background: #f1f3f5;
  color: #57606a;
}

.result-row.is-selected .item-level-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.level-project { background: #e1f0da; color: #1e4620; }
.level-epic { background: #ede7f6; color: #4a148c; }
.level-story { background: #e3f2fd; color: #0d47a1; }
.level-task { background: #fff3e0; color: #e65100; }
.level-subtask { background: #fce4ec; color: #880e4f; }

.item-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2328;
}

.item-id {
  font-size: 0.75rem;
  color: #8c959f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.item-path {
  font-size: 0.75rem;
  color: #57606a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2328;
}

.command-desc {
  font-size: 0.75rem;
  color: #57606a;
}

.row-side {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.kanban-badge {
  font-size: 0.7rem;
  background: #f1f3f5;
  color: #57606a;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.result-row.is-selected .kanban-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.enter-hint {
  font-size: 0.75rem;
  color: #8c959f;
  font-weight: 600;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #57606a;
  font-size: 0.9rem;
}

.command-footer {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid #d0d7de;
  background: #f6f8fa;
  font-size: 0.75rem;
  color: #57606a;
}

.key-tip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

kbd {
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 3px;
  padding: 0.1rem 0.35rem;
  font-size: 0.7rem;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}
</style>
