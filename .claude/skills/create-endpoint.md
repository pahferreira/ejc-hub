You are creating a new API endpoint for the EJC Hub project.

Endpoint request: $ARGUMENTS

## Context

The user has likely already written the **core business logic** (the class method in `api/src/features/<feature>/core/`). Your job is to build the remaining layers around it: schema, route, repository (if needed), wiring, and server registration.

Start by reading the core class to understand what method exists, what parameters it expects, and what it returns. Then scaffold the remaining layers to expose it as an HTTP endpoint.

## Project Conventions

Follow these patterns exactly:

### Directory Structure (per feature)

- `api/src/features/<feature>/http/<feature>.routes.ts` — route definitions
- `api/src/features/<feature>/http/<feature>.schema.ts` — Zod v4 schemas
- `api/src/features/<feature>/core/<Feature>.ts` — business logic class
- `api/src/features/<feature>/domain/<Feature>Repository.ts` — repository interface
- `api/src/features/<feature>/domain/<feature>.types.ts` — domain types
- `api/src/features/<feature>/repository/Drizzle<Feature>Repository.ts` — Drizzle ORM implementation
- `api/src/features/<feature>/application/<feature>-app.ts` — DI wiring

### Route Pattern

- Routes are Fastify plugins: `export function featureRoutes(server: FastifyServerInstance) { return () => { ... } }`
- Schema validation via `schema: { params, body, querystring }` using Zod
- Auth via `preHandler: authGuard(server, { permissions: [...] })`
- Handler: extract params -> call app method -> `reply.code(HttpStatus.X).send({ key: result })`
- Wrap in try/catch with `fastifyErrorHandler(reply, error)`
- Import `FastifyServerInstance` from `api/src/shared/fastify.types.ts`
- Import `authGuard` from `api/src/shared/fastify-auth-guard.ts`
- Import `fastifyErrorHandler` from `api/src/shared/fastify-error-handler.ts`
- Import `HttpStatus` from `api/src/shared/http-statuses.ts`
- Import `extractUserInformationFromToken` from `api/src/shared/extract-user-info-from-token.ts`

### Schema Pattern

- Import from `zod/v4`
- Use `z.uuid()` for IDs, `z.coerce.number()` for query numbers
- Compose schemas with `...schema.shape`
- Use `z.enum([...])` for fixed values
- Custom messages: `z.string('required message')`

### Core Pattern

- Class with `#private` fields for injected repositories
- Constructor injection of all dependencies
- Throw `AppError` with `AppErrorCode` for business rule violations
- Import `AppError` and `AppErrorCode` from `api/src/shared/AppError.ts`

### Repository Pattern

- Interface in `domain/`, implementation in `repository/`
- Drizzle ORM: `db.select()`, `db.insert()`, `db.update()`, `db.delete()`
- Always `.returning()` for mutations
- Conditions with `eq()`, `and()`, `or()`, `inArray()`, `isNull()`, `not()`
- Export singleton instance from the implementation file
- DB schema imported from `api/src/core/database/schemas/index.ts`

### Application Wiring

- Import repositories and core class
- Instantiate core class with all repository dependencies
- Export singleton: `export const featureApp = new Feature(...)`

### Server Registration

- In `api/src/server.ts`: `server.register(featureRoutes(server))`

## Steps

1. **Read the core class** in the target feature to understand the method signature, parameters, return type, and any repository dependencies it uses
2. **Read existing route and schema files** in that feature to understand what already exists
3. **If anything is ambiguous** (HTTP method, URL path, permissions, request shape), ask the user before proceeding
4. **Implement the layers** in this order:
   - Repository interface + implementation (only if the core method calls a repository method that doesn't exist yet)
   - Zod schema for the endpoint's params, body, and/or querystring
   - Route handler that calls the core method
   - Update application wiring if new repository dependencies were added
   - Register in `server.ts` if this is a brand new feature
5. **For existing features**, add to existing files rather than creating new ones
6. **For new features**, scaffold the full directory structure
