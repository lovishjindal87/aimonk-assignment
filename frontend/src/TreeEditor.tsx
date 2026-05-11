import { useMemo, useState } from 'react'
import { TagView } from './TagView'
import { exportTree } from './tagTree'
import { addChild, setNodeData, setNodeName } from './treeOps'
import type { TagNode, TagNodeExport } from './tagTypes'

type Props = {
  clientId: string
  title: string
  treeId?: number
  initial: TagNode
  onSave: (treeId: number | undefined, exported: TagNodeExport) => Promise<number>
  onSavedIdChange: (clientId: string, nextId: number) => void
  onDelete: (clientId: string, treeId: number | undefined) => Promise<void>
}

export function TreeEditor({ clientId, title, treeId, initial, onSave, onSavedIdChange, onDelete }: Props) {
  const [tree, setTree] = useState<TagNode>(initial)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
  const [exported, setExported] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [savedId, setSavedId] = useState<number | undefined>(treeId)

  const exportedTree = useMemo(() => exportTree(tree), [tree])
  const exportedJson = useMemo(() => JSON.stringify(exportedTree, null, 2), [exportedTree])

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExportAndSave() {
    setExported(exportedJson)
    setSaving(true)
    setError('')
    try {
      const nextId = await onSave(savedId, exportedTree)
      setSavedId(nextId)
      onSavedIdChange(clientId, nextId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    setError('')
    try {
      await onDelete(clientId, savedId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <header className="treeHeader">
        <div className="treeTitle">
          <h2>{title}</h2>
          <div className="treeMeta">
            {savedId ? <span className="pill">Saved #{savedId}</span> : <span className="pill pillWarn">Not saved</span>}
            {saving && <span className="pill pillInfo">Saving…</span>}
            {error && <span className="pill pillError">{error}</span>}
          </div>
        </div>
        <div className="treeActions">
          <button type="button" className="dangerBtn" onClick={handleDelete} disabled={saving}>
            Delete
          </button>
          <button type="button" className="exportBtn" onClick={handleExportAndSave} disabled={saving}>
            Export
          </button>
        </div>
      </header>

      <div className="treeGrid">
        <div className="treePane">
          <TagView
            node={tree}
            depth={0}
            collapsedIds={collapsedIds}
            onToggleCollapse={toggleCollapse}
            onDataChange={(id, data) => setTree((prev) => setNodeData(prev, id, data))}
            onNameChange={(id, name) => setTree((prev) => setNodeName(prev, id, name))}
            onAddChild={(id) => setTree((prev) => addChild(prev, id))}
          />
        </div>

        <div className="exportPane">
          <textarea className="exportBox" readOnly value={exported} placeholder="(Exported JSON will appear here)" />
        </div>
      </div>
    </section>
  )
}

