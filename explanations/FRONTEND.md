# Frontend explanation (Vue 3 + TypeScript + Vite) — line by line

> **Note:** The app is implemented as Vue 3 **single-file components** (`src/App.vue`, `src/components/TreeEditor.vue`, `src/components/TagView.vue`) plus shared TypeScript modules (`tagTree.ts`, `treeOps.ts`, `api.ts`). Some sections below still use React-era wording (“hooks”, “useState”); mentally swap those for Vue **`ref` / `computed` / `onMounted`** and **`<script setup>`**.

**Folder map:** see [`STRUCTURE.md`](./STRUCTURE.md) under “Frontend” for the full `src/` tree (including `main.ts`, `App.css`, `toast.css`, and `api.ts`).

This document explains the frontend **line by line**, and also explains the **runtime flow** when you use the app in the browser.

## Quick mental model

- The UI displays **0 or more tree editors** on one page.
- Each tree editor owns:
  - a `tree` state object (your nested tag tree)
  - a `collapsedIds` set (which nodes are collapsed)
  - an “Export” action that:
    - converts the internal tree to export JSON (only `name/children/data`)
    - calls the backend to save (POST for new tree, PUT for existing)
- `TagView` is a **recursive component**: it renders a node, and if the node has children it renders `TagView` for each child.

## Runtime flow (what happens when you open and use the app)

1. You open `http://localhost:5173`.
2. `App` mounts and immediately calls the backend `GET /trees`.
3. If the backend returns saved trees:
   - `App` creates a list of editors, one per saved tree, and renders them one below the other.
4. If backend is empty or unreachable:
   - `App` shows one “New” tree editor using the default `initialTree`.
5. Inside each editor:
   - typing into a leaf “Data” input updates the in-memory `tree` state
   - clicking “Add Child” either appends a child (if already a parent) or converts a leaf into a parent
   - clicking `v`/`>` toggles collapse for that node’s id
   - clicking the tag name starts rename mode; Enter saves the new name
6. Clicking Export:
   - renders the exported JSON in the right-hand textarea
   - saves it to backend (POST/PUT)
7. Clicking Delete:
   - if the tree is saved, it deletes it on backend (DELETE)
   - removes that editor from the page

---

## File-by-file, line-by-line

### Where the Vue code lives (read this first)

| This doc still says (React-era filename) | Actual file in the repo |
|------------------------------------------|---------------------------|
| `TagView.tsx` | `frontend/src/components/TagView.vue` |
| `TreeEditor.tsx` | `frontend/src/components/TreeEditor.vue` |
| `App.tsx` | `frontend/src/App.vue` |
| *(not in older sections)* | `frontend/src/main.ts` — `createApp(App)`, imports **`App.css`** + **`toast.css`**, registers **vue-toastification**, then `mount('#app')` |

The **plain `.ts` modules** below (`tagTypes.ts`, `tagTree.ts`, `treeOps.ts`, `api.ts`) are described **exactly** as in the repo (paths unchanged).

For **`.vue` SFCs**, the **behavior** matches the older React-style walkthroughs further down: mentally map **`useState` → `ref`**, **`useMemo` → `computed`**, **`useEffect` → `onMounted`**, and JSX → **`<template>`** with **`v-for`**, **`@click`**, **`@input`**, and **`<script setup lang="ts">`**.

---

### `frontend/src/tagTypes.ts`

```ts
export type TagNode = {
  id: string
  name: string
  children?: TagNode[]
  data?: string
}
```
- `TagNode` is the **internal UI representation** of a tag node.
- `id` is a **UI-only identifier** used for Vue `v-for` keys and collapse state.
- `name` is the label shown in the blue header.
- `children?` means “this node is a parent”; when present, we treat this node as having children.
- `data?` means “this node is a leaf”; when present, we render an input field.
- The assignment’s exported structure does not include `id`, so we keep it internal only.

```ts
export type TagNodeExport = {
  name: string
  children?: TagNodeExport[]
  data?: string
}
```
- `TagNodeExport` is the **exported JSON shape** required by the assignment:
  - **only** `name`, `children`, `data`
  - no internal `id`, no UI state, no extra properties.

---

### `frontend/src/tagTree.ts`

```ts
import type { TagNode, TagNodeExport } from './tagTypes'
```
- Imports TypeScript types so this file can type-check correctly.

```ts
type RawTagNode = {
  name: string
  children?: RawTagNode[]
  data?: string
}
```
- `RawTagNode` represents a tree **without UI ids** (just like the assignment examples).

