# API Architecture

## Overview

Node.js API built with **Fastify**, **Drizzle ORM** (PostgreSQL), and **Auth0** for authentication. The codebase follows a **Clean Architecture** pattern with clear separation between domain logic, data access, and HTTP handling.

## Folder Structure

```
api/src/
├── core/
│   ├── database/
│   │   ├── client.ts              # Drizzle ORM connection setup
│   │   ├── migrations/            # SQL migration files
│   │   └── schemas/               # Drizzle table definitions
│   │       ├── events.ts
│   │       ├── subscriptions.ts
│   │       ├── subscription-options.ts
│   │       ├── team-instances.ts
│   │       ├── team-memberships.ts
│   │       ├── team-templates.ts
│   │       ├── users.ts
│   │       └── index.ts
│   └── envs/
│       └── env.ts                 # Environment variables (PORT, DATABASE_URL, AUTH_*)
│
├── features/
│   ├── control-panel/             # Admin operations (events & team templates CRUD)
│   ├── event/                     # Event subscriptions, team listing, current event
│   ├── subscription/              # Subscription queries
│   ├── team/                      # Team management and memberships
│   └── user/                      # User sync and profile updates
│
├── shared/
│   ├── AppError.ts                # Custom business logic error class
│   ├── extract-user-info-from-token.ts  # JWT token decoder
│   ├── fastify-auth-guard.ts      # Authentication middleware
│   ├── fastify-error-handler.ts   # Global error handler
│   ├── fastify-require-permission.ts    # Authorization middleware
│   ├── fastify.types.ts           # Typed Fastify instance
│   └── http-statuses.ts           # HTTP status code constants
│
└── server.ts                      # Entry point: Fastify init, plugin registration, route binding
```

## Architecture Layers

Each feature module follows a consistent layered structure:

```
feature/
├── domain/          # Repository interfaces (contracts)
├── core/            # Business logic classes
├── repository/      # Drizzle ORM implementations of domain interfaces
├── application/     # Wiring layer — instantiates core classes with concrete repositories
└── http/            # Route definitions, request/response Zod schemas
```

**Domain** — Defines repository interfaces that describe what data operations are available, without specifying how they are implemented.

**Core** — Contains business logic classes that depend only on domain interfaces. This is where validation rules, orchestration, and domain-specific decisions live.

**Repository** — Drizzle ORM implementations of the domain interfaces. All database queries and mutations happen here.

**Application** — Instantiates the core class with concrete repository implementations, exporting a ready-to-use singleton.

**HTTP** — Fastify route handlers that parse requests (using Zod schemas), call into the application layer, and return responses.

## Core Infrastructure

### Database

- **ORM:** Drizzle ORM with `node-postgres` driver
- **Connection:** Configured via `DATABASE_URL` environment variable
- **Casing:** Snake-case column mapping (`casing: 'snake_case'`)
- **Migrations:** Sequential SQL files in `core/database/migrations/`

### Environment

Validated variables:

- `PORT` — Server port (default: `3333`)
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_DOMAIN` — Auth0 tenant domain
- `AUTH_AUDIENCE` — Auth0 API audience identifier

## Shared Utilities

| Utility                        | Purpose                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `AppError`                     | Custom error class for business logic exceptions                                                    |
| `fastify-auth-guard`           | Pre-handler that enforces authentication via `server.requireAuth()` with optional permission checks |
| `fastify-require-permission`   | Pre-handler that verifies JWT permissions (supports `all` or `any` mode)                            |
| `fastify-error-handler`        | Maps `AppError` to 422 responses; unhandled errors to 500                                           |
| `extract-user-info-from-token` | Decodes Auth0 JWT to extract `authId`, `email`, `name`, `picture`, and `permissions`                |
| `http-statuses`                | Constants for HTTP status codes (200, 201, 401, 403, 404, 422, 500)                                 |
| `fastify.types`                | Typed `FastifyServerInstance` with `ZodTypeProvider`                                                |

## Design Patterns

- **Clean Architecture** — Domain interfaces → Core business logic → Repository persistence → HTTP transport. Each layer depends only on the layer above it.
- **Repository Pattern** — All database access is abstracted behind interfaces, making it easy to test core logic in isolation.
- **Dependency Injection** — Core classes receive repository interfaces via constructor; the application layer wires concrete implementations.
- **Type-safe Validation** — Zod schemas validate all incoming requests through Fastify's `ZodTypeProvider`, ensuring runtime and compile-time safety.
- **Soft Deletes** — Events use a `deleted_at` timestamp instead of hard deletes.
