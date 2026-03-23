# Architectural Decisions — Blueprint Manager

---

## Architecture

The API follows a strict layered architecture — routes handle HTTP concerns, middleware handles
cross-cutting concerns (validation, logging, rate limiting), the service owns business logic,
and the repository owns data access. Nothing leaks between layers.

The CLI is interface-driven: every command depends on `BlueprintClient`, not the concrete `Client`
struct. This is SOLID-D — the commands are decoupled from the transport implementation and
straightforward to test in isolation.

---

## ORM: TypeORM over Prisma

Prisma requires a code generation step — schema change → `prisma generate` → commit generated client.
That is an extra moving part that can go stale silently, break in CI if the generation step is
skipped, and degrade type safety when the client is out of sync.

TypeORM is plain TypeScript with decorators — no generation, no extra build step, no lockfile to
manage. Migration files are written explicitly, which makes them easy to review in a PR and reason
about in production incidents.

**Tradeoff:** at larger scale with multiple teams, Prisma's schema-as-source-of-truth discipline and
parameterised `$queryRaw` safety are worth the overhead. For this project, TypeORM was the right
call.

---

## Error Handling

Custom error classes (`NotFoundError`, `ValidationError`) with a Map from constructor to HTTP status
code in the error middleware. No if/else chains, no switch statements. Adding a new error type
requires one line in the Map — existing code is untouched. Open/Closed principle.

---

## Observability

Every request gets a correlation ID — read from the `x-correlation-id` header or generated as a
UUID. It is stored on `res.locals`, threaded into every pino log line as `req.id`, returned in the
response header, and included in every error response body. Given a correlation ID you can find the
full request lifecycle in logs.

Pino outputs structured JSON in production (`NODE_ENV=production`) and pretty-printed logs in
development. `LOG_LEVEL` is configurable via environment variable without rebuilding the image.

---

## Validation

Zod schemas are defined once in `blueprint.schema.ts` and enforced in middleware — not in the
service layer. The service receives already-validated data and focuses purely on business logic.
`UpdateBlueprintSchema = CreateBlueprintSchema.partial()` — DRY, single source of truth for field
rules.

CLI flag constraints (page bounds, sort field allowlist, sort order) are validated in the CLI before
making a network call. API content rules (field presence, types) are owned by the API's Zod schemas.
Each layer validates what it owns.

---

## Pagination

Offset-based pagination (`page` + `page_size`) was chosen for simplicity and random page access.

**Tradeoff vs cursor-based:**

- Offset is simple and supports jumping to arbitrary pages, but degrades on very large tables (full
  scan to the offset position) and can return duplicate or skipped rows under concurrent inserts.
- Cursor-based is O(1) per page and stable under concurrent writes, but cannot jump to an arbitrary
  page and requires a stable sort key.

At the current scale, offset pagination is appropriate. A production system with large datasets
should migrate to cursor-based.

---

## Testing

Integration tests run against a real PostgreSQL database — no mocks. `beforeAll` initialises the
connection and runs migrations, `beforeEach` truncates the table so every test starts from a clean
state, `afterAll` destroys the connection. This catches issues that mocked tests miss, such as
migration correctness and query builder edge cases.

`LOG_LEVEL=silent` is set in the test environment so pino output does not pollute test results.

---

## Known Tradeoffs

| Area          | Current                         | Better at scale                                              |
| ------------- | ------------------------------- | ------------------------------------------------------------ |
| Pagination    | Offset-based                    | Cursor-based                                                 |
| Log shipping  | stdout                          | Aggregated (Datadog, CloudWatch) with correlation ID indexed |
| Payload size  | Unbounded `blueprint_data`      | Request size limit middleware                                |
| Test teardown | `--forceExit` masks open handle | Explicit `AppDataSource.destroy` in `afterAll`               |

---

## If This Were a Production System

These are ordered by impact — the first two would be done before any scaling work, the rest
depend on actual load patterns observed in production.