```ts
function createId() {
  // Good enough for UI keys; backend will assign real IDs later.
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`
}
```
- Generates a unique id string.
- `crypto.randomUUID()` exists in modern browsers; the fallback uses `Math.random`.

```ts
export function withIds(node: RawTagNode): TagNode {
  const id = createId()
  if ('children' in node && node.children) {
    return { id, name: node.name, children: node.children.map(withIds) }
  }
  return { id, name: node.name, data: node.data ?? '' }
}
```
- Converts a raw node (no ids) into a UI node (with ids), **recursively**.
- If there are children:
  - return an object with `children` mapped through `withIds`.
- Otherwise:
  - return an object with `data`, defaulting to empty string.

```ts
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
```
- Converts internal UI tree (`TagNode` with `id`) into the **assignment export format** (`TagNodeExport`).
- Important: it intentionally **drops `id`** and exports only:
  - `name`
  - `children` (recursive)
  - `data`

```ts
export const rawInitialTree: RawTagNode = { ... }
```
- The default starter tree described in the assignment.
- This is the easy-to-read tree without ids.

```ts
export function makeInitialTree(): TagNode {
  return withIds(rawInitialTree)
}
```
- Creates a fresh initial tree with brand-new ids each time you call it.
- This matters when you create multiple “New Tree” editors so their ids don’t collide.

```ts
export const initialTree: TagNode = makeInitialTree()
```
- Convenience constant used in some places; it’s one default instance.

---

### `frontend/src/treeOps.ts`

```ts
import type { TagNode } from './tagTypes'
```
- Imports the internal tree type.

```ts
function createId() { ... }
```
- Same concept as in `tagTree.ts`: we need ids for new nodes created by “Add Child”.

```ts
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
```
- Generic “find a node by id and update it immutably” helper.
- Base cases:
  - if this is the node, apply `updater`
  - if leaf and not the node, return it unchanged
- Recursive case:
  - run update on children
  - if no child changed, return the original object (small optimization)
  - if a child changed, return a new root object with updated children.

```ts
export function setNodeData(root: TagNode, targetId: string, data: string): TagNode {
  return updateNode(root, targetId, (n) => ({ ...n, data }))
}
```
- Used when typing in a leaf data input.

```ts
export function setNodeName(root: TagNode, targetId: string, name: string): TagNode {
  return updateNode(root, targetId, (n) => ({ ...n, name }))
}
```
- Used for the bonus rename behavior.

```ts
export function addChild(root: TagNode, targetId: string): TagNode {
  const newChild: TagNode = { id: createId(), name: 'New Child', data: 'Data' }
  return updateNode(root, targetId, (n) => {
    if (n.children && n.children.length > 0) {
      return { ...n, children: [...n.children, newChild] }
    }
    return { id: n.id, name: n.name, children: [newChild] }
  })
}
```
- Implements the assignment’s Add Child rule:
  - if node already has children → append another child
  - if node is a leaf (`data`) → replace leaf with parent (`children: [newChild]`) and drop its `data`.

---

### `frontend/src/api.ts`

```ts
export type ApiTagNode = { ... }
export type ApiTreeOut = { id: number; tree: ApiTagNode }
export type ApiTreesOut = { items: ApiTreeOut[] }
```
- Types representing the backend JSON shapes.

```ts
const API_BASE = 'http://localhost:8000'
```
- Backend base URL in dev.

```ts
export async function fetchTrees(): Promise<ApiTreeOut[]> { ... }
```
- Calls `GET /trees` and returns `items`.

```ts
export async function createTree(tree: ApiTagNode): Promise<ApiTreeOut> { ... }
```
- Calls `POST /trees` with `{ tree: ... }`.

```ts
export async function updateTree(id: number, tree: ApiTagNode): Promise<ApiTreeOut> { ... }
```
- Calls `PUT /trees/{id}` with `{ tree: ... }`.

```ts
export async function deleteTree(id: number): Promise<void> { ... }
```
- Calls `DELETE /trees/{id}`.

---

### `frontend/src/components/TagView.vue` (see table above — older text below says `.tsx`)

```ts
import { useMemo, useState } from 'react'
import type { TagNode } from './tagTypes'
```
- Imports React hooks and the `TagNode` type.

```ts
type Props = { ... }
```
- Defines what the component needs:
  - the node to render
  - depth (indentation)
  - collapsed set and toggle callback
  - change callbacks for data and name
  - add-child callback

```ts
export function TagView({ ... }: Props) { ... }
```
- This is the **recursive renderer**.

```ts
const isCollapsed = collapsedIds.has(node.id)
const hasChildren = (node.children?.length ?? 0) > 0
```
- `isCollapsed` checks if this node is collapsed.
- `hasChildren` decides whether to render children or a leaf data input.

```ts
const indentStyle = useMemo(() => ({ paddingLeft: `${depth * 16}px` }), [depth])
```
- Computes indentation based on depth.

```ts
const [isRenaming, setIsRenaming] = useState(false)
const [draftName, setDraftName] = useState(node.name)
```
- Local UI state for inline rename:
  - whether the rename input is showing
  - the input’s text.

```tsx
<button ...>{isCollapsed ? '>' : 'v'}</button>
```
- Collapsing control required by the assignment.

Rename branch:
```tsx
{isRenaming ? (
  <input ... onKeyDown={(e) => { ... }} />
) : (
  <button className="tagName" onClick={() => setIsRenaming(true)}>
    {node.name}
  </button>
)}
```
- When not renaming, clicking the name enters renaming mode.
- When renaming:
  - Enter → calls `onNameChange` and exits
  - Escape → restores draft name and exits
  - Blur → exits (simple behavior)

```tsx
<button ... onClick={() => onAddChild(node.id)}>Add Child</button>
```
- Required “Add Child” action.

```tsx
{!isCollapsed && ( ... )}
```
- When collapsed, hide body (children/data).

Children recursion:
```tsx
{node.children!.map((c) => (
  <TagView key={c.id} node={c} depth={depth + 1} ... />
))}
```
- This is the recursive rendering of nested tags.

Leaf rendering:
```tsx
<input value={node.data ?? ''} onChange={(e) => onDataChange(node.id, e.target.value)} />
```
- Editing `data` updates the parent’s state through callback.

---

### `frontend/src/components/TreeEditor.vue` (see table above)

This component wraps a single tree into a “panel”:
- left side: tree UI
- right side: exported JSON
- top: Export/Delete buttons and status pills

Imports:
```ts
import { useMemo, useState } from 'react'
import { TagView } from './TagView'
import { exportTree } from './tagTree'
import { addChild, setNodeData, setNodeName } from './treeOps'
import type { TagNode, TagNodeExport } from './tagTypes'
```
- pulls in the recursive UI component, export converter, and mutation helpers.

Props:
```ts
type Props = {
  clientId: string
  title: string
  treeId?: number
  initial: TagNode
  onSave: ...
  onSavedIdChange: ...
  onDelete: ...
}
```
- `clientId` is a stable id for Vue list keys (`key` on `v-for`) and local editor identity.
- `treeId` is backend id if saved; `undefined` if new.

State:
```ts
const [tree, setTree] = useState<TagNode>(initial)
const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
const [exported, setExported] = useState<string>('')
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string>('')
const [savedId, setSavedId] = useState<number | undefined>(treeId)
```
- `tree` is the editable structure.
- `collapsedIds` controls what’s collapsed.
- `exported` is what you see in the textarea (only updated on Export).
- `saving` / `error` are UI states.
- `savedId` is the id used to decide POST vs PUT.

Export conversion:
```ts
const exportedTree = useMemo(() => exportTree(tree), [tree])
const exportedJson = useMemo(() => JSON.stringify(exportedTree, null, 2), [exportedTree])
```
- Convert `tree` → exported shape → pretty JSON.

Export and save:
```ts
const nextId = await onSave(savedId, exportedTree)
setSavedId(nextId)
onSavedIdChange(clientId, nextId)
```
- Calls parent `onSave` (which POSTs or PUTs).
- Updates its local `savedId`.
- Notifies parent so the “Tree New” title can become “Tree 123”.

Delete:
```ts
await onDelete(clientId, savedId)
```
- Parent decides whether to call backend (if saved) and removes editor from list.

Rendering:
- The header shows pills:
  - “Not saved” if no id
  - “Saved #id” if saved
  - “Saving…” while network is in progress
  - “error” pill on failure
- The body uses a 2-column grid:
  - left: `TagView`
  - right: exported JSON textarea

---

### `frontend/src/App.vue` (root page)

- **`<script setup lang="ts">`** — same responsibilities as the old `App.tsx` description: top-level page state and handlers.
- **Imports:** `TreeEditor` from `./components/TreeEditor.vue`, tree helpers from `./tagTree`, API from `./api`, **`useToast`** from `vue-toastification` (toasts only for server outcomes like load/save/delete).
- **State:** `trees` is a `ref<TreeRow[]>`; `loading` and `loadError` track the initial fetch.
- **`onMounted(async () => { ... })`** — replaces `useEffect(..., [])`: calls `fetchTrees()`, fills `trees` or a single draft, sets `loadError` on failure.
- **`subtitle`** — a `computed()` for the header line (loading / warning / default text).
- **`saveTree` / `handleNewTree` / `handleSavedIdChange` / `handleDelete`** — same logic as before: POST vs PUT, prepend new editor, patch `id` after save, `deleteTree` + filter list (with try/catch + toast errors in `saveTree` / `handleDelete`).
- **`<template>`** — header + `v-for="t in trees"` rendering **`<TreeEditor>`** with `:key="t.clientId"` and function props `:on-save`, `:on-delete`, etc.

---

### `frontend/src/App.css`

This is purely styling:
- `.page`, `.topBar`, `.panel` define layout/visuals.
- `.tagHeader`, `.collapseBtn`, `.addChildBtn` style the tag nodes.
- `.treeGrid` makes each editor a two-column layout (tree left, exported json right).
- `.secondaryBtn` styles “New Tree”.
- `.dangerBtn` styles “Delete”.

