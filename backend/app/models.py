from __future__ import annotations

import datetime as dt

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Tree(Base):
    __tablename__ = "trees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tags: Mapped[list[Tag]] = relationship("Tag", back_populates="tree", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tree_id: Mapped[int] = mapped_column(Integer, ForeignKey("trees.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), index=True)

    position: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(255))
    data: Mapped[str | None] = mapped_column(Text, nullable=True)

    tree: Mapped[Tree] = relationship("Tree", back_populates="tags")
    parent: Mapped[Tag | None] = relationship("Tag", remote_side="Tag.id", back_populates="children")
    children: Mapped[list[Tag]] = relationship("Tag", back_populates="parent", cascade="all, delete-orphan")

