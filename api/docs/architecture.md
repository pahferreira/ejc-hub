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
├── modules/                       # Single-table data access (repository interfaces + Drizzle impls)
│   ├── event/
│   │   ├── domain/EventRepository.ts
│   │   └── repository/DrizzleEventRepository.ts
│   ├── subscription/
│   │   ├── domain/SubscriptionRepository.ts
│   │   ├── domain/subscription.types.ts   # SubscriptionStatus const + type
│   │   └── repository/DrizzleSubscriptionRepository.ts
│   ├── subscription-option/
│   │   ├── domain/SubscriptionOptionRepository.ts
│   │   └── repository/DrizzleSubscriptionOptionRepository.ts
│   ├── team-instance/
│   │   ├── domain/TeamInstanceRepository.ts
│   │   └── repository/DrizzleTeamInstanceRepository.ts
│   ├── team-membership/
│   │   ├── domain/TeamMembershipRepository.ts
│   │   └── repository/DrizzleTeamMembershipRepository.ts
│   ├── team-template/
│   │   ├── domain/TeamTemplateRepository.ts
│   │   └── repository/DrizzleTeamTemplateRepository.ts
│   └── user/
│       ├── domain/UserRepository.ts
│       └── repository/DrizzleUserRepository.ts
│
├── features/
│   ├── control-panel/             # Admin operations (events & team templates CRUD)
│   │   ├── core/ControlPanel.ts
│   │   ├── application/control-panel.ts
│   │   └── http/control-panel.routes.ts
│   ├── event/                     # Event subscriptions, team listing, current event
│   │   ├── core/Events.ts
│   │   ├── application/events-app.ts
│   │   ├── domain/subscription-types.ts           # HTTP payload types
│   │   ├── domain/subscription-with-details.types.ts  # JOIN-derived type (derived from module)
│   │   └── http/
│   ├── subscription/              # Subscription queries
│   │   ├── core/Subscription.ts
│   │   ├── application/subscription.ts
│   │   └── http/subscription.routes.ts
│   ├── team/                      # Team management and memberships
│   │   ├── core/Team.ts
│   │   ├── application/team.ts
│   │   └── http/team.routes.ts
│   └── user/                      # User sync and profile updates
│       ├── core/User.ts
│       ├── application/user.ts
│       └── http/user.routes.ts
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

### Modules vs Features

**Modules** (`src/modules/`) are the data-access layer. Each module corresponds to a single database table and contains:

- A repository interface (`domain/`) describing the available data operations.
- A Drizzle ORM implementation (`repository/`) that fulfills the interface.

Rules for modules:

- Modules represent single-table shapes. Methods that execute JOINs inline the result row shape directly in the method signature rather than extracting a named type.
- Modules **never** import from features.
- Modules own the types that belong to a single table (e.g. `SubscriptionStatus` lives in `modules/subscription/domain/subscription.types.ts`).

**Features** (`src/features/`) contain all business logic, HTTP routing, and feature-specific types. Each feature follows this layered structure:

```
feature/
├── domain/          # Feature-specific types (HTTP payloads, JOIN-derived types)
├── core/            # Business logic classes
├── application/     # Wiring layer — instantiates core classes with concrete repositories
└── http/            # Route definitions, request/response Zod schemas
```

Rules for features:

- Features depend on modules for data access; they **never** depend on another feature's data-access layer.
- JOIN-derived types that are consumed by a single feature live in that feature's `domain/` folder, derived via `Awaited<ReturnType<Repository['method']>>[number]`.
- HTTP payload types (request/response shapes) always stay in the feature's `domain/` folder.

### Layer Descriptions

**Modules/Domain** — Repository interfaces that describe available data operations for a single table, without specifying how they are implemented.

**Modules/Repository** — Drizzle ORM implementations of the module domain interfaces. All database queries and mutations happen here.

**Features/Core** — Business logic classes that depend only on module domain interfaces. This is where validation rules, orchestration, and domain-specific decisions live.

**Features/Application** — Instantiates core classes with concrete repository implementations, exporting a ready-to-use singleton.

**Features/HTTP** — Fastify route handlers that parse requests (using Zod schemas), call into the application layer, and return responses.

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

- **Clean Architecture** — Module interfaces → Feature core logic → HTTP transport. Each layer depends only on the layer above it.
- **Repository Pattern** — All database access is abstracted behind interfaces in `modules/`, making it easy to test core logic in isolation.
- **Dependency Injection** — Core classes receive repository interfaces via constructor; the application layer wires concrete implementations.
- **Type-safe Validation** — Zod schemas validate all incoming requests through Fastify's `ZodTypeProvider`, ensuring runtime and compile-time safety.
- **Soft Deletes** — Events use a `deleted_at` timestamp instead of hard deletes.
