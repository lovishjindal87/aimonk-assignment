<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TagNode } from '../tagTypes'
import TagViewItem from './TagView.vue'

const props = defineProps<{
  node: TagNode
  depth: number
  collapsedIds: Set<string>
}>()

const emit = defineEmits<{
  toggleCollapse: [id: string]
  dataChange: [id: string, data: string]
  nameChange: [id: string, name: string]
  addChild: [id: string]
}>()

const isCollapsed = computed(() => props.collapsedIds.has(props.node.id))
const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0)
const indentStyle = computed(() => ({ paddingLeft: `${props.depth * 16}px` }))

const isRenaming = ref(false)
const draftName = ref(props.node.name)

watch(
  () => props.node.name,
  (n) => {
    if (!isRenaming.value) draftName.value = n
  },
)

function onNameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    const next = draftName.value.trim()
    if (next.length > 0) emit('nameChange', props.node.id, next)
    isRenaming.value = false
  }
  if (e.key === 'Escape') {
    draftName.value = props.node.name
    isRenaming.value = false
  }
}
</script>

<template>
  <div class="tag" :style="indentStyle">
    <div class="tagHeader">
      <button
        type="button"
        class="collapseBtn"
        :aria-label="isCollapsed ? 'Expand' : 'Collapse'"
        @click="emit('toggleCollapse', node.id)"
      >
        {{ isCollapsed ? '>' : 'v' }}
      </button>
      <input
        v-if="isRenaming"
        v-model="draftName"
        class="nameInput"
        autofocus
        @blur="isRenaming = false"
        @keydown="onNameKeydown"
      />
      <button
        v-else
        type="button"
        class="tagName"
        title="Click to rename"
        @click="
          draftName = node.name;
          isRenaming = true
        "
      >
        {{ node.name }}
      </button>
      <button type="button" class="addChildBtn" @click="emit('addChild', node.id)">Add Child</button>
    </div>

    <div v-if="!isCollapsed" class="tagBody">
      <div v-if="hasChildren" class="children">
        <TagViewItem
          v-for="c in node.children"
          :key="c.id"
          :node="c"
          :depth="depth + 1"
          :collapsed-ids="collapsedIds"
          @toggle-collapse="(id: string) => emit('toggleCollapse', id)"
          @data-change="(id: string, data: string) => emit('dataChange', id, data)"
          @name-change="(id: string, name: string) => emit('nameChange', id, name)"
          @add-child="(id: string) => emit('addChild', id)"
        />
      </div>
      <label v-else class="dataRow">
        <span class="dataLabel">Data</span>
        <input
          class="dataInput"
          :value="node.data ?? ''"
          @input="emit('dataChange', node.id, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </div>
</template>
