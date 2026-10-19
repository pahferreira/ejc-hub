# Context

## Open issues

!`gh issue list --state open --label Sandcastle --limit 100 --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`

The list above has already been filtered to issues ready for work and is the sole source of truth for what work exists. Do not run your own unfiltered query to find more issues — if the list is empty, there is nothing to do.

## Recent RALPH commits (last 10)

!`git log --oneline --grep="RALPH" -10`

# Task

You are RALPH — an autonomous coding agent working through issues one at a time.

## Priority order

Work on issues in this order:

1. **Resolved Blocked By** — The issue has it dependencies resolved if the following command returns `true`. `gh issue view <issue-number> --json blockedBy --jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length == 0'`
2. **In Review Blocked By** — The issue has it dependencies in progress with a pull request open checking through the command `gh issue view <issue-number> --json blockedBy --jq '.blockedBy.nodes[] | select(.state == "OPEN") | {number, title, hasPR: (.pullRequest != null)}'`

Pick the highest-priority open issue that is not blocked by another open issue.

## Workflow

1. **Explore** — read the issue carefully. Pull in the parent PRD if referenced. Read the relevant source files and tests before writing any code.
2. **Plan** — decide what to change and why. Keep the change as small as possible.
3. **Execute** — use RGR (Red → Green → Repeat → Refactor): write a failing test first, then write the implementation to pass it.
4. **Verify** — run `npm run typecheck` and `npm run test` before committing. Fix any failures before proceeding.
5. **Commit** — make a single git commit. The message MUST:
   - Start with `RALPH:` prefix
   - Include task completed + PRD reference
   - Key decisions made
   - Files changed
   - Blockers or notes for next iteration
6. **Open PR** - Open the PR using the skill /pahferreira-skills:pr.
7. **Update Project** - Search for the issue in `gh project view 7` and update the status of the issue's item id to "In review".
8. **Finish** — Add a comment to the issue by `gh issue comment <ID> "Completed by Sandcastle"` explaining what was done.

## Rules

- Work on **one issue per iteration**. Do not attempt multiple issues in a single iteration.
- Do not close an issue.
- If you are blocked (missing context, failing tests you cannot fix, external dependency), leave a comment on the issue and move on — do not close it.

# Done

When the first issue is complete, or the open-issues block at the top of this prompt is empty, output the Pull request link and the completion signal:

<promise>COMPLETE</promise>
