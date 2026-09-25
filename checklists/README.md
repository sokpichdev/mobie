# Checklists

Objective, measurable, automation-friendly review gates. Have an agent create a todo per item
and self-review before declaring work done. Each maps to a standard and/or an agent.

- [architecture_review.md](architecture_review.md) — layering, DI, modularity
- [code_review.md](code_review.md) — correctness, security, tests, standards (baseline gate)
- [uikit_review.md](uikit_review.md) — programmatic views, MVP contract, presenter rules, lifecycle, accessibility (iOS)
- [iphone_duo_review.md](iphone_duo_review.md) — resizing, reserved regions, vertical bars, toolbars, camera on iPhone Duo (iOS, both paradigms)
- [flutter_review.md](flutter_review.md) — layering, Riverpod state, widgets, routes, rebuilds, secure storage, tests (Flutter)
- [security_review.md](security_review.md) — OWASP MASVS storage/transport/auth/crypto
- [api_review.md](api_review.md) — REST/GraphQL contracts, errors, pagination
- [websocket_review.md](websocket_review.md) — realtime lifecycle, concurrency, backpressure
- [performance_review.md](performance_review.md) — main thread, memory, launch, battery
- [accessibility_review.md](accessibility_review.md) — VoiceOver, Dynamic Type, contrast
- [release_review.md](release_review.md) — versioning, signing, store readiness, rollout

## Severity convention

Tag findings **Critical / High / Medium / Low / Nit**. Critical and High block merge/release;
Medium/Low may be deferred with an explicit note; Nits are optional.
