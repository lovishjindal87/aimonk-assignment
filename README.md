# AIMonk Full Stack Assignment (Nested Tags Tree)

This repo contains:
- `frontend/`: Vue 3 + TypeScript UI (Vite)
- `backend/`: FastAPI + SQLite API

**Backend layout:** `app/main.py` mounts routers; `app/api/routes/` holds HTTP handlers; `app/schemas/` is Pydantic; `app/repositories/` is SQLAlchemy persistence; `app/models/` are ORM tables; `app/db/` is engine + sessions.

## Run locally

### Backend (FastAPI)
From the repo root:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify:
- `GET` `http://localhost:8000/health`
- `GET` `http://localhost:8000/trees`

### Frontend (Vue)
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:
- `http://localhost:5173`

### Env files (optional locally)

Copy examples and adjust if needed:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Frontend reads **`VITE_API_BASE`** (defaults to `http://localhost:8000` if unset).  
Backend reads **`CORS_ORIGINS`** (comma-separated, default `http://localhost:5173`) and **`DATABASE_URL`** (default local SQLite file).

## Deploy on Render

Use two services from the same repo (deploy the API first so you have its URL).

**Web Service (API)**

| Setting | Value |
|--------|--------|
| Root Directory | `backend` |
| Python version | Pinned via `backend/runtime.txt` (`python-3.11.9`) for Render |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

Environment: **`CORS_ORIGINS`** = your static site URL(s). Optional **`DATABASE_URL`** overrides the default SQLite file (use Postgres + a driver in `requirements.txt` if you attach a managed DB).

**Static Site (frontend)**

| Setting | Value |
|--------|--------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment (build-time): **`VITE_API_BASE`** = your API public URL (no trailing slash), e.g. `https://your-service.onrender.com`. Redeploy the site after changing it.

## Toasts
Small **success / error** toasts (bottom-right, fade) only for **server outcomes**: load trees, save (export), delete saved tree, and failures.

## What you can do in the UI
- **Collapse/expand**: click the `v` / `>` button next to any tag (including root)
- **Edit data**: leaf tags render a text input; edits change the in-memory tree
- **Add child**: converts a leaf `data` into `children` with a single `New Child` node
- **Rename (bonus)**: click a tag name, type a new name, press Enter
- **Export**: prints JSON and saves to the backend (POST for new trees, PUT for saved trees)

