"""Application entry: FastAPI instance, middleware, and mounted routers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, trees
from app.db.base import Base
from app.db.session import engine
from app.models import Tag, Tree  # noqa: F401 — register models with Base.metadata

app = FastAPI(title="AIMonk Tags Tree API")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(trees.router, prefix="/trees")
