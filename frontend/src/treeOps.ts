import type { TagNode } from './tagTypes'

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`
}

export function updateNode(root: TagNode, targetId: string, updater: (n: TagNode) => TagNode): TagNode {
  if (root.id === targetId) return updater(root)
  if (!root.children) return root
  let changed = false
  const nextChildren = root.children.map((c) => {
    const next = updateNode(c, targetId, updater)
    if (next !== c) changed = true
    return next
  })
  if (!changed) return root
  return { ...root, children: nextChildren }
}

export function setNodeData(root: TagNode, targetId: string, data: string): TagNode {
  return updateNode(root, targetId, (n) => ({ ...n, data }))
}

export function setNodeName(root: TagNode, targetId: string, name: string): TagNode {
  return updateNode(root, targetId, (n) => ({ ...n, name }))
}

export function addChild(root: TagNode, targetId: string): TagNode {
  const newChild: TagNode = { id: createId(), name: 'New Child', data: 'Data' }

  return updateNode(root, targetId, (n) => {
    if (n.children && n.children.length > 0) {
      return { ...n, children: [...n.children, newChild] }
    }

    // Replace leaf "data" with "children" containing a single new child.
    return { id: n.id, name: n.name, children: [newChild] }
  })
}

