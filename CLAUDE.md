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
