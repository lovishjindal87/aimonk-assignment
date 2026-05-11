<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import TreeEditor from './components/TreeEditor.vue'
import { makeInitialTree, withIds } from './tagTree'
import type { TagNode, TagNodeExport } from './tagTypes'
import { createTree, deleteTree, fetchTrees, updateTree } from './api'

const toast = useToast()

function newClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `c_${Math.random().toString(16).slice(2)}`
}

type TreeRow = { clientId: string; id?: number; tree: TagNode }

const trees = ref<TreeRow[]>([{ clientId: newClientId(), tree: makeInitialTree() }])
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    const items = await fetchTrees()
    if (items.length === 0) {
      trees.value = [{ clientId: newClientId(), tree: makeInitialTree() }]
    } else {
      trees.value = items.map((t) => ({
        clientId: newClientId(),
        id: t.id,
        tree: withIds(t.tree),
      }))
      toast.success(`Loaded ${items.length} tree${items.length === 1 ? '' : 's'}.`, { timeout: 2200 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load trees'
    loadError.value = msg
    trees.value = [{ clientId: newClientId(), tree: makeInitialTree() }]
    toast.error(`Load failed: ${msg}`, { timeout: 4200 })
  } finally {
    loading.value = false
  }
})

const subtitle = computed(() => {
  if (loading.value) return 'Loading saved trees…'
  if (loadError.value) return `Loaded with a warning: ${loadError.value}`
  return 'Each saved tree is displayed below. Export saves to the backend.'
})

async function saveTree(treeId: number | undefined, exported: TagNodeExport): Promise<number> {
  try {
    if (!treeId) {
      const created = await createTree(exported)
      toast.success(`Saved as #${created.id}.`, { timeout: 2200 })
      return created.id
    }
    await updateTree(treeId, exported)
    toast.success(`#${treeId} updated.`, { timeout: 2200 })
    return treeId
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Save failed'
    toast.error(`Save failed: ${msg}`, { timeout: 4500 })
    throw e
  }
}

function handleNewTree() {
  trees.value = [{ clientId: newClientId(), tree: makeInitialTree() }, ...trees.value]
}

function handleSavedIdChange(clientId: string, nextId: number) {
  trees.value = trees.value.map((t) => (t.clientId === clientId ? { ...t, id: nextId } : t))
}

async function handleDelete(clientId: string, treeId: number | undefined) {
  try {
    if (treeId) {
      await deleteTree(treeId)
      toast.success(`#${treeId} removed.`, { timeout: 2200 })
    }
    trees.value = trees.value.filter((t) => t.clientId !== clientId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed'
    toast.error(`Delete failed: ${msg}`, { timeout: 4500 })
    throw e
  }
}
</script>

<template>
  <div class="page">
    <header class="topBar">
      <div class="titleBlock">
        <h1>Nested Tags Tree</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button type="button" class="secondaryBtn" @click="handleNewTree">New Tree</button>
    </header>

    <main class="main">
      <div class="stack">
        <TreeEditor
          v-for="t in trees"
          :key="t.clientId"
          :client-id="t.clientId"
          :title="`Tree ${t.id ?? 'New'}`"
          :tree-id="t.id"
          :initial="t.tree"
          :on-save="saveTree"
          :on-saved-id-change="handleSavedIdChange"
          :on-delete="handleDelete"
        />
      </div>
    </main>
  </div>
</template>
