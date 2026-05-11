from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator


class TagNode(BaseModel):
    name: str
    children: list["TagNode"] | None = None
    data: str | None = None

    @model_validator(mode="after")
    def validate_children_xor_data(self):
        has_children = self.children is not None
        has_data = self.data is not None
        if has_children == has_data:
            raise ValueError('TagNode must have exactly one of "children" or "data"')
        return self


class TreeCreate(BaseModel):
    tree: TagNode


class TreeUpdate(BaseModel):
    tree: TagNode


class TreeOut(BaseModel):
    id: int
    tree: TagNode


class TreesOut(BaseModel):
    items: list[TreeOut]

