# Frontend ↔ Backend integration explanation

This file explains how the frontend talks to the backend, what JSON is sent/received, and how that maps back into UI behavior.

## Ports and URLs (local dev)

- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:8000`

The frontend calls backend using `fetch(...)` to these endpoints.

## CORS (why the browser allows calls)

Because the frontend and backend are on different origins (different ports), the browser enforces CORS rules.

Backend enables CORS in `backend/app/main.py` (same file that mounts routers):
- it allows requests from `http://localhost:5173`
- it allows all methods and headers

That’s what makes the browser calls succeed.

## Data shapes: internal UI vs exported API

### Internal UI tree (`TagNode`)
- Used only in the frontend.
- Includes `id` for Vue `v-for` keys + collapse state.

Example:
```json
{
  "id": "c5c3... (uuid)",
  "name": "child2",
  "data": "c2 World"
}
```

### Export/API tree (`TagNodeExport` / `ApiTagNode`)
- Sent to backend and stored in DB.
- Must contain only:
  - `name`
  - `children` OR `data`
- No `id`.

Example:
```json
{
  "name": "child2",
  "data": "c2 World"
}
```

## Where conversion happens

### UI → API (Export)

In `frontend/src/TreeEditor.tsx`:
1. User clicks **Export**
2. We compute:
   - `exportedTree = exportTree(tree)` (drops UI ids)
   - `exportedJson = JSON.stringify(exportedTree, null, 2)`
3. We call `onSave(savedId, exportedTree)` which performs POST/PUT

The key converter is `exportTree(...)` in `frontend/src/tagTree.ts`.

### API → UI (Load)

In `frontend/src/App.tsx`:
1. On page open, `useEffect` calls `fetchTrees()`
2. Backend returns a list of items, each:
   - `id` (database id)
   - `tree` (nested JSON with only name/children/data)
3. Frontend turns each API tree into UI tree by adding `id` fields:
   - `withIds(t.tree)`

This is required because Vue needs stable `key`s in lists and we store collapse state by node id.

## Endpoint-by-endpoint integration

### 1) `GET /trees` (load all saved trees)

Frontend code:
- `frontend/src/api.ts` → `fetchTrees()`
- `frontend/src/App.tsx` → called inside `useEffect` (runs on mount)

Request:
- Method: `GET`
- URL: `http://localhost:8000/trees`

Response shape:
```json
{
  "items": [
    { "id": 1, "tree": { "name": "root", "children": [ ... ] } },
    { "id": 2, "tree": { "name": "root", "children": [ ... ] } }
  ]
}
```

UI result:
- App maps each item to a `TreeEditor`
- Trees are shown **one below the other** on the same page (assignment requirement)

### 2) `POST /trees` (save new tree)

When it happens:
- In a “New” editor, `savedId` is undefined → Export triggers create.

Frontend:
- `frontend/src/api.ts` → `createTree(tree)`

Request:
- Method: `POST`
- URL: `http://localhost:8000/trees`
- Headers: `content-type: application/json`
- Body:
```json
{
  "tree": {
    "name": "root",
    "children": [
      { "name": "child2", "data": "c2 World" }
    ]
  }
}
```

Response:
```json
{
  "id": 12,
  "tree": { ...same nested JSON... }
}
```

UI result:
- The editor stores the returned id as `savedId`
- App updates the title from “Tree New” → “Tree 12” via `onSavedIdChange`

### 3) `PUT /trees/{id}` (update existing)

When it happens:
- For a saved editor, `savedId` is set → Export triggers update.

Frontend:
- `frontend/src/api.ts` → `updateTree(id, tree)`

Request:
- Method: `PUT`
- URL: `http://localhost:8000/trees/12`
- JSON body: `{ "tree": ... }` (same shape as POST)

Response:
- same shape as POST, with id and tree.

UI result:
- Remains “Saved #12”
- After refresh, the loaded tree should include your changes (persistence verification)

### 4) `DELETE /trees/{id}` (delete existing)

When it happens:
- User clicks Delete on a saved editor.

Frontend:
- `frontend/src/api.ts` → `deleteTree(id)`
- `frontend/src/App.tsx` → `handleDelete(...)` removes editor from list

Request:
- Method: `DELETE`
- URL: `http://localhost:8000/trees/12`

Response:
```json
{ "ok": true }
```

UI result:
- Tree editor disappears immediately
- On refresh, the deleted tree no longer loads

## Validation rules enforced by backend (important integration detail)

Backend schema (`backend/app/schemas/tree.py`, Pydantic) enforces:
- each node must have `name`
- each node must have exactly one of:
  - `children` (a list)
  - `data` (a string)

So if the frontend ever exported an invalid node (both children and data, or neither), the backend would reject the request with a validation error.

