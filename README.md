# Blueprint Manager

A Blueprint Manager system built with a Node.js + TypeScript REST API and a Go CLI tool.

## Architecture

```
.
├── api/          # Node.js + TypeScript REST API (Express, TypeORM, PostgreSQL)
├── cli/          # Go CLI tool (Cobra)
├── examples/     # Example blueprint payloads
└── docker-compose.yml
```

### API layers

```
Request → correlationId → httpLogger → rateLimit → validate (Zod) → Route
                                                                       ↓
                                                                    Service
                                                                       ↓
                                                                  Repository (TypeORM)
                                                                       ↓
                                                                   PostgreSQL
```

## Prerequisites

- Docker + Docker Compose
- Node.js 20+
- Go 1.21+

## Quick Start

```bash
# 1. Install API dependencies and build Docker images
make setup

# 2. Start Postgres + API
make run

# 3. API is live at http://localhost:3000
# 4. Swagger docs at http://localhost:3000/api-docs
```

## Running Tests

```bash
# Creates blueprints_test DB and runs the full Jest suite
make test
```

## CLI

```bash
# Build the CLI binary
make cli-build

# Usage
./cli/bin/blueprint --help

# Commands
./cli/bin/blueprint create --file examples/bricks.json
./cli/bin/blueprint get --id 1
./cli/bin/blueprint list --page 1 --page-size 10 --sort-by name --sort-order ASC
./cli/bin/blueprint update --id 1 --file examples/bricks.json
./cli/bin/blueprint delete --id 1

# Global flags (apply to all commands)
./cli/bin/blueprint --api-url http://localhost:3000 --timeout 15s list
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (DB connectivity) |
| `POST` | `/blueprints` | Create a blueprint |
| `GET` | `/blueprints` | List blueprints (paginated + sortable) |
| `GET` | `/blueprints/:id` | Get a blueprint by ID |
| `PUT` | `/blueprints/:id` | Update a blueprint |
| `DELETE` | `/blueprints/:id` | Delete a blueprint |

Full interactive docs: `http://localhost:3000/api-docs`

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make setup` | Install npm deps + build Docker images |
| `make run` | Start all services (Postgres + API) |
| `make stop` | Stop all services |
| `make logs` | Tail API logs |
| `make test` | Create test DB + run Jest suite |
| `make cli-build` | Compile CLI binary to `cli/bin/blueprint` |

## Environment Variables (API)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_USER` | `bluebricks` | Postgres user |
| `DB_PASSWORD` | `bluebricks` | Postgres password |
| `DB_NAME` | `blueprints` | Postgres database name |
| `NODE_ENV` | — | Set to `production` for JSON logs |
| `LOG_LEVEL` | `info` | Pino log level |

## Design Decisions

### TypeORM vs Prisma

**Why TypeORM over Prisma:**

| Concern | TypeORM | Prisma |
|---------|---------|--------|
| Setup complexity | Decorators on entity class, one DataSource config | Requires `schema.prisma`, separate `@prisma/client` generation step |
| Migration management | Write migrations by hand (full control) | Auto-generated, but requires running `prisma migrate dev` and committing the migration lockfile |
| Runtime | Standard JS/TS imports | Generated client — adds a build step; breaks if you forget to regenerate |
| TypeScript integration | Native decorators, compile-time checks | Relies on generated types; type safety degrades if client is stale |
| Raw queries | `AppDataSource.query(sql)` — straightforward | `prisma.$queryRaw` with tagged template — safer (parameterised by default) but more ceremony |

**The tradeoff:**

Prisma's generated client and auto-migration tooling shine in larger teams where schema drift is a real risk. The `prisma migrate dev` → `prisma generate` cycle enforces a clear schema-as-source-of-truth discipline.

For this project, TypeORM was the right call: fewer moving parts, no code-generation step, and explicit migration files that are easy to review in a PR. The manual migration overhead is low at this scale.

In a production team environment, Prisma would be worth the extra setup — especially for the parameterised query safety of `$queryRaw` and the type-safe query builder.

### Pagination

Offset-based pagination (`page` + `page_size`) was chosen for simplicity and compatibility with the current SQL schema. The tradeoff vs cursor-based pagination:

- **Offset**: simple, supports random page access, degrades on very large tables (full scan to offset)
- **Cursor**: O(1) per page, stable under concurrent inserts, but cannot jump to arbitrary pages

At the current scale, offset pagination is appropriate.
