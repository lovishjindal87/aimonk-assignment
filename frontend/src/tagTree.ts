import type { TagNode, TagNodeExport } from './tagTypes'

type RawTagNode = {
  name: string
  children?: RawTagNode[]
  data?: string
}

function createId() {
  // Good enough for UI keys; backend will assign real IDs later.
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`
}

export function withIds(node: RawTagNode): TagNode {
  const id = createId()
  if ('children' in node && node.children) {
    return { id, name: node.name, children: node.children.map(withIds) }
  }
  return { id, name: node.name, data: node.data ?? '' }
}

export function exportTree(node: TagNode): TagNodeExport {
  if (node.children && node.children.length > 0) {
    return {
      name: node.name,
      children: node.children.map(exportTree),
    }
  }
  return {
    name: node.name,
    data: node.data ?? '',
  }
}

export const rawInitialTree: RawTagNode = {
  name: 'root',
  children: [
    {
      name: 'child1',
      children: [
        { name: 'child1-child1', data: 'c1-c1 Hello' },
        { name: 'child1-child2', data: 'c1-c2 JS' },
      ],
    },
    { name: 'child2', data: 'c2 World' },
  ],
}

export function makeInitialTree(): TagNode {
  return withIds(rawInitialTree)
}

export const initialTree: TagNode = makeInitialTree()

