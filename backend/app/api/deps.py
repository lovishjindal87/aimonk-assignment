"""FastAPI dependencies shared by route modules."""

from app.db.session import get_db

__all__ = ["get_db"]
