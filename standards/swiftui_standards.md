---
platform: ios
ui: swiftui
---

# Standard: SwiftUI Standards

Rules for SwiftUI UI code. Complements [`coding_standards.md`](coding_standards.md). Enforced
in review by the [SwiftUI Expert](../agents/swiftui_expert.md) and
[Accessibility Expert](../agents/accessibility_expert.md).

## Views

- The `View` is a **function of state** — no networking, persistence, or business logic in `body`.
- Extract a subview when `body` exceeds ~40 lines or repeats.
- One primary `View` per file plus its tightly-coupled subviews.
- Side effects via `.task {}`/`.onChange`, delegated to the ViewModel.

```swift
// ✅ thin view bound to state
var body: some View {
    switch viewModel.state {
    case .loading: ProgressView()
    case .loaded(let items): List(items) { ItemRow($0) }
    case .failed(let msg): ErrorView(message: msg) { Task { await viewModel.load() } }
    case .idle: Color.clear.task { await viewModel.load() }
    }
}
```

## State Management

- One **source of truth** per piece of state; don't duplicate model data into local `@State`.
- New code uses **Observation** (`@Observable` ViewModels, `@State` to own them).
- `@State` for view-local value state; `@Binding` for two-way child state; `@Environment` for
  dependency/context.
- Model screen state as a **single enum** (`idle/loading/loaded/failed`), not scattered booleans.
- ViewModels are `@MainActor`.

## Navigation

- Use `NavigationStack` with **value-based** destinations (`navigationDestination(for:)`).
- Centralize routing (router/coordinator); don't scatter navigation booleans across views.

## Adaptive Layout (iPhone Duo)

Every screen must resize, because iPhone Duo runs the same app at compact width on the outer
display and regular width on the inner display, folded or split. Full guidance:
[`skills/ui/ios/iphone_duo_adaptive_layout.md`](../skills/ui/ios/iphone_duo_adaptive_layout.md).

- Adapt to `horizontalSizeClass`/`verticalSizeClass` and container geometry. Never size to a
  specific device.
- Prefer `NavigationSplitView`, `TabView`, `NavigationStack`, and `ArrangementView` over custom
  containers. Keep navigation *outside* an `ArrangementView`.
- Declare bars with `.toolbar {}` inside a navigation container so they can move to the
  vertical bar. Give every non-text item a title and a symbol (`Label` /
  `Button(_:systemImage:)`).
- Order toolbar items Back/Close → `.topBarPinnedTrailing` Done → grouped actions. Use
  `ToolbarItemGroup` rather than spacers, `.visibilityPriority(_:)` for overflow order, and
  `ToolbarOverflowMenu` for rare actions.
- Custom layouts avoid active `.division`/`.occlusion` regions from
  `GeometryProxy.reservedRegions(kind:)`.
- Use `.toolbarVerticalBehavior(.disabled)` only for full-screen, non-scrolling UI, and never
  toggle it from view state.

```swift
// ✅ adaptive toolbar item
ToolbarItem(placement: .bottomBar) {
    Button("New Note", systemImage: "square.and.pencil") { viewModel.newNote() }
}
.visibilityPriority(.high)
```

## Styling

- Use semantic colors and `Font` text styles; **no hardcoded font sizes** (Dynamic Type).
- Centralize design tokens (spacing, colors, typography) in a design system.
- Support light/dark mode; verify both.

## Performance

- `LazyVStack`/`List` for large collections; stable `id` in `ForEach`.
- Keep expensive work out of `body`; memoize derived values.
- Avoid unnecessary `AnyView`; prefer `@ViewBuilder`.

## Accessibility (required, not optional)

- Every interactive element has a label + correct trait.
- Layout survives the largest Dynamic Type size.
- Color is never the only signal; touch targets ≥ 44×44 pt.
- Add accessibility identifiers for UI testing. (Full gate:
  [`checklists/accessibility_review.md`](../checklists/accessibility_review.md).)

## Previews

- Provide previews with injected **stub** dependencies and multiple states (loading/error/loaded),
  plus a large-Dynamic-Type variant for key screens.
- Key screens also get compact-width (iPhone Duo outer display) and regular-width (inner display)
  previews.
