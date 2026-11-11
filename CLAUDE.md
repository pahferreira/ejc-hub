## Project Overview

EJC Hub - A event management application for managing events, teams, subscriptions, and users.

## Tech Stack

- API (`/api`) - Node.js with TypeScript
- App (`/app`) - React with TypeScript
- Common (`/common`)
  - **Shared:** TypeScript utilities and types
  - **Permissions:** Permission helpers shared between API and App
  - **Testing:** Vitest

## Coding standards

Reviews check code against `CODING_STANDARDS.md` at the repo root.

## Git Hooks

- Never use `--no-verify` (or `HUSKY=0`) to skip the git hooks. Fix the failing check instead.

## Agent skills

### Issue tracker

GitHub Issues on `pahferreira/ejc-hub`, each linked to the "EJC Hub" GitHub Project (#7). See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles as plain GitHub labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, kept in Notion under Projects › Ponto EJC: the "Glossary" page (instead of `CONTEXT.md`) and the "ADRs" database (instead of `docs/adr/`). See `docs/agents/domain.md`.

## QA plans

QA plans land in the Notion **QA Plans** database under Projects › Ponto EJC (https://app.notion.com/p/2c39f0704cad4ca0963c9f80ab00f794, data source `collection://fa61dc83-e775-4f16-94a1-46d53c06cff1`). Write them with the `qa-plan` skill.
