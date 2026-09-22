# Workflow: Conduct a Code Review

Led by the [Code Reviewer](../agents/code_reviewer.md). Produces a prioritized, actionable verdict.

## Objective

Evaluate a change for correctness, security, architecture fit, concurrency safety, and test adequacy; deliver a
clear verdict with severity-tagged, actionable feedback.

## Inputs

- The diff/PR, its stated intent, and acceptance criteria.
- Relevant context (linked issue, design notes, repo standards).

## Outputs

- A structured review with findings (Critical/High/Medium/Low/Nit), signal words, and a verdict:
  Approve / Approve-with-nits / Request-changes.

## Step-by-Step Process

1. **Resolve Scope (Phase 0)**:
   - Identify changed files via PR (`gh pr view <n>`) or git (`git diff --name-status`).
   - Distinguish modified/added source files from deleted files (check deletions for accidental regression).
2. **Automated Checks (Phase 1)**:
   - Run available linters (`swiftlint`, `flutter analyze`) and collect warnings.
3. **Spec Adherence & Correctness**:
   - Compare diff against PR description and issue acceptance criteria.
   - Check edge/boundary conditions, offline handling, and error paths.
4. **Concurrency & Memory Safety**:
   - Verify Swift 6 strict concurrency, Sendable types, `@MainActor` UI isolation, retain cycle prevention (`[weak self]`), and task cancellation.
5. **Architecture & Boundary Conformance**:
   - Verify Clean Architecture / MVVM / MVP layering, no DTO leakage, protocol-based DI.
6. **Security Pass**:
   - Check Keychain usage, no plaintext secrets or PII, SSL pinning. Route deep concerns to [Security Expert](../agents/security_expert.md).
7. **Test Adequacy**:
   - Ensure deterministic unit tests for new logic and regression tests for bug fixes.
8. **Synthesize Findings & Issue Verdict**:
   - Classify findings with signal words (`Pass`, `Suggestion`, `Convention`, `Issue`) and severity.
   - Critical/High findings block merge and require `file:line` + concrete fix snippets.

## Validation Steps

- Every Critical/High finding has a location and a concrete fix snippet.
- The change is evaluated against its acceptance criteria, not just in isolation.
- Style preferences not in `standards/` are labeled as nits.

## Failure Scenarios

- **Can't understand the code** → that's a finding; request clarification/refactor.
- **No tests for risky logic** → Request-changes.
- **Scope creep in the PR** → ask to split.
- **Security ambiguity** → escalate; block until resolved.

## AI Agent Instructions

- Use [`checklists/code_review.md`](../checklists/code_review.md) as the baseline.
- Prioritize by severity; block on Critical/High; be specific (`file:line` + why + fix).
- Don't bikeshed style while missing correctness/security issues.
- Verify tests exist and are deterministic before approving.

## Acceptance Criteria

- [ ] Findings prioritized by severity with locations + fixes.
- [ ] Correctness, architecture, security, concurrency, and tests all assessed.
- [ ] Verdict issued; Critical/High block merge.
- [ ] `checklists/code_review.md` applied.
