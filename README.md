# AIMonk Full Stack Assignment (Nested Tags Tree)

Vue + FastAPI implementation of the nested tag editor from the brief: collapsible nodes, leaf data fields, add-child behaviour, export to JSON (assignment shape only), rename-on-enter, and persistence for multiple trees via REST.

## Stack

- **Frontend:** Vue 3, TypeScript, Vite (`frontend/`)
- **Backend:** FastAPI, SQLAlchemy (`backend/`)
- **Database:** PostgreSQL in production (Neon is what I used). SQLite still works locally via `DATABASE_URL` if you want a file DB.

## Run it locally

**API** (from repo root):

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# set DATABASE_URL in .env, then:
uvicorn app.main:app --reload --port 8000
```

First boot creates `trees` / `tags` tables if they are missing. Hit `GET http://localhost:8000/health` and `GET http://localhost:8000/trees` to confirm.

**UI** (second terminal):

```bash
cd frontend
npm install
npm run dev
```

App is at `http://localhost:5173`. Optional: `cp .env.example .env` — only needed if the API is not on port 8000 (`VITE_API_BASE`).

## Environment

| Variable | Where | Notes |
|----------|--------|--------|
| `DATABASE_URL` | backend | Postgres connection string. `postgres://` is normalised to `postgresql://`. |
| `CORS_ORIGINS` | backend | Comma-separated origins, e.g. `http://localhost:5173` or your deployed frontend URL. |
| `VITE_API_BASE` | frontend build | Public API base URL, no trailing slash. |

## What you can do in the UI

- **Collapse/expand**: click the `v` / `>` button next to any tag (including root)
- **Edit data**: leaf tags render a text input; edits change the in-memory tree
- **Add child**: converts a leaf `data` into `children` with a single `New Child` node
- **Rename (bonus)**: click a tag name, type a new name, press Enter
- **Export**: prints JSON and saves to the backend (POST for new trees, PUT for saved trees)





