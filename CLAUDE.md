## Project Overview

EJC Hub - A event management application for managing events, teams, subscriptions, and users.

## Tech Stack

- API (`/api`) - Node.js with TypeScript
- App (`/app`) - React with TypeScript
- Common (`/common`)
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
- Use `type` over `interface` for type definitions unless extending

### Permissions (Common)

- Use `hasPermission()` for single permission checks
- Use `hasAnyPermission()` for multiple permission checks
- Share permission types between API and App

## Testing

- Use descriptive test names

## Agent skills

### Issue tracker

GitHub Issues on `pahferreira/ejc-hub`, each linked to the "EJC Hub" GitHub Project (#7). See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles as plain GitHub labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, kept in Notion under Projects › Ponto EJC: the "Glossary" page (instead of `CONTEXT.md`) and the "ADRs" database (instead of `docs/adr/`). See `docs/agents/domain.md`.