### 1. Duplicate Prevention (do this now, not at scale)

Two concurrent `POST /blueprints` with the same `name + version` both succeed today.
Application-level checks don't fix this — they have a race condition window. Only the DB
serialises writes correctly:

```sql
ALTER TABLE blueprints ADD CONSTRAINT uq_name_version UNIQUE (name, version);
```

Catch PostgreSQL error code `23505` in the error middleware and map it to `409 Conflict`.
This is one migration and a few lines of code — there is no reason to defer it.

For clients that retry on network failure, an `Idempotency-Key` header (UUID stored in Redis
with a 24h TTL, keyed to the request hash) prevents double-writes even when the client never
received the first response.

### 2. Optimistic Locking on Updates (do this now)

`PUT /blueprints/:id` currently has a lost update problem under concurrency — two clients read
the same version, both update, the second silently overwrites the first. Fix with an integer
`version` column:

- Client reads blueprint, receives `version: 3`
- Client sends `PUT` with `{ ..., version: 3 }`
- Query: `UPDATE ... WHERE id = ? AND version = 3` — if another write landed first, zero rows
  updated → return `409 Conflict`
- Client decides whether to retry with the fresh version

This is a schema migration and a small repository change. The alternative — distributed locks —
is significantly more complex with worse failure modes.

### 3. Caching (when read load is measurable)

Blueprints are read-heavy and write-infrequent — a good candidate for caching. But caching
should be added when profiling shows DB reads are the bottleneck, not preemptively.

**Cache-aside with Redis:**

```text
GET /blueprints/:id
  → check Redis
    → HIT:  return cached value
    → MISS: query DB → write to Redis (TTL 5min) → return
```

On `PUT` or `DELETE`, explicitly evict the key. List endpoints (`GET /blueprints`) are harder
to invalidate — short TTLs with accepted eventual consistency is simpler and safer than
attempting full invalidation logic.

**Critical failure mode:** if Redis goes down, the system must fall back to the DB, not fail.
Cache misses should never surface as errors to the client.

**Don't bother caching:** if the blueprint list is user-specific or frequently filtered —
cache hit rates will be too low to justify the complexity.

### 4. Async Queue (only if blueprint processing is expensive)

The current synchronous flow is correct if creating a blueprint is just a DB write. A queue
is only justified if `blueprint_data` requires post-creation work — infrastructure provisioning,
cross-service propagation, expensive validation.

The pattern when needed:

```text
POST /blueprints
  → write to DB with status: "pending"
  → publish event to queue
  → return 202 Accepted immediately

Worker
  → consume event
  → process blueprint_data
  → update status: "ready" | "failed" | "error"
```

Two things are required to make this safe: a **dead letter queue** (DLQ) for messages that fail
repeatedly — without it, a poison message loops forever — and **idempotent workers** so
redelivered messages don't cause duplicate processing.

Adding a queue without these two is worse than not having one.

### 5. Connection and Rate Limit State at Scale

The current in-process rate limiter and direct DB connections work for a single instance.
With multiple pods:

| Problem | Why It Breaks | Fix |
| ------- | ------------- | --- |
| Rate limiter is per-process | Each pod has its own counter, effective limit is `N × 100 req/15min` | Redis-backed store (`rate-limit-redis`) |
| DB connections per pod | 3 pods × 20 connections = 60 connections — Postgres starts refusing at ~100 | PgBouncer in front of Postgres |
| Read load on primary | All queries hit one node | Read replica for `GET` queries |

### Resulting Stack

```text
Client
  → Load Balancer
    → API instances (N)
      → Redis       (cache + rate limit state + idempotency keys)
      → PgBouncer   (connection pooling)
        → PostgreSQL primary  (writes)
        → PostgreSQL replica  (reads)
      → Queue (SQS / RabbitMQ)
        → Worker instances (with DLQ)
```
