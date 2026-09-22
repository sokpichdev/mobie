# Checklist: Code Review

Baseline pass for the [Code Reviewer](../agents/code_reviewer.md). Tag findings
Critical/High/Medium/Low/Nit; **block on Critical/High**.

## Spec Adherence & Correctness (Critical/High)

- [ ] Does what the description/acceptance criteria claim; no dropped requirements.
- [ ] Edge cases handled: empty, nil, boundary, large inputs, offline network.
- [ ] Error paths handled; no silent `try?` swallowing or bare `catch`.
- [ ] No force-unwraps/force-try on untrusted data (`!`, `try!`, `as!`).

## Concurrency & Safety (Critical/High)

- [ ] Concurrency-safe: no data races; `@MainActor` for UI updates.
- [ ] Swift 6 / Sendable: non-Sendable state not passed across isolation boundaries.
- [ ] Memory safety: `[weak self]` in escaping closures; no retain cycles.
- [ ] Task cancellation honored (`Task.isCancelled`, `Task.checkCancellation()`).
- [ ] Resources cleaned up: timers, subscriptions, observers, and tasks cancelled on deinit.

## Architecture & Layering

- [ ] Layering respected; no DTO/framework leakage across boundaries into Presentation.
- [ ] Dependencies injected via protocols/initializers; no new hidden singletons.
- [ ] Single responsibility honored; business logic kept out of views.

## UI & State Flow

- [ ] Proper state wrappers used (`@State`, `@Binding`, `@Observable`).
- [ ] Views are lightweight; no heavy computations, side effects, or formatting in `body`.
- [ ] Collections use stable, unique identifiers (`Identifiable` / `id: \.id`).
- [ ] Accessibility: VoiceOver labels, traits, and Dynamic Type scaling considered.

## Security & Data Privacy

- [ ] No secrets, API keys, tokens, or PII in code, URLs, or logs.
- [ ] Credentials use Keychain / secure storage; never `UserDefaults` / `SharedPreferences`.
- [ ] Input from network/user/deep-links validated before use.
- [ ] Deep security concerns routed to the [Security Expert](../agents/security_expert.md).

## Tests

- [ ] New logic has deterministic unit tests (success + error + edge paths).
- [ ] Bug fixes include a failing-first regression test.
- [ ] No real network/clock/randomness in tests; dependencies mocked.

## Readability & Standards

- [ ] Conforms to [`standards/`](../standards/); consistent naming and terminology.
- [ ] No dead/commented-out code; no leftover debug logging.
- [ ] Public APIs and non-obvious logic documented.

## Verdict

- [ ] Verdict recorded: Approve / Approve-with-nits / Request-changes.
- [ ] Every Critical/High finding has a file:line and a concrete fix snippet.
- [ ] Agent-loop feedback noted if recurring pattern detected.
