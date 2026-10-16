# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

Layout: **single-context**, kept entirely in **Notion** under Projects › Ponto EJC. There is no `CONTEXT.md` or `docs/adr/` in the repo. Use the Notion MCP tools (`notion-fetch`, `notion-search`, `notion-update-page`, `notion-create-pages`).

| Doc      | Notion location                                                                                                                         | Replaces      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Glossary | `📚 Glossary` page: `https://app.notion.com/p/3fbd3d816ffc8056b157f371e72f8059`                                                          | `CONTEXT.md`  |
| ADRs     | `🏗️ ADRs` database: `https://app.notion.com/p/334d3d816ffc80e695a8c945633d6af0` (data source `collection://334d3d81-6ffc-8030-80b3-000b923eee3c`) | `docs/adr/`   |

## Before exploring, read these

- **Glossary**: `notion-fetch` the Glossary page.
- **ADRs**: `notion-fetch` the ADRs data source to list them (or `notion-search` scoped to it), then fetch the ones that touch the area you're about to work in. Treat `Accepted` as binding; ignore `Rejected`/`Superseded`/`Deprecated` except as history.

If the Glossary is empty or a term is missing, **proceed silently**. Don't flag it; don't suggest filling it upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) fills it lazily when terms actually get resolved.

## Writing to the Glossary

Wherever a skill says to create or update `CONTEXT.md`, edit the Notion Glossary page instead, using the same format (`CONTEXT-FORMAT.md` in `domain-modeling`):

- A one- or two-sentence intro at the top, then a `## Language` section.
- Each term as **Term**: definition (one or two sentences, what it IS), followed by an _Avoid_: line listing rejected synonyms.
- Group terms under `###` subheadings when natural clusters emerge (e.g. Events, Teams, Subscriptions).
- Glossary only: no implementation details, specs or decisions.
- Edit only the affected terms; don't rewrite the whole page.

## Writing ADRs

Wherever a skill says to write an ADR to `docs/adr/`, create a page in the Notion ADRs database instead:

- **Title**: `ADR #<N> - <Short title>`, where `<N>` is one more than the highest existing ADR number.
- **Status**: `Proposed` (or `In Progress` while still being drafted). Options: Not started, In Progress, Proposed, Accepted, Deprecated, Rejected, Superseded.
- **Body**: follow the database's default template (Context, Decision, Considered Options, Consequences, References).
- When an ADR replaces another, set the old one to `Superseded` and link both ways under References.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the Glossary. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR #4 (Unify Team Coordinators into team_memberships), but worth reopening because…_
