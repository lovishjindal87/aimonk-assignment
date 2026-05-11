# AIMonk Full Stack Assignment (Nested Tags Tree)

This repo contains:
- `frontend/`: React + TypeScript UI
- `backend/`: FastAPI + SQLite API

## Run locally

### Backend (FastAPI)
From the repo root:

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify:
- `GET` `http://localhost:8000/health`
- `GET` `http://localhost:8000/trees`

### Frontend (React)
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:
- `http://localhost:5173`

## What you can do in the UI
- **Collapse/expand**: click the `v` / `>` button next to any tag (including root)
- **Edit data**: leaf tags render a text input; edits change the in-memory tree
- **Add child**: converts a leaf `data` into `children` with a single `New Child` node
- **Rename (bonus)**: click a tag name, type a new name, press Enter
- **Export**: prints JSON and saves to the backend (POST for new trees, PUT for saved trees)

