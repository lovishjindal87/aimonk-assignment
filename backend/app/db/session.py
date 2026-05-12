from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url.removeprefix("postgres://")
    return url


_raw_url = os.environ.get("DATABASE_URL") or "sqlite:///./aimonk.db"
if os.environ.get("VERCEL") and _raw_url.startswith("sqlite:///./"):
    _raw_url = "sqlite:////tmp/aimonk.db"
DATABASE_URL = _normalize_database_url(_raw_url)

_engine_kw: dict = {}
if DATABASE_URL.startswith("sqlite"):
    _engine_kw["connect_args"] = {"check_same_thread": False}
else:
    _engine_kw["poolclass"] = NullPool

engine = create_engine(DATABASE_URL, **_engine_kw)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
