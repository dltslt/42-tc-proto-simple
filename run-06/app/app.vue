<script setup lang="ts">
// Nuxt auto-import: ref, computed, onMounted, onUnmounted from Vue
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Nuxt composable: useFetch fetches data from a server API route with reactive caching
const { data: spacesData } = await useFetch('/api/spaces')

const spaces = computed(() => spacesData.value?.spaces || [])
const actors = computed(() => spacesData.value?.actors || [])

// Default current user actor
const currentActor = ref('actor-1')

// Current zoom target id: starts at outermost layer (space)
const currentZoomId = ref('space:org-a')

// Nuxt composable: useFetch with getter function automatically refetches when currentZoomId changes
const { data: zoomData, refresh: refreshZoom } = await useFetch(() => `/api/zoom?target=${encodeURIComponent(currentZoomId.value)}`)

const currentItem = computed(() => zoomData.value?.current || { id: 'space:org-a', title: 'Organisation A', level: 'space' })
const ancestry = computed(() => zoomData.value?.ancestry || [])
const children = computed(() => zoomData.value?.children || [])
const columns = computed(() => zoomData.value?.columns || [])
const isSpace = computed(() => zoomData.value?.kind === 'space')

// Animations state: respect prefers-reduced-motion by default
const animationsEnabled = ref(false)

// Command pane modal visibility
const isCommandPaneOpen = ref(false)

// Can zoom out if ancestry has more than 1 entry
const canZoomOut = computed(() => ancestry.value.length > 1)

// Initialize motion preference in browser
onMounted(() => {
  // Check browser prefers-reduced-motion media query
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  animationsEnabled.value = !prefersReduced

  // Global keyboard shortcut listener for Ctrl+P / Cmd+P
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault()
      isCommandPaneOpen.value = !isCommandPaneOpen.value
    }
  }
  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Zoom navigation with View Transitions API
// async and await pause execution until the asynchronous operation completes
async function zoomTo(id: string) {
  if (id === currentZoomId.value) return

  // Use document.startViewTransition if animations are enabled and supported
  if (animationsEnabled.value && typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as any).startViewTransition(async () => {
      currentZoomId.value = id
      await refreshZoom()
    })
  } else {
    currentZoomId.value = id
    await refreshZoom()
  }
}

// Zoom out to immediate parent
function zoomOut() {
  if (ancestry.value.length > 1) {
    const parent = ancestry.value[ancestry.value.length - 2]
    zoomTo(parent.id)
  }
}

// Create a new child item
// async and await handle the server HTTP request sequentially
async function handleCreateChild(title: string) {
  try {
    // $fetch is a Nuxt auto-import for HTTP requests
    await $fetch('/api/items', {
      method: 'POST',
      headers: {
        'x-lerch-actor': currentActor.value
      },
      body: {
        title,
        parentId: currentItem.value.id,
        space: isSpace.value ? currentItem.value.space : currentItem.value.space
      }
    })
    await refreshZoom()
  } catch (err) {
    console.error('Failed to create child item:', err)
  }
}

// Update current item (e.g. title, column, description)
async function handleUpdateItem(updates: any) {
  if (isSpace.value) return
  try {
    await $fetch(`/api/items/${currentItem.value.id}`, {
      method: 'PATCH',
      headers: {
        'x-lerch-actor': currentActor.value
      },
      body: updates
    })
    await refreshZoom()
  } catch (err) {
    console.error('Failed to update item:', err)
  }
}

// Update a child's column from the board view
async function handleUpdateChild(payload: { id: string; kanban: string }) {
  try {
    await $fetch(`/api/items/${payload.id}`, {
      method: 'PATCH',
      headers: {
        'x-lerch-actor': currentActor.value
      },
      body: {
        kanban: payload.kanban
      }
    })
    await refreshZoom()
  } catch (err) {
    console.error('Failed to move child column:', err)
  }
}

function handleSwitchSpace(spaceId: string) {
  zoomTo(`space:${spaceId}`)
}

function focusNewItemInput() {
  const el = document.getElementById('new-child-input') as HTMLInputElement | null
  el?.focus()
}

function toggleAnimations() {
  animationsEnabled.value = !animationsEnabled.value
}
</script>

