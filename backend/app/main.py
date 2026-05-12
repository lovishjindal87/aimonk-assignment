import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, trees
from app.db.base import Base
from app.db.session import engine
from app.models import Tag, Tree  # noqa: F401


def _cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
    out = [o.strip() for o in raw.split(",") if o.strip()]
    return out if out else ["http://localhost:5173"]


app = FastAPI(title="AIMonk Tags Tree API")

Base.metadata.create_all(bind=engine)

_cors_allow = _cors_origins()
_cors_credentials = "*" not in _cors_allow

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow,
    allow_credentials=_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(trees.router, prefix="/trees")
