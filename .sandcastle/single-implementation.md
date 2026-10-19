# Task

You are responsible to implement the issue number {{ISSUE_NUMBER}} using the skill /implement.

## Blocking issues

Check if the issue is blocked by another issue using: `gh issue view {{ISSUE_NUMBER}} --json blockedBy --jq '[.blockedBy.nodes[] | select`.
If the issue is blocked, check for branch with the name `feat/issue-<blocking-issue-number>` and branch from it instead.

## Workflow

1. **Explore** — read the issue carefully. Pull in the parent PRD if referenced. Read the relevant source files and tests before writing any code.
2. **Plan** — decide what to change and why. Keep the change as small as possible.
3. **Execute** — use RGR (Red → Green → Repeat → Refactor): write a failing test first, then write the implementation to pass it.
4. **Verify** — run `npm run typecheck` and `npm run test` before committing. Fix any failures before proceeding.
5. **Commit** — make a single git commit using conventional commits.
6. **Open PR** - Open the PR using the skill /pahferreira-skills:pr.
7. **Update Project** - Search for the issue in `gh project view 7` and update the status of the issue's item id to "In review".
8. **Finish** — Add a comment to the issue by `gh issue comment <ID> "Completed by Sandcastle"` explaining what was done.

## Rules

- Do not close an issue.
- If you are blocked (missing context, failing tests you cannot fix, external dependency), leave a comment on the issue and move on — do not close it.

# Done

When the first issue is complete, or the open-issues block at the top of this prompt is empty, output the Pull request link and the completion signal:

<promise>COMPLETE</promise>
