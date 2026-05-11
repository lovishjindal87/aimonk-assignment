# Backend explanation (FastAPI + SQLAlchemy + SQLite)

This document explains the backend **line by line** (by file), including the database schema and how each HTTP route runs end-to-end.

**Folder map:** see [`STRUCTURE.md`](./STRUCTURE.md) for the full tree. The old flat `app/db.py`, `app/models.py`, etc. were split into **`db/`**, **`models/`**, **`schemas/`**, **`repositories/`**, and **`api/routes/`** so each file has one clear job.

---

## Quick mental model

- We store multiple “trees”.
- Each tree is many **`Tag`** rows linked to one **`Tree`** row; hierarchy uses **`parent_id`** (adjacency list).
- HTTP layer: **`api/routes/`** → validation **`schemas/`** → persistence **`repositories/`** → tables **`models/`**.

---

## Why we store nodes in a table (instead of one JSON blob)

The assignment allows SQL and asks for a suitable schema. We store **one row per node** so the hierarchy is a real relational model (good for ordering, FK cascades, and future queries).

---

## `backend/app/db/base.py`

- Imports **`declarative_base`** from SQLAlchemy.
- **`Base = declarative_base()`** — every ORM model subclasses this so all tables share one metadata registry (`Base.metadata`).

---

## `backend/app/db/session.py`

- **`DATABASE_URL`** — SQLite file `aimonk.db` next to where you run the server (typically `backend/`).
- **`create_engine(..., connect_args={"check_same_thread": False})`** — SQLite + multi-threaded ASGI servers.
- **`SessionLocal = sessionmaker(...)`** — factory for DB sessions.
- **`get_db()`** — yields a session and **always closes** it (FastAPI `Depends` pattern).

---

## `backend/app/db/__init__.py`

- Re-exports **`Base`**, **`engine`**, **`SessionLocal`**, **`get_db`** so other code can do `from app.db import ...` if you want (optional style).

---

## `backend/app/models/hierarchy.py`

- Imports **`Base`** from `app.db.base`.
- **`Tree`** — table `trees`: `id`, timestamps; **`relationship`** to `tags` with cascade delete.
- **`Tag`** — table `tags`: `tree_id`, `parent_id` (nullable for root), **`position`** (sibling order), `name`, nullable **`data`** (null when node has children).
- Self-referential **`parent` / `children`** relationships for the tree shape.

---

## `backend/app/models/__init__.py`

- Imports **`Tree`**, **`Tag`** from `hierarchy` so **`from app.models import Tree, Tag`** registers models on the metadata before `create_all` in `main.py`.

---

## `backend/app/schemas/tree.py`

- **`TagNode`** — recursive Pydantic model: `name`, optional `children` **or** `data`.
- **`@model_validator`** — enforces **exactly one** of `children` or `data` (matches the assignment).
- **`TreeCreate` / `TreeUpdate`** — body wrapper `{ "tree": <TagNode> }`.
- **`TreeOut`** — `{ "id", "tree" }` for one record.
- **`TreesOut`** — `{ "items": [ TreeOut, ... ] }` for list.

---

## `backend/app/repositories/tree_repository.py`

All functions take **`db: Session`** (no FastAPI here — easier to unit test).

- **`_insert_tag_subtree`** — inserts one `Tag`, `flush()` for id, recurses for `node.children` with `position` = index.
- **`create_tree`** — insert `Tree`, flush, insert root subtree, `commit`, `refresh`.
- **`replace_tree`** — delete all `Tag` rows for `tree_id`, re-insert from JSON; returns `None` if tree id missing.
- **`_build_tree_from_tags`** — groups flat `Tag` rows by `parent_id`, sorts by `position`, builds nested **`TagNode`** from root (`parent_id is None`).
- **`list_trees`** — all `Tree` rows, each rebuilt via `_build_tree_from_tags`.
- **`get_tree`** — one tree by id or `None`.
- **`delete_tree`** — `db.delete(tree)`; cascades remove tags.

---

## `backend/app/api/deps.py`

- Re-exports **`get_db`** from `app.db.session` so routes use **`from app.api.deps import get_db`** (one obvious place for “how we get a DB session”).

---

## `backend/app/api/routes/health.py`

- **`APIRouter`** with **`GET /health`** → **`{"ok": True}`** (smoke test).

---

## `backend/app/api/routes/trees.py`

- **`APIRouter`** (no prefix here; **`main.py`** mounts it at **`/trees`**).

| Handler | Method + path | What it does |
|---------|----------------|----------------|
| `get_trees` | `GET ""` → **`GET /trees`** | `tree_repository.list_trees`, wrap as `TreesOut`. |
| `post_tree` | `POST ""` | `create_tree`, reload with `get_tree`, return `TreeOut`. |
| `put_tree` | `PUT /{tree_id}` | `replace_tree`; **404** if missing; return `TreeOut`. |
| `delete_tree` | `DELETE /{tree_id}` | `delete_tree` in repo; **404** if missing; **`{"ok": true}`**. |

---

## `backend/app/main.py`

- Imports **`health`** and **`trees`** route modules.
- Imports **`Base`**, **`engine`**, and **`Tag, Tree`** (side effect: register models).
- **`Base.metadata.create_all(bind=engine)`** — creates tables if missing.
- **`CORSMiddleware`** — allow `http://localhost:5173` for the Vite dev server.
- **`include_router(health.router)`** — `/health` at app root.
- **`include_router(trees.router, prefix="/trees")`** — all tree CRUD under `/trees`.

---

## FastAPI concepts (for interviews)

- **`FastAPI()`** — ASGI app.
- **`APIRouter`** — groups routes; keeps `trees.py` small and focused.
- **`Depends(get_db)`** — each request gets a fresh `Session`; dependency injection.
- **`response_model=TreesOut`** — response is validated/serialized to that schema.
- **`HTTPException(404, ...)`** — standard error response.

---

## SQLAlchemy concepts (for interviews)

- **`Session`** — unit of work: add/query/delete, then **`commit()`** or rollback.
- **`flush()`** — send SQL to DB for pending rows so primary keys exist before child FKs.
- **`select(Model)`** / **`db.scalars`** — read queries.
- **`relationship` + `cascade`** — deleting a `Tree` deletes its `Tag` rows.

---

## Pydantic concepts (for interviews)

- Validates JSON **before** your route logic runs.
- **`model_validator`** — cross-field rules (children vs data).

---

## How to run tests quickly

From `backend/` with venv active:

```bash
python -c "from fastapi.testclient import TestClient; from app.main import app; c=TestClient(app); print(c.get('/trees').json())"
```

`uvicorn` entrypoint is still **`app.main:app`** (unchanged).
