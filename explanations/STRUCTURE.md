# Project structure (frontend + backend)

How the repo is organized so you can navigate and explain it in an interview.

---

## Backend (`backend/`)

Run the API from the `backend` folder: `uvicorn app.main:app --reload --port 8000`  
Python package root is **`app`** (the `app/` directory under `backend/`).

```
backend/
  requirements.txt
  aimonk.db                 # SQLite file (created at runtime; gitignored)
  app/
    main.py                 # FastAPI app, CORS, create_all, mount routers
    api/
      deps.py               # Re-exports get_db for route modules
      routes/
        health.py           # GET /health
        trees.py            # GET/POST/PUT/DELETE under /trees
    db/
      base.py               # SQLAlchemy declarative Base
      session.py            # engine, SessionLocal, get_db()
    models/
      hierarchy.py          # ORM: Tree + Tag tables
      __init__.py           # Imports models so metadata registers before create_all
    schemas/
      tree.py               # Pydantic: TagNode, TreeCreate, TreeUpdate, TreeOut, TreesOut
      __init__.py
    repositories/
      tree_repository.py    # DB operations: list/create/replace/get/delete trees
```

### How a request flows (backend)

1. **`main.py`** creates `app`, runs `Base.metadata.create_all(engine)`, adds CORS, then:
   - `include_router(health.router)` → `/health`
   - `include_router(trees.router, prefix="/trees")` → `/trees`, `/trees/{id}`, …
2. A route in **`api/routes/trees.py`** receives JSON, validates with **`schemas/tree.py`**, and calls **`repositories/tree_repository.py`** with a `Session` from **`get_db`** (defined in **`db/session.py`**).
3. The repository reads/writes **`models/hierarchy.py`** (`Tree` / `Tag` rows).

### Why this layout

| Layer | Responsibility |
|--------|------------------|
| `api/routes/` | HTTP only: paths, status codes, `Depends(get_db)` |
| `schemas/` | Request/response shapes + validation (Pydantic) |
| `repositories/` | SQLAlchemy queries and commits (no FastAPI imports) |
| `models/` | Table definitions |
| `db/` | Engine, sessions, shared `Base` |

This matches common FastAPI tutorials and keeps “wiring” separate from “database logic,” which is easier to test and explain.

---

## Frontend (`frontend/`)

```
frontend/
  package.json
  vite.config.ts
  index.html
  public/
    vite.svg
  src/
    main.ts                 # createApp, Toast plugin, global CSS
    App.vue                 # Page shell: load trees, New Tree, list of TreeEditor
    App.css                 # Layout + tag styling
    toast.css               # Toast appearance overrides
    api.ts                  # fetch/create/update/deleteTree → REST calls
    tagTypes.ts             # TagNode, TagNodeExport TypeScript types
    tagTree.ts              # withIds, exportTree, makeInitialTree, rawInitialTree
    treeOps.ts              # Immutable tree updates: setNodeData, setNodeName, addChild
    components/
      TreeEditor.vue        # One tree: export/delete, local state, hosts TagView
      TagView.vue           # Recursive tag row (collapse, data, rename, add child)
```

### How the UI flows (frontend)

1. **`main.ts`** mounts **`App.vue`** and loads global styles + toasts.
2. **`App.vue`** calls **`api.ts`** on mount, builds a list of tree rows, renders one **`TreeEditor.vue`** per row.
3. **`TreeEditor.vue`** holds `tree` + collapse state, uses **`treeOps`** / **`tagTree`** for mutations and export JSON, and passes the root node into **`TagView.vue`**.
4. **`TagView.vue`** recurses for children; **`api.ts`** talks to the backend.

---

## Docs in `explanations/`

| File | Contents |
|------|----------|
| `FOUNDATIONS.md` | Concepts from zero before reading code |
| `STRUCTURE.md` | This file — folder map |
| `FRONTEND.md` | Vue frontend walkthrough |
| `BACKEND.md` | FastAPI + SQLAlchemy walkthrough (paths match this layout) |
| `INTEGRATION.md` | How `api.ts` lines up with REST routes |
