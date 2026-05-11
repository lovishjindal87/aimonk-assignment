import { useMemo, useState } from 'react'
import type { TagNode } from './tagTypes'

type Props = {
  node: TagNode
  depth: number
  collapsedIds: Set<string>
  onToggleCollapse: (id: string) => void
  onDataChange: (id: string, data: string) => void
  onNameChange: (id: string, name: string) => void
  onAddChild: (id: string) => void
}

export function TagView({
  node,
  depth,
  collapsedIds,
  onToggleCollapse,
  onDataChange,
  onNameChange,
  onAddChild,
}: Props) {
  const isCollapsed = collapsedIds.has(node.id)
  const hasChildren = (node.children?.length ?? 0) > 0

  const indentStyle = useMemo(() => ({ paddingLeft: `${depth * 16}px` }), [depth])
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState(node.name)

  return (
    <div className="tag" style={indentStyle}>
      <div className="tagHeader">
        <button
          type="button"
          className="collapseBtn"
          onClick={() => onToggleCollapse(node.id)}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '>' : 'v'}
        </button>
        {isRenaming ? (
          <input
            className="nameInput"
            value={draftName}
            autoFocus
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => setIsRenaming(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const next = draftName.trim()
                if (next.length > 0) onNameChange(node.id, next)
                setIsRenaming(false)
              }
              if (e.key === 'Escape') {
                setDraftName(node.name)
                setIsRenaming(false)
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="tagName"
            title="Click to rename"
            onClick={() => {
              setDraftName(node.name)
              setIsRenaming(true)
            }}
          >
            {node.name}
          </button>
        )}
        <button type="button" className="addChildBtn" onClick={() => onAddChild(node.id)}>
          Add Child
        </button>
      </div>

      {!isCollapsed && (
        <div className="tagBody">
          {hasChildren ? (
            <div className="children">
              {node.children!.map((c) => (
                <TagView
                  key={c.id}
                  node={c}
                  depth={depth + 1}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={onToggleCollapse}
                  onDataChange={onDataChange}
                  onNameChange={onNameChange}
                  onAddChild={onAddChild}
                />
              ))}
            </div>
          ) : (
            <label className="dataRow">
              <span className="dataLabel">Data</span>
              <input
                className="dataInput"
                value={node.data ?? ''}
                onChange={(e) => onDataChange(node.id, e.target.value)}
              />
            </label>
          )}
        </div>
      )}
    </div>
  )
}

