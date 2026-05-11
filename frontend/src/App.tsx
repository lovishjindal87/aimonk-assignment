import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { TreeEditor } from './TreeEditor'
import { makeInitialTree, withIds } from './tagTree'
import type { TagNode, TagNodeExport } from './tagTypes'
import { createTree, deleteTree, fetchTrees, updateTree } from './api'

function App() {
  const [trees, setTrees] = useState<Array<{ clientId: string; id?: number; tree: TagNode }>>([
    { clientId: globalThis.crypto?.randomUUID?.() ?? `c_${Math.random().toString(16).slice(2)}`, tree: makeInitialTree() },
  ])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const items = await fetchTrees()
        if (cancelled) return
        if (items.length === 0) {
          setTrees([
            {
              clientId: globalThis.crypto?.randomUUID?.() ?? `c_${Math.random().toString(16).slice(2)}`,
              tree: makeInitialTree(),
            },
          ])
        } else {
          setTrees(
            items.map((t) => ({
              clientId: globalThis.crypto?.randomUUID?.() ?? `c_${Math.random().toString(16).slice(2)}`,
              id: t.id,
              tree: withIds(t.tree),
            })),
          )
        }
      } catch (e) {
        if (cancelled) return
        setLoadError(e instanceof Error ? e.message : 'Failed to load trees')
        setTrees([
          {
            clientId: globalThis.crypto?.randomUUID?.() ?? `c_${Math.random().toString(16).slice(2)}`,
            tree: makeInitialTree(),
          },
        ])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const subtitle = useMemo(() => {
    if (loading) return 'Loading saved trees…'
    if (loadError) return `Loaded with a warning: ${loadError}`
    return 'Each saved tree is displayed below. Export saves to the backend.'
  }, [loading, loadError])

  async function saveTree(treeId: number | undefined, exported: TagNodeExport): Promise<number> {
    if (!treeId) {
      const created = await createTree(exported)
      return created.id
    }
    const updated = await updateTree(treeId, exported)
    return updated.id
  }

  function handleNewTree() {
    setTrees((prev) => [
      {
        clientId: globalThis.crypto?.randomUUID?.() ?? `c_${Math.random().toString(16).slice(2)}`,
        tree: makeInitialTree(),
      },
      ...prev,
    ])
  }

  function handleSavedIdChange(clientId: string, nextId: number) {
    setTrees((prev) => prev.map((t) => (t.clientId === clientId ? { ...t, id: nextId } : t)))
  }

  async function handleDelete(clientId: string, treeId: number | undefined) {
    if (treeId) await deleteTree(treeId)
    setTrees((prev) => prev.filter((t) => t.clientId !== clientId))
  }

  return (
    <div className="page">
      <header className="topBar">
        <div className="titleBlock">
          <h1>Nested Tags Tree</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        <button type="button" className="secondaryBtn" onClick={handleNewTree}>
          New Tree
        </button>
      </header>

      <main className="main">
        <div className="stack">
          {trees.map((t) => (
            <TreeEditor
              key={t.clientId}
              clientId={t.clientId}
              title={`Tree ${t.id ?? 'New'}`}
              treeId={t.id}
              initial={t.tree}
              onSave={saveTree}
              onSavedIdChange={handleSavedIdChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
