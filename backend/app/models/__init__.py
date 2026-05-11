"""Import models so SQLAlchemy registers tables before `create_all`."""

from app.models.hierarchy import Tag, Tree

__all__ = ["Tag", "Tree"]
