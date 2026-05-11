# Foundations (start from rock bottom) — how this project works

This document is designed for you if you feel like:
- “I haven’t seen this code before”
- “I’m weak at frontend”
- “Backend words like FastAPI/SQLAlchemy/ORM confuse me”

Goal: after reading this, you should be able to explain the project in an interview in simple terms **without memorizing code**.

---

## 0) What did we build? (one sentence)

We built a web app that lets you **edit a nested tree of tags**, then **export/save that tree** to a backend database, and **reload all saved trees** when the page opens.

---

## 1) The only data structure you need to understand

A “tree” is just nested objects.

Each node has:
- `name` (string)
- and **either**
  - `data` (string) → means it’s a **leaf**
  - `children` (array of nodes) → means it’s a **parent**

Example:

```json
{
  "name": "root",
  "children": [
    { "name": "child2", "data": "c2 World" },
    {
      "name": "child1",
      "children": [
        { "name": "child1-child1", "data": "Hello" }
      ]
    }
  ]
}
```

So the whole project is basically:
- show this structure on screen
- let the user edit it
- save/load it.

---

## 2) What is “frontend” vs “backend”?

- **Frontend**: the web page you see in the browser (buttons, inputs, UI).
  - In this project: Vue 3 + TypeScript + CSS.
  - Runs at `http://localhost:5173`.

- **Backend**: the server that stores data and returns it on request.
  - In this project: FastAPI (Python) + SQLite (database) + SQLAlchemy (database library).
  - Runs at `http://localhost:8000`.

They talk via HTTP requests (like `GET`, `POST`, `PUT`, `DELETE`).

---

## 3) What is Vue (in the simplest possible terms)?

Vue is a component-based UI library:

- You describe the UI in **templates** (HTML-like) bound to **reactive state**.
- When state changes, Vue updates the DOM for you.

> UI is driven by reactive data (refs / reactive objects).

In this project, the important state is:
- the tree object (nested tag structure)
- which nodes are collapsed
- saved status (`Saved #12` vs `Not saved`).

---

## 4) How do we show a tree on the screen?

This is the key concept: **recursion**.

### What is recursion?

Recursion means: a thing contains a smaller version of itself.

A tree node can contain children nodes, which themselves are nodes.
So we render a node, and if it has children, we render each child using the **same component** again.

In Vue, we do that with a component that references itself in its template:
- `TagView.vue` renders one tag node.
- If the node has children → it renders `TagView` again for each child.

You can explain it like:
> “I used a recursive component to render arbitrary depth nesting.”

---

## 5) What happens when you type in a “Data” input?

When you type, we must update the tree in memory.

Important rule in Vue (same idea as React):
- we don’t mutate the existing tree object in-place
- we assign a **new** tree object with the one value changed (immutable update)

So when you type:
1. Input fires `input`
2. We produce an updated tree (`setNodeData(...)`)
3. Vue re-renders and you see the new value.

---

## 6) What does “Collapse” mean?

Collapse is a pure UI concern:
- we keep a set of “collapsed node ids”
- if a node’s id is in the set → we hide its body (children/data)
- otherwise → show it.

This does **not** change the exported tree; it only changes how you view it.

---

## 7) What does “Add Child” do?

The assignment has a special rule:

If a node currently has `data`, then clicking “Add Child” should:
- remove/replace that `data`
- turn the node into a parent by creating `children: [ { name: "New Child", data: "Data" } ]`

If it’s already a parent (already has children), then “Add Child” should:
- append another child to its children list

So you can say:
> “Add Child either converts a leaf into a parent, or appends a new child to an existing parent.”

---

## 8) What does “Export” mean here?

Export does 2 things:

### 8.1) Export to text (JSON)

We take the internal tree and output a JSON string.

But we only export the properties required by the assignment:
- `name`
- `children`
- `data`

We deliberately do NOT export internal UI-only fields (like `id`).

### 8.2) Save to backend

On Export, we also save the tree:
- if it’s a new tree (no database id yet) → `POST /trees`
- if it’s already saved (has id) → `PUT /trees/{id}`

So you can say:
> “Export is the save button; it also prints the JSON.”

---

## 9) How does the backend store the tree in SQL?

SQL databases store rows in tables.

We used 2 tables:

### 9.1) `trees` table
One row per saved tree.
- id = 1, 2, 3, ...

### 9.2) `tags` table
One row per node in the tree.
Each row stores:
- which tree it belongs to (`tree_id`)
- who its parent is (`parent_id`) — or null if it’s root
- the order among siblings (`position`)
- `name`
- `data` (null when the node has children)

This is a very standard relational way to store hierarchical data (called an adjacency list).

---

## 10) Backend endpoints (plain English)

These are the routes you can describe:

- **GET `/trees`**
  - “Give me all saved trees”
  - Returns a list: `[ {id, tree}, {id, tree}, ... ]`

- **POST `/trees`**
  - “Save this as a new tree”
  - Returns `{id, tree}`

- **PUT `/trees/{id}`**
  - “Replace the saved tree with id = X with this new version”
  - Returns `{id, tree}`

- **DELETE `/trees/{id}`**
  - “Delete the tree with id = X”
  - Returns `{ok: true}`

---

## 11) What happens when the page loads? (the requirement you were worried about)

When you open the UI:
1. Frontend immediately calls backend **GET `/trees`**
2. If backend returns multiple trees:
   - frontend shows each tree in its own editor
   - editors are stacked one below the other
3. If backend returns none:
   - frontend shows a default “New” editor

This is exactly what the assignment asked for.

---

## 12) Why do we have “ids” in the frontend tree?

The backend tree nodes don’t have ids in the assignment JSON.

But the UI needs ids for:
- Vue list keys (`key` on `v-for`) so rendering is stable
- collapsed state (we collapse by node id)

So the frontend adds ids when it loads or creates trees.
These ids are **not exported**.

---

## 13) How to explain the stack in 20 seconds

You can say:

> “Frontend is Vue 3 (with TypeScript) rendering a recursive tree component. I keep the tree structure in reactive state and update it immutably as inputs change. Export converts the internal tree into a minimal JSON shape and calls a FastAPI backend. The backend stores the hierarchy in SQLite using a tags table with parent_id relationships, and exposes GET/POST/PUT/DELETE endpoints for multiple trees.”

---

## 14) Where to go next (if you want deeper detail)

Once you’re comfortable with this document, you can use these as references:
- `STRUCTURE.md`: folder tree for **frontend** and **backend** (start here after this doc)
- `FRONTEND.md`: line-by-line explanation of the Vue frontend
- `BACKEND.md`: FastAPI layers (`api/`, `schemas/`, `repositories/`, `models/`, `db/`)
- `INTEGRATION.md`: request/response shapes and how save/load works

