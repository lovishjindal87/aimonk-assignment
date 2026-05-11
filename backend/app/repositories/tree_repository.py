"""Persistence for tag trees: insert, replace, list, delete (SQLAlchemy)."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.hierarchy import Tag, Tree
from app.schemas.tree import TagNode


def _insert_tag_subtree(
    db: Session,
    *,
    tree_id: int,
    parent_id: int | None,
    node: TagNode,
    position: int,
) -> None:
    tag = Tag(
        tree_id=tree_id,
        parent_id=parent_id,
        position=position,
        name=node.name,
        data=node.data,
    )
    db.add(tag)
    db.flush()

    if node.children:
        for idx, child in enumerate(node.children):
            _insert_tag_subtree(db, tree_id=tree_id, parent_id=tag.id, node=child, position=idx)


def create_tree(db: Session, *, root: TagNode) -> Tree:
    tree = Tree()
    db.add(tree)
    db.flush()

    _insert_tag_subtree(db, tree_id=tree.id, parent_id=None, node=root, position=0)
    db.commit()
    db.refresh(tree)
    return tree


def replace_tree(db: Session, *, tree_id: int, root: TagNode) -> Tree | None:
    tree = db.get(Tree, tree_id)
    if not tree:
        return None

    db.execute(delete(Tag).where(Tag.tree_id == tree_id))
    _insert_tag_subtree(db, tree_id=tree_id, parent_id=None, node=root, position=0)
    db.commit()
    db.refresh(tree)
    return tree


def _build_tree_from_tags(tags: list[Tag]) -> TagNode:
    by_parent: dict[int | None, list[Tag]] = {}
    for t in tags:
        by_parent.setdefault(t.parent_id, []).append(t)
    for parent_id in by_parent:
        by_parent[parent_id].sort(key=lambda t: t.position)

    roots = by_parent.get(None, [])
    if not roots:
        raise ValueError("Tree has no root tag")
    root_tag = roots[0]

    def build(tag: Tag) -> TagNode:
        kids = by_parent.get(tag.id, [])
        if kids:
            return TagNode(name=tag.name, children=[build(k) for k in kids])
        return TagNode(name=tag.name, data=tag.data or "")

    return build(root_tag)


def list_trees(db: Session) -> list[tuple[Tree, TagNode]]:
    trees = db.scalars(select(Tree).order_by(Tree.id.asc())).all()
    if not trees:
        return []

    out: list[tuple[Tree, TagNode]] = []
    for tr in trees:
        tags = db.scalars(select(Tag).where(Tag.tree_id == tr.id)).all()
        out.append((tr, _build_tree_from_tags(tags)))
    return out


def get_tree(db: Session, *, tree_id: int) -> tuple[Tree, TagNode] | None:
    tree = db.get(Tree, tree_id)
    if not tree:
        return None
    tags = db.scalars(select(Tag).where(Tag.tree_id == tree_id)).all()
    return (tree, _build_tree_from_tags(tags))


def delete_tree(db: Session, *, tree_id: int) -> bool:
    tree = db.get(Tree, tree_id)
    if not tree:
        return False
    db.delete(tree)
    db.commit()
    return True
