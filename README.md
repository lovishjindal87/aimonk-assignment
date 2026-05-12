# AIMonk Full Stack Assignment (Nested Tags Tree)

This repo contains:
- `frontend/`: Vue 3 + TypeScript UI (Vite)
- `backend/`: FastAPI + **PostgreSQL** (SQLAlchemy ORM)

This project uses **PostgreSQL** for local and hosted deployments. SQLite is still supported if you set `DATABASE_URL=sqlite:///./aimonk.db` (file only; not for durable data on Vercel serverless or typical PaaS disks).

**Backend layout:** `app/main.py` mounts routers; `app/api/routes/` holds HTTP handlers; `app/schemas/` is Pydantic; `app/repositories/` is SQLAlchemy persistence; `app/models/` are ORM tables; `app/db/` is engine + sessions.

## Prerequisites

- **Node.js** (for the frontend)
- **Python 3.12** — use `python3.12` locally; `backend/.python-version` and `backend/runtime.txt` pin **3.12** for Vercel / Render
- **PostgreSQL** — create an empty database (e.g. `aimonk`) and note host, port, user, password

## Run locally

### Backend (FastAPI)

From the repo root:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DATABASE_URL to your Postgres connection string, then:
uvicorn app.main:app --reload --port 8000
```

On first start, SQLAlchemy **`create_all`** creates the `trees` and `tags` tables in that database.

Verify:
- `GET` `http://localhost:8000/health`
- `GET` `http://localhost:8000/trees`

### Frontend (Vue)

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # optional; defaults API to http://localhost:8000
npm run dev
```

Open `http://localhost:5173`.

## Toasts

Small **success / error** toasts (bottom-right, fade) only for **server outcomes**: load trees, save (export), delete saved tree, and failures.

## What you can do in the UI

- **Collapse/expand**: click the `v` / `>` button next to any tag (including root)
- **Edit data**: leaf tags render a text input; edits change the in-memory tree
- **Add child**: converts a leaf `data` into `children` with a single `New Child` node
- **Rename (bonus)**: click a tag name, type a new name, press Enter
- **Export**: prints JSON and saves to the backend (POST for new trees, PUT for saved trees)

## Vercel API: 500 / FUNCTION_INVOCATION_FAILED

1. **Logs:** Vercel project → **Deployments** → latest → **Functions** / **Runtime Logs** — the Python traceback shows the real error (do not paste secrets here).
2. **`DATABASE_URL`:** Set your Neon (or other) URL on the **backend** Vercel project. Without it, the app used to default to a **SQLite file in cwd**, which is **not writable** on serverless; the code now falls back to **`/tmp`** on Vercel only for that default — for real data you still need Postgres + `DATABASE_URL`.
3. **`CORS_ORIGINS`:** Use your real frontend origin(s), e.g. `https://your-app.vercel.app`. Do **not** set `CORS_ORIGINS=*` with cookies/credentials (Starlette rejects that and can crash startup); list explicit origins instead.
4. **Neon URL:** Include `?sslmode=require` as Neon provides; keep the full string from “Copy snippet”.


