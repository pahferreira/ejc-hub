---
name: create-pr
description: Open a GitHub pull request for the finished implementation, filled from the repo's PR template.
argument-hint: "[base-branch]"
disable-model-invocation: true
---

Open a pull request for the work on the current branch. The body follows `.github/pull_request_template.md`; read it fresh each run, since it is the single source of truth for the headings.

Base branch: `$ARGUMENTS`, or `main` when empty.

## 1. Branch and commits

Get the branch ready to push:

- On `main`: create `<type>/<kebab-slug>` (e.g. `feat/subscription-skills-filters`, `fix/candidates-sort`) and switch to it.
- Uncommitted changes present: show `git status --short` and ask whether to commit them. Commit only on a yes.

Done when the branch is not the base, the working tree is clean, and `git log <base>..HEAD` lists at least one commit.

## 2. Find the issue

The `Resolves:` line needs the GitHub issue this work implements. Look in order:

1. The issue already discussed in this session (a ticket fetched, a `#n` mentioned).
2. `gh issue list --state open --search "<keywords from the diff>"`.

Done when you hold one issue number you are confident in. If you're unsure, ask the user, and offer "no issue" as a choice. On "no issue", drop the `Resolves:` line.

## 3. Write the PR

Read the full change: `git log <base>..HEAD` and `git diff <base>...HEAD`. Write from the diff, plus the session's reasoning where it explains a choice.

**Title**: a Conventional Commit, `type(scope): summary`, lowercase and imperative, matching `git log --format=%s -15` on `main` (`feat:`, `fix:`, `feat(api):`, `docs:`). PRs are squash-merged, so the title becomes the commit on `main`.

**Body**: keep the template's headings verbatim and replace every bracketed placeholder:

- **Overview**: `Resolves: #<n>`, then what changed for the user or the business, in the product's own words (the Portuguese page and field names the UI shows). Bold the key nouns. Add a short bullet list for product decisions the reviewer should know were deliberate.
- **Solution**: the technical approach and *why*: the rejected alternative, the constraint that forced the shape, the convention it follows. Add `####` subsections when they earn their place:
  - `Root Cause`: for a fix. Name the mechanism and why it went unnoticed.
  - `Tests`: what was added and the suite results you actually ran.
  - `Notes for reviewers`: pre-existing issues you noticed but left alone, and anything bundled that could have been its own PR.

Write the body to a scratch file and use `--body-file`. Shell quoting breaks markdown.

## 4. Push and open

```sh
git push -u origin HEAD
gh pr create -B <base> -a @me --title "<title>" --body-file <file>
```

The body ends with the last section's content. It has no attribution footer and no "Generated with" line.

Done when `gh pr view --json body -q .body` contains none of the template's bracketed placeholder sentences and no `[issue_number]`. Reply with the PR URL.
