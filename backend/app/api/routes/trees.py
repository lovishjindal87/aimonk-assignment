"""CRUD HTTP API for stored tag trees."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories import tree_repository
from app.schemas.tree import TreeCreate, TreeOut, TreesOut, TreeUpdate

router = APIRouter(tags=["trees"])


@router.get("", response_model=TreesOut)
def get_trees(db: Session = Depends(get_db)):
    items = []
    for tr, root in tree_repository.list_trees(db):
        items.append(TreeOut(id=tr.id, tree=root))
    return TreesOut(items=items)


@router.post("", response_model=TreeOut)
def post_tree(payload: TreeCreate, db: Session = Depends(get_db)):
    tr = tree_repository.create_tree(db, root=payload.tree)
    loaded = tree_repository.get_tree(db, tree_id=tr.id)
    assert loaded is not None
    tree, root = loaded
    return TreeOut(id=tree.id, tree=root)


@router.put("/{tree_id}", response_model=TreeOut)
def put_tree(tree_id: int, payload: TreeUpdate, db: Session = Depends(get_db)):
    tr = tree_repository.replace_tree(db, tree_id=tree_id, root=payload.tree)
    if not tr:
        raise HTTPException(status_code=404, detail="Tree not found")
    loaded = tree_repository.get_tree(db, tree_id=tree_id)
    assert loaded is not None
    tree, root = loaded
    return TreeOut(id=tree.id, tree=root)


@router.delete("/{tree_id}")
def delete_tree(tree_id: int, db: Session = Depends(get_db)):
    ok = tree_repository.delete_tree(db, tree_id=tree_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tree not found")
    return {"ok": True}
