## Project Overview

The NodeJS Fastify API that supports EJC Hub - A event management application for managing events, teams, subscriptions, and users.

For feature details read the ./docs/features.md file.

## Architecture

For architecture details read the ./docs/architecture.md file.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Fastify with `fastify-type-provider-zod`
- **ORM:** Drizzle ORM with PostgreSQL
- **Authentication:** Auth0 (`@auth0/auth0-fastify-api`)
- **Validation:** Zod
- **Package Manager:** npm

## Code Conventions

### File Naming

- Routes: `*.routes.ts`
- Repositories: `*.repository.ts`
- Schemas: `*.schema.ts`

### Fastify Patterns

- Use `withTypeProvider<ZodTypeProvider>()` for type-safe routes
- Register routes using `server.register()`
- Use `server.authenticate` preHandler for protected routes
- Use Zod for request/response validation

For Authentication and Authorization details read the ./docs/auth.md file.

### Database

- Use Drizzle ORM for database operations
- Repositories handle all database access
- Use cases orchestrate business logic

For database schema details read the ./docs/database-schema.md file.

## Testing

- API: Unit tests for use cases
