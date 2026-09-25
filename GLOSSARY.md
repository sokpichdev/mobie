# Glossary

Shared terminology used across the toolkit. Agents and skills assume these definitions.

## Architecture

- **Clean Architecture** — Layered design with dependencies pointing inward. Three layers
  used throughout this repo: **Domain**, **Data**, **Presentation**.
- **Domain layer** — Pure business logic: entities, value objects, use cases, and
  repository *protocols*. No framework or platform imports.
- **Data layer** — Implements Domain repository protocols using data sources (network,
  database, cache). Maps DTOs ↔ domain entities.
- **Presentation layer** — UI and view state. Uses **MVVM** on SwiftUI (`View` ↔ `ViewModel` ↔ use
  cases), **MVP** on UIKit, and a Riverpod **Notifier** on Flutter.
- **MVVM** — Model-View-ViewModel. The `ViewModel` exposes observable state and calls use
  cases; the `View` is a function of state.
- **Use Case (Interactor)** — A single application operation in the Domain layer (e.g.
  `FetchAccountsUseCase`). Orchestrates repositories.
- **Repository** — Abstraction over data access. Protocol in Domain, implementation in Data.
- **DTO (Data Transfer Object)** — Wire/serialization model (`Codable`). Never used directly
  by the UI; mapped to a domain entity.
- **DI (Dependency Injection)** — Providing dependencies from outside via initializers/protocols
  rather than constructing them internally.
- **Module** — An independently buildable unit (Swift Package / framework) with an explicit
  public interface.
- **SOLID** — Single responsibility, Open/closed, Liskov substitution, Interface segregation,
  Dependency inversion.

### Flutter terms

- **Widget** — An immutable description of part of the UI. Flutter rebuilds widgets cheaply;
  `build()` is a pure function of state and must have no side effects.
- **Notifier / AsyncNotifier** — Riverpod's state holder, the Flutter analogue of a ViewModel.
  It owns an immutable state value and exposes methods that emit new values.
- **Provider** — A Riverpod declaration of how to build a value. The provider graph doubles as the
  app's DI container; `ProviderScope(overrides:)` is the test seam.
- **`AsyncValue`** — Riverpod's union of loading / data / error. Switching over it exhaustively is
  how a Flutter screen handles all its states.
- **go_router** — The toolkit's standard declarative router: one route table covering in-app
  navigation and deep links, with a `redirect` hook for auth gating.
- **Isolate** — Dart's unit of concurrency, with its own memory. CPU-bound work moves here
  (`Isolate.run`/`compute`) so it does not drop frames on the UI isolate.
- **Platform channel** — The typed bridge from Dart to native Swift/Kotlin. `pigeon` generates
  both sides from one schema; the channel itself is a Data-layer detail.

### iPhone Duo terms

- **iPhone Duo** — Apple's foldable iPhone (2026). It has a compact-width **outer display** and a
  regular-width **inner display**, each with a front camera, joined by a center hinge. See
  [`skills/ui/ios/iphone_duo_adaptive_layout.md`](skills/ui/ios/iphone_duo_adaptive_layout.md).
- **Pose** — A way the device is held or placed: closed, open, partially folded like a book,
  tent, laptop, and so on. Layouts adapt through size classes, not per-pose designs.
- **Reserved region** — An area content avoids. An **occlusion** is a region hardware covers
  (the outer camera or Dynamic Island, or the inner camera while active). A **division** is the
  fold when partially open. A region can be active or inactive (`ReservedRegion` /
  `UIView.ReservedRegion`).
- **Vertical bar** — The side-of-display bar where iPhone Duo places the status bar, toolbar,
  navigation controls, and tab bar in most poses.
- **Arrangement view** — A primary + secondary container (`ArrangementView` /
  `UIArrangementViewController`) with **split** or **overlay** styles that adapt to size and the
  fold.

## Networking

- **REST** — Resource-oriented HTTP API.
- **GraphQL** — Query language where the client specifies the response shape.
- **WebSocket** — Full-duplex persistent TCP connection for realtime messaging.
- **SSE (Server-Sent Events)** — Server-to-client one-way stream over HTTP.
- **Backpressure** — Strategy for handling messages arriving faster than they can be processed.
- **Idempotency key** — Client-generated key that lets the server safely de-duplicate retried
  mutating requests.
- **Exponential backoff** — Retry delay that grows multiplicatively, usually with jitter.

## Security

- **OWASP MASVS** — Mobile Application Security Verification Standard. The requirement baseline.
- **OWASP MASTG** — Mobile Application Security Testing Guide. The testing companion to MASVS.
- **Keychain** — Apple's secure, encrypted credential store.
- **SSL/Certificate Pinning** — Validating the server's certificate or public key against a
  known value to resist MITM.
- **JWT** — JSON Web Token; a signed, base64url-encoded claims token.
- **OAuth2 / PKCE** — Delegated authorization framework; PKCE is the public-client extension.
- **AES-GCM** — Authenticated symmetric encryption (confidentiality + integrity).

## Testing

- **Unit test** — Tests one component in isolation with dependencies stubbed/mocked.
- **Integration test** — Tests collaboration across components (e.g. repository + decoder).
- **UI test** — Drives the app through the accessibility layer (XCUITest).
- **Test double** — Stub, mock, spy, or fake standing in for a real dependency.
- **AAA** — Arrange, Act, Assert test structure.

## Delivery

- **CI/CD** — Continuous Integration / Continuous Delivery.
- **Fastlane** — Automation toolchain for build, sign, and store submission.
- **Semantic Versioning** — `MAJOR.MINOR.PATCH`.
- **TestFlight** — Apple's beta distribution service.

## Toolkit Vocabulary

- **Agent** — A loadable operational role (file in `agents/`).
- **Skill** — A deep, single-topic capability (file in `skills/`).
- **Workflow** — An end-to-end procedure chaining agents/skills (file in `workflows/`).
- **Handoff** — The structured context one agent passes to the next (see [AGENTS.md](AGENTS.md)).