<template>
  <div class="app-root" :class="{ 'no-animations': !animationsEnabled }">
    <!-- Top Bar / Application Chrome -->
    <header class="app-header">
      <div class="header-left">
        <span class="logo-badge" @click="zoomTo('space:org-a')">LERCH</span>
        
        <!-- Space entry point selector -->
        <div class="space-picker">
          <label for="space-select" class="picker-label">Space:</label>
          <select
            id="space-select"
            class="header-select"
            :value="isSpace ? currentItem.space : currentItem.space"
            @change="handleSwitchSpace(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="sp in spaces" :key="sp.id" :value="sp.id">
              {{ sp.name }} ({{ sp.kind }})
            </option>
          </select>
        </div>
      </div>

      <div class="header-center">
        <!-- Quick command pane button -->
        <button
          type="button"
          class="cmd-trigger-btn"
          title="Open Command Pane (Ctrl+P)"
          @click="isCommandPaneOpen = true"
        >
          <span class="cmd-icon">🔍</span>
          <span class="cmd-text">Find items & commands...</span>
          <kbd class="cmd-kbd">Ctrl+P</kbd>
        </button>
      </div>

      <div class="header-right">
        <!-- Animation toggle button -->
        <button
          type="button"
          class="motion-toggle-btn"
          :class="{ 'is-active': animationsEnabled }"
          :title="animationsEnabled ? 'Animations enabled (click to disable)' : 'Animations disabled (click to enable)'"
          @click="toggleAnimations"
        >
          <span class="motion-icon">{{ animationsEnabled ? '⚡' : '⏸' }}</span>
          <span class="motion-text">Motion: {{ animationsEnabled ? 'ON' : 'OFF' }}</span>
        </button>

        <!-- Current Actor (Identity Stub) -->
        <div class="actor-picker">
          <label for="actor-select" class="picker-label">Actor:</label>
          <select id="actor-select" v-model="currentActor" class="header-select">
            <option v-for="a in actors" :key="a.id" :value="a.id">
              {{ a.name }} ({{ a.kind }})
            </option>
          </select>
        </div>
      </div>
    </header>

    <!-- Main Workspace Container -->
    <main class="workspace-main">
      <!-- Registerkarten: Notebook tabs for the zoom path -->
      <Registerkarten
        :ancestry="ancestry"
        :current-id="currentItem.id"
        @zoom="zoomTo"
      />

      <!-- Zoom Layer: Current item view with children tiles, creation bar & board -->
      <ZoomLayer
        :current="currentItem"
        :children="children"
        :columns="columns"
        :is-space="isSpace"
        @zoom="zoomTo"
        @create-child="handleCreateChild"
        @update-item="handleUpdateItem"
        @update-child="handleUpdateChild"
      />
    </main>

    <!-- Command Pane (Ctrl+P) Modal -->
    <CommandPane
      :is-open="isCommandPaneOpen"
      :can-zoom-out="canZoomOut"
      :animations-enabled="animationsEnabled"
      :spaces="spaces"
      @close="isCommandPaneOpen = false"
      @zoom="zoomTo"
      @zoom-out="zoomOut"
      @focus-new-item="focusNewItemInput"
      @toggle-animations="toggleAnimations"
      @switch-space="handleSwitchSpace"
    />
  </div>
</template>

<style>
/* Base typography and layout reset */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #1f2328;
  background: #f6f8fa;
}

#__nuxt {
  height: 100%;
}
</style>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Chrome Header */
.app-header {
  height: 48px;
  background: #24292f;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
  z-index: 10;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-badge {
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: #58a6ff;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.logo-badge:hover {
  background: rgba(255, 255, 255, 0.1);
}

.picker-label {
  font-size: 0.7rem;
  color: #8b949e;
  margin-right: 0.25rem;
}

.header-select {
  background: #161b22;
  color: #c9d1d9;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.header-center {
  flex: 1;
  max-width: 420px;
  margin: 0 1rem;
}

.cmd-trigger-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  color: #8b949e;
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cmd-trigger-btn:hover {
  border-color: #58a6ff;
  background: #21262d;
  color: #c9d1d9;
}

.cmd-text {
  flex: 1;
  text-align: left;
}

.cmd-kbd {
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 3px;
  padding: 0.1rem 0.35rem;
  font-size: 0.65rem;
  color: #c9d1d9;
}

.motion-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 0.2rem 0.55rem;
  color: #8b949e;
  font-size: 0.75rem;
  cursor: pointer;
}

.motion-toggle-btn.is-active {
  border-color: #238636;
  color: #3fb950;
  background: rgba(35, 134, 54, 0.15);
}

/* Workspace Main Container */
.workspace-main {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  /* View transition name for seamless zooming */
  view-transition-name: zoom-stage;
}

/* Responsive layout: vertical tabs on desktop, horizontal on mobile */
@media (max-width: 767px) {
  .workspace-main {
    flex-direction: column;
  }
}

/* Strict zero motion when animations are disabled: "With animations off, nothing moves." */
:global(.no-animations *),
:global(.no-animations *::before),
:global(.no-animations *::after) {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}

:global(.no-animations::view-transition-group(*)),
:global(.no-animations::view-transition-old(*)),
:global(.no-animations::view-transition-new(*)) {
  animation: none !important;
}

/* Smooth zoom transition when animations are enabled */
::view-transition-old(zoom-stage) {
  animation: zoom-out 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-new(zoom-stage) {
  animation: zoom-in 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes zoom-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes zoom-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.03);
  }
}
</style>
