<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TagView from './TagView.vue'
import { exportTree } from '../tagTree'
import { addChild, setNodeData, setNodeName } from '../treeOps'
import type { TagNode, TagNodeExport } from '../tagTypes'

const props = defineProps<{
  clientId: string
  title: string
  treeId?: number
  initial: TagNode
  onSave: (treeId: number | undefined, exported: TagNodeExport) => Promise<number>
  onSavedIdChange: (clientId: string, nextId: number) => void
  onDelete: (clientId: string, treeId: number | undefined) => Promise<void>
}>()

const tree = ref<TagNode>(props.initial)
const collapsedIds = ref<Set<string>>(new Set())
const exported = ref('')
const saving = ref(false)
const error = ref('')
const savedId = ref<number | undefined>(props.treeId)

watch(
  () => props.treeId,
  (id) => {
    savedId.value = id
  },
)

const exportedTree = computed(() => exportTree(tree.value))
const exportedJson = computed(() => JSON.stringify(exportedTree.value, null, 2))

function toggleCollapse(id: string) {
  const next = new Set(collapsedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedIds.value = next
}

function onDataChange(id: string, data: string) {
  tree.value = setNodeData(tree.value, id, data)
}

function onNameChange(id: string, name: string) {
  tree.value = setNodeName(tree.value, id, name)
}

function onAddChild(id: string) {
  tree.value = addChild(tree.value, id)
}

async function handleExportAndSave() {
  exported.value = exportedJson.value
  saving.value = true
  error.value = ''
  try {
    const nextId = await props.onSave(savedId.value, exportedTree.value)
    savedId.value = nextId
    props.onSavedIdChange(props.clientId, nextId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  saving.value = true
  error.value = ''
  try {
    await props.onDelete(props.clientId, savedId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="panel">
    <header class="treeHeader">
      <div class="treeTitle">
        <h2>{{ title }}</h2>
        <div class="treeMeta">
          <span v-if="savedId" class="pill">Saved #{{ savedId }}</span>
          <span v-else class="pill pillWarn">Not saved</span>
          <span v-if="saving" class="pill pillInfo">Saving…</span>
          <span v-if="error" class="pill pillError">{{ error }}</span>
        </div>
      </div>
      <div class="treeActions">
        <button type="button" class="dangerBtn" :disabled="saving" @click="handleDelete">Delete</button>
        <button type="button" class="exportBtn" :disabled="saving" @click="handleExportAndSave">Export</button>
      </div>
    </header>

    <div class="treeGrid">
      <div class="treePane">
        <TagView
          :node="tree"
          :depth="0"
          :collapsed-ids="collapsedIds"
          @toggle-collapse="toggleCollapse"
          @data-change="onDataChange"
          @name-change="onNameChange"
          @add-child="onAddChild"
        />
      </div>
      <div class="exportPane">
        <textarea class="exportBox" readonly :value="exported" placeholder="(Exported JSON will appear here)" />
      </div>
    </div>
  </section>
</template>
