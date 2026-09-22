# /review — Mobile Code Review

Run the full code review checklist against current changes.

## Behavior

When invoked:

1. **Identify changed files** — use `git diff --name-only` (staged + unstaged), filter to source files (`*.swift`, `*.dart`, etc.).
2. **Load Project Conventions** — read project conventions in `CLAUDE.md` and [`standards/`](../../standards/).
3. **Run Automated Linters** — run SwiftLint or analyzer if available.
4. **Execute Code Review Workflow** — follow [`workflows/conduct_code_review.md`](../../workflows/conduct_code_review.md) and [`checklists/code_review.md`](../../checklists/code_review.md).
5. **Check Concurrency & Architecture** — Swift 6 concurrency, memory leaks, Clean Architecture/MVVM/MVP boundaries.
6. **Report Findings** — output prioritized findings with file:line, signal words (`Pass`, `Suggestion`, `Issue`, `Convention`), and a clear verdict.

## Output Format

```text
Code Review — [N files changed]

Universal & Spec:
  Pass  Naming: consistent with project conventions
  Pass  Error handling: all errors handled
  Issue Edge case: `processItems` doesn't handle empty array
  Suggestion Complexity: `calculateTotal` could extract tax logic

Platform & Concurrency:
  Pass  No force unwraps
  Issue Retain cycle: closure in `fetchData` captures self strongly
  Pass  Accessibility labels present

Project Standards:
  Convention Line 23: uses `if let` but standards require `guard let` for early returns
  Pass  Architecture: follows MVVM pattern

Result: 2 issues to fix, 1 suggestion
Verdict: Request-changes | Approve-with-nits | Approve
```

## Signal Words

| Signal         | Meaning                            |
| -------------- | ---------------------------------- |
| **Pass**       | Item satisfied                     |
| **Suggestion** | Optional improvement, non-blocking |
| **Issue**      | Must be fixed before commit        |
| **Convention** | Violation from standards/CLAUDE.md |

## Rules

- Only flag items relevant to actual changes, not the entire codebase.
- Every issue must include file:line, reason, and concrete fix suggestion.
- Critical and High issues block merge.
