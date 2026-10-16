# Issue tracker: GitHub + GitHub Project

Issues and specs for this repo live as GitHub issues in `pahferreira/ejc-hub`, and every issue is linked to the **EJC Hub** GitHub Project (user project #7, `https://github.com/users/pahferreira/projects/7`). Use the `gh` CLI for all operations.

> The old Notion "Tasks Tracker" database is no longer the issue tracker. Don't create tickets there.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..." --project "EJC Hub"`. Use a heredoc for multi-line bodies. Always pass `--project` so the issue is added to the board (lands in **Backlog**).
- **Read an issue**: `gh issue view <number> --comments`, also fetching labels (`--json labels,projectItems`).
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone. Project commands need the `project` token scope (`gh auth refresh -s project`).

## GitHub Project fields

Project ID `PVT_kwHOAbTN0c4A5geV`. Single-select fields:

| Field    | Field ID                          | Options (option ID)                                                                                                  |
| -------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Status   | `PVTSSF_lAHOAbTN0c4A5geVzguSx6k`  | Backlog (`f75ad846`), To do (`08afe404`), In progress (`47fc9ee4`), In review (`4cc61d42`), Done (`98236657`), Won't do (`95f2befa`) |
| Priority | `PVTSSF_lAHOAbTN0c4A5geVzguSx_E`  | Critical (`79628723`), High (`0a877460`), Medium (`da944a9c`), Low (`f1c4ebd4`)                                       |

- **Find an issue's project item ID**: `gh project item-list 7 --owner pahferreira --format json --limit 500 --jq '.items[] | select(.content.number == <n>) | .id'`
- **Set a field**: `gh project item-edit --project-id PVT_kwHOAbTN0c4A5geV --id <item-id> --field-id <field-id> --single-select-option-id <option-id>`
- Triage labels and project Status are independent: labels describe *readiness*, Status describes *progress*. When closing as `wontfix`, also set Status to **Won't do**.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue with `--project "EJC Hub"`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets. All of them get `--project "EJC Hub"`.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map --project "EJC Hub"`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/pahferreira/ejc-hub/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/pahferreira/ejc-hub/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write. Then set the project Status to **In progress**.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
