export type ApiTagNode = {
  name: string
  children?: ApiTagNode[]
  data?: string
}

export type ApiTreeOut = {
  id: number
  tree: ApiTagNode
}

export type ApiTreesOut = {
  items: ApiTreeOut[]
}

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://localhost:8000').replace(/\/$/, '')

export async function fetchTrees(): Promise<ApiTreeOut[]> {
  const res = await fetch(`${API_BASE}/trees`)
  if (!res.ok) throw new Error(`GET /trees failed: ${res.status}`)
  const data = (await res.json()) as ApiTreesOut
  return data.items
}

export async function createTree(tree: ApiTagNode): Promise<ApiTreeOut> {
  const res = await fetch(`${API_BASE}/trees`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tree }),
  })
  if (!res.ok) throw new Error(`POST /trees failed: ${res.status}`)
  return (await res.json()) as ApiTreeOut
}

export async function updateTree(id: number, tree: ApiTagNode): Promise<ApiTreeOut> {
  const res = await fetch(`${API_BASE}/trees/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tree }),
  })
  if (!res.ok) throw new Error(`PUT /trees/${id} failed: ${res.status}`)
  return (await res.json()) as ApiTreeOut
}

export async function deleteTree(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/trees/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /trees/${id} failed: ${res.status}`)
}
