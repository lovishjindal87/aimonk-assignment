from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


def _normalize_database_url(url: str) -> str:
    # Some hosts (e.g. Render) supply postgres://; SQLAlchemy expects postgresql://
    if url.startswith("postgres://"):
        return "postgresql://" + url.removeprefix("postgres://")
    return url


_raw_url = os.environ.get("DATABASE_URL", "sqlite:///./aimonk.db")
DATABASE_URL = _normalize_database_url(_raw_url)

_engine_kw: dict = {}
if DATABASE_URL.startswith("sqlite"):
    _engine_kw["connect_args"] = {"check_same_thread": False}
else:
    _engine_kw["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **_engine_kw)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
