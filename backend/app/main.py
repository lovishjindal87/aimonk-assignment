from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud
from .db import Base, engine, get_db
from .schemas import TreeCreate, TreeOut, TreesOut, TreeUpdate


app = FastAPI(title="AIMonk Tags Tree API")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/trees", response_model=TreesOut)
def get_trees(db: Session = Depends(get_db)):
    items = []
    for tr, root in crud.list_trees(db):
        items.append(TreeOut(id=tr.id, tree=root))
    return TreesOut(items=items)


@app.post("/trees", response_model=TreeOut)
def post_tree(payload: TreeCreate, db: Session = Depends(get_db)):
    tr = crud.create_tree(db, root=payload.tree)
    loaded = crud.get_tree(db, tree_id=tr.id)
    assert loaded is not None
    tree, root = loaded
    return TreeOut(id=tree.id, tree=root)


@app.put("/trees/{tree_id}", response_model=TreeOut)
def put_tree(tree_id: int, payload: TreeUpdate, db: Session = Depends(get_db)):
    tr = crud.replace_tree(db, tree_id=tree_id, root=payload.tree)
    if not tr:
        raise HTTPException(status_code=404, detail="Tree not found")
    loaded = crud.get_tree(db, tree_id=tree_id)
    assert loaded is not None
    tree, root = loaded
    return TreeOut(id=tree.id, tree=root)


@app.delete("/trees/{tree_id}")
def delete_tree(tree_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_tree(db, tree_id=tree_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tree not found")
    return {"ok": True}

