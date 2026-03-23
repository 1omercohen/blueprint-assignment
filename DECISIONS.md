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

| Area | Current | Better at scale |
|------|---------|----------------|
| Pagination | Offset-based | Cursor-based |
| Log shipping | stdout | Aggregated (Datadog, CloudWatch) with correlation ID indexed |
| Payload size | Unbounded `blueprint_data` | Request size limit middleware |
| Test teardown | `--forceExit` masks open handle | Explicit `AppDataSource.destroy` in `afterAll` |

---

## If This Were a Production System

### Duplicate Prevention

Two concurrent `POST /blueprints` with the same `name + version` currently both succeed. The fix
is a unique constraint at the DB level — application-level checks have race conditions under
concurrency, only the DB serialises correctly:

```sql
ALTER TABLE blueprints ADD CONSTRAINT uq_name_version UNIQUE (name, version);
```

Catch the `23505` PostgreSQL unique violation and map it to `409 Conflict`. For clients that retry,
an `Idempotency-Key` header stored in Redis prevents double-processing.

### Caching

Every `GET /blueprints/:id` hits the DB today. At scale, add Redis with a cache-aside pattern:

```text
GET /blueprints/:id
  → check Redis
    → HIT:  return cached value
    → MISS: query DB → write to Redis (TTL 60s) → return
```

On `PUT` or `DELETE`, explicitly evict the key. For list endpoints, use short TTLs and accept
eventual consistency rather than attempting full cache invalidation.

HTTP `ETag` + `Cache-Control` headers would give CDN and client-side caching for free on top of this.

### Async Processing via Queue

If `blueprint_data` needs post-creation processing (schema validation, infrastructure provisioning,
propagation to other services), synchronous handling blocks the HTTP request and loses work on
failure. The pattern:

```text
POST /blueprints
  → write to DB (status: "pending")
  → publish event to queue (SQS / RabbitMQ / Kafka)
  → return 202 Accepted

Worker
  → consume event
  → process blueprint_data
  → update status: "ready" | "failed"
```

The `status` field is then exposed on `GET /blueprints/:id` so callers can poll or subscribe.

### Multi-Instance Concerns

| Problem | Solution |
| ------- | -------- |
| Rate limiting state shared across pods | Move to Redis store (`rate-limit-redis`) |
| DB connection pool exhaustion | Cap `max` connections per instance, add PgBouncer |
| Concurrent update conflicts | Optimistic locking — `version` column, `WHERE id = ? AND version = ?` |
| Read scaling | PostgreSQL read replica for `GET` queries |

### Resulting Stack

```text
Client
  → Load Balancer
    → API instances (N)
      → Redis       (cache + rate limit state + idempotency keys)
      → PostgreSQL  (primary writes + read replica)
      → Queue       (SQS / RabbitMQ)
        → Worker instances
```
