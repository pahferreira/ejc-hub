## Project Overview

The shared common utilities for the API and APP that supports EJC Hub - A event management application for managing events, teams, subscriptions, and users.

## Tech Stack

- **Runtime:** TypeScript
- **Testing:** Jest

## Code Conventions

### File Naming

- Every function MUST have it own set of files:
  - `<functionName>.ts` the implementation of the function.
  - `<functionName>.spec.ts` the unit test convering the use cases of the function.

## Testing

- Tests must cover at least one positive and one negative use case.
