# Blueprint Manager Service — Design Document

## System Overview

```text
┌─────────────────────────────────────────────┐
│              Go CLI Tool                    │
│  create / get / list / update / delete      │
└──────────────────┬──────────────────────────┘
                   │ HTTP
                   ▼
┌─────────────────────────────────────────────┐
│        Node.js + TypeScript API             │
│                                             │
│  routes/ → services/ → repositories/       │
│                                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              PostgreSQL                     │
│           blueprints table                  │
└─────────────────────────────────────────────┘
```

---

## Folder Structure

### Node.js API

```text
api/
├── src/
│   ├── models/
│   │   └── blueprint.model.ts       ← TypeScript interfaces
│   ├── repositories/
│   │   └── blueprint.repository.ts  ← DB queries (raw pg)
│   ├── services/
│   │   └── blueprint.service.ts     ← business logic + validation
│   ├── routes/
│   │   └── blueprint.routes.ts      ← Express route handlers
│   ├── middleware/
│   │   └── errorHandler.ts          ← centralized error handling
│   ├── db/
│   │   └── client.ts                ← pg pool setup
│   └── app.ts                       ← Express app setup
├── tests/
│   ├── blueprint.create.test.ts
│   ├── blueprint.retrieve.test.ts
│   ├── blueprint.update.test.ts
│   ├── blueprint.delete.test.ts
│   ├── blueprint.pagination.test.ts
│   └── blueprint.sorting.test.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Go CLI

```text
cli/
├── cmd/
│   ├── main.go
│   ├── create.go
│   ├── get.go
│   ├── list.go
│   ├── update.go
│   └── delete.go
├── internal/
│   ├── client/
│   │   └── http.go       ← HTTP client wrapper
│   └── display/
│       └── printer.go    ← output formatting
└── go.mod
```

### Root

```text
bluebricks/
├── api/
├── cli/
├── bricks.json
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Key Design Decisions

### 1. Repository Pattern (SOLID — S, D)

The API is split into 3 layers:

- **Route** — handles HTTP in/out only
- **Service** — business logic, validation
- **Repository** — all SQL, zero business logic

Each layer depends on an **interface**, not a concrete type.
This means we can swap the DB without touching service or route code.

### 2. TypeORM as the ORM

Using TypeORM instead of raw `pg` or Prisma.

- **Why:** Built-in Repository Pattern matches our architecture natively, decorator-based models are clean and readable in TypeScript, no extra build/generate step, and it's well known in production Node.js stacks
- **Tradeoff:** Slightly weaker type safety than Prisma on complex queries, but for this schema it makes no practical difference

### 3. Map vs if/else — Use the Right Tool

Use a **map** when branching on a known set of values (lookups, labels, dispatch) — it's cleaner, extensible, and avoids long chains.

Use **if/else** when expressing conditions with real logic — range checks, null guards, multi-condition expressions — where a map would be forced and unreadable.

**Map (right fit):** sorting field allowlist — finite known keys, O(1) lookup, easy to extend:

```typescript
const SORTABLE_FIELDS: Record<string, string> = {
  name: "name",
  version: "version",
  created_at: "created_at",
};
```

**if/else (right fit):** pagination input validation — logic, not lookup:

```typescript
if (page < 1) throw new Error("page must be >= 1");
if (pageSize < 1 || pageSize > 100) throw new Error("page_size must be between 1 and 100");
```

### 4. Pagination Metadata in Response Envelope

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 100,
    "total_pages": 5
  }
}
```

### 5. Cobra for the Go CLI

Cobra gives each command its own file, clean flag parsing, and `--help` for free.
Each command is a single responsibility unit.

### 6. Docker Compose for Local Setup

One command starts PostgreSQL + API.
DB migrations run automatically on API startup via an init SQL script.

---

## Design Patterns Applied

| Pattern | Where | Why |
| --- | --- | --- |
| Repository Pattern | `blueprint.repository.ts` | Decouple DB from business logic |
| Service Layer | `blueprint.service.ts` | Centralize validation and orchestration |
| Dependency Injection | Routes → Services → Repositories | Testability, SOLID-D |
| Command Pattern | Go CLI commands | Each command is isolated, single responsibility |
| Allowlist Map | Sorting field validation | CODING_RULES — no if/else chains |

---

## SOLID Principles Mapping

| Principle | Applied Where |
| --- | --- |
| **S** — Single Responsibility | Route / Service / Repository each do one thing |
| **O** — Open/Closed | New sort fields added to map, no code changes needed |
| **D** — Dependency Inversion | Layers depend on interfaces, not implementations |

---

## Database Schema

```sql
CREATE TABLE blueprints (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  version     VARCHAR(50)  NOT NULL,
  author      VARCHAR(255) NOT NULL,
  blueprint_data JSONB     NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

> `created_at` is added beyond the minimum schema to support sorting by creation date (required feature).

---

## bricks.json — Blueprint Data Shape

The `blueprint_data` JSONB field stores a structure like:

```json
{
  "packages": [
    { "name": "aws-neptune", "version": "1.0.0" }
  ],
  "props": {
    "engineVersion": "1.2.0.2",
    "instanceType": "db.r5.large",
    "region": "us-east-1",
    "multiAZ": false
  },
  "outs": {
    "endpoint": "",
    "port": "",
    "arn": ""
  }
}
```
