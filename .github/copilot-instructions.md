# Copilot Instructions

## Project Overview

EJC Hub - A event management application for managing events, teams, subscriptions, and users.

## Tech Stack

### API (`/api`)

- **Runtime:** Node.js with TypeScript
- **Framework:** Fastify with `fastify-type-provider-zod`
- **ORM:** Drizzle ORM with PostgreSQL
- **Authentication:** Auth0 (`@auth0/auth0-fastify-api`)
- **Validation:** Zod
- **Package Manager:** pnpm

### App (`/app`)

- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** CSS
- **Storybook:** For component documentation
- **Testing:** Vitest
- **Linting:** ESLint with Prettier
- **Authentication:** Auth0

### Common (`/common`)

- **Shared:** TypeScript utilities and types
- **Permissions:** Permission helpers shared between API and App
- **Testing:** Jest

## Project Structure

```
├── api/                    # Backend API
│   └── src/
│       ├── core/           # Shared core utilities (env, db, errors)
│       ├── features/       # Feature modules
│       │   ├── event/
│       │   ├── user/
│       │   ├── team/
│       │   ├── subscription/
│       │   └── control-panel/
│       └── server.ts       # Main server entry point
│
├── app/                    # Frontend React application
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       └── assets/         # Static assets
│
└── common/                 # Shared code between API and App
    └── permissions/        # Permission types and helpers
```

## Code Conventions

### General

- Use `const` over `let` when possible
- Use arrow functions for callbacks
- Use async/await over Promises
- Keep functions small and focused

### API File Naming

- Routes: `*.routes.ts`
- Use cases: `*.usecase.ts`
- Repositories: `*.repository.ts`
- Schemas: `*.schema.ts`

### App File Naming

- Components: `ComponentName/ComponentName.tsx`
- Stories: `ComponentName/ComponentName.stories.tsx`
- Hooks: `useHookName.ts` or `useHookName/useHookName.ts`
- Pages: `PageName.tsx`

### Fastify Patterns (API)

- Use `withTypeProvider<ZodTypeProvider>()` for type-safe routes
- Register routes using `server.register()`
- Use `server.authenticate` preHandler for protected routes
- Use Zod for request/response validation

### React Patterns (App)

- Use functional components with hooks
- Create Storybook stories for all reusable components
- Use custom hooks for reusable logic
- Keep components small and focused

### Database (API)

- Use Drizzle ORM for database operations
- Repositories handle all database access
- Use cases orchestrate business logic

### Permissions (Common)

- Use `hasPermission()` for single permission checks
- Use `hasAnyPermission()` for multiple permission checks
- Share permission types between API and App

## Testing

- API: Unit tests for use cases
- App: Vitest for component and hook tests
- Common: Jest for utility tests
- Use descriptive test names
- Write stories for visual component testing
