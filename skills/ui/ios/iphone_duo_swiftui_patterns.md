---
platform: ios
ui: swiftui
---

# Skill: iPhone Duo Production Patterns — SwiftUI

## Overview

These patterns come from shipping iPhone Duo support in a production SwiftUI app that has
tabs, list-and-detail flows, sheets, and PIN forms. The app also had to keep its phone
experience unchanged while the Duo work landed.

This skill builds on the platform rules in
[`iphone_duo_adaptive_layout.md`](iphone_duo_adaptive_layout.md) (size classes, reserved
regions, vertical bars, arrangement views), so read that one first. Apple's
[HIG for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
is the source of truth. What this skill adds is the app-level engineering:

1. **An adoption seam.** Each screen has a factory that picks a dedicated Duo view, so the
   regular iPhone UI isn't touched. This only applies to existing apps.
2. **List-and-detail with `ArrangementView`.** A stable selection, an empty-state placeholder,
   and a detail view that resets for each item.
3. **Posture handoff.** When the device folds or unfolds, the open detail moves between a push
   or sheet and the trailing pane, and its state survives the move.
4. **Independent panes.** Each pane has its own scroll view, its own pull-to-refresh, and a
   refresh task it owns.
5. **Wide-display ergonomics.** Forms sit in a readable column, and sheets are sized and placed
   for the inner display, with a close button the system can move into the vertical bar.

## Use Cases

- Adding iPhone Duo layouts to an existing SwiftUI app without changing any pixel of the regular
  iPhone UI.
- Building a list-and-detail screen that shows two panes when open and pushes or presents the
  detail when closed.
- Keeping a half-typed approval remark, a selection, or a scroll position across a fold.
- Sizing and placing sheets and single-column forms on the inner display.

## Best Practices

### Choose the adoption strategy deliberately

- **Greenfield or small apps:** use one view per screen and branch only on
  `@Environment(\.horizontalSizeClass)`. This is the HIG default, and it gives iPad, Mac, and
  iPhone Mirroring the same improvements for free.
- **Existing apps where a phone regression is costly (banking, healthcare):** use a
  **per-screen seam**:
  - `enum <Screen>ScreenFactory { static func make(...) -> some View }` returns
    `DuoAdaptive { <Screen>DuoView(...) } standard: { <Screen>View(...) }`.
  - Router destinations and tab roots call the factory, so routing has one source of truth.
  - `<Screen>DuoView` is `@available(iOS 27.1, *)` and lives in `UI/Duo/<Feature>/`. It
    **reuses the same ViewModel and leaf subviews** as the standard view. Only the composition
    differs.
- The seam is a **rollout tool, not a layout rule.** Inside a Duo view, every layout decision
  still comes from `horizontalSizeClass` and container geometry. Know the trade-off: a
  regular-width iPad doesn't get the Duo composition. Plan to merge each Duo view back into
  its standard view once it's stable.
- **Detect the capability, not the model.** Install the hinge observer once at the app root
  (`onHingeChange`, outside any `.id(...)` reset) and publish the result through one shared
  observable. A model-identifier allow-list is only a cold-start hint. Cache the observed value
  keyed by model identifier, so a backup restored onto a different iPhone doesn't inherit a
  stale `true`.

### List and detail with `ArrangementView`

- `isSplitLayout = horizontalSizeClass == .regular`. At regular width, show
  `ArrangementView { list } secondary: { detail }` with
  `.arrangementViewStyle(.split.axes(.horizontal))` and a list ratio of about 0.4
  (`.splitArrangementLayoutRatio(_:)`). At compact width, show the list alone and push or
  present the detail.
- **Store the selection as a stable identifier** (an account number or a request ID) and look up
  the model from the ViewModel. A refresh then updates the detail pane instead of freezing a stale
  copy.
- Give the detail `.id(selection)` so per-item state (segments, loading, focus) resets when the
  selection changes.
- **Never leave the trailing pane blank.** Show a placeholder such as "Select an item to see its
  details" with an illustration until something is selected.
- Highlight the row that's open in the pane, using the same selected style as multi-select.
- Draw a 1-pt separator on the list's trailing edge (`.overlay(alignment: .trailing)`). Don't
  add padding between the panes.
- In split mode, keep the navigation bar stable: `.toolbar(.visible, for: .navigationBar)` with
  an inline empty title, and show a large in-pane heading instead. This stops the bar from jumping
  when the pane changes.
- **Keep controls with the content they affect.** A list-scoped action, such as History, sits in
  the list pane's header at regular width and moves into the toolbar at compact width.

### Posture handoff (fold and unfold)

- React to `.onChange(of: isSplitLayout)`:
  - **Unfold:** move the pushed detail (the last router path element) or the presented sheet
    *into* the trailing pane.
  - **Fold:** move the pane's selection *out* to a push or a sheet.
- Do the swap **without animation and one run-loop later**, inside a `Transaction` with
  `disablesAnimations = true` dispatched to the main queue. Otherwise the push or pop animation
  fights the system's re-layout and can cancel it.
- Guard the handoff:
  - Act only if this screen's tab is selected.
  - Clear the pane in `.onDisappear`, so a fold while the screen is hidden can't present a sheet
    later.
- **Keep the same ViewModel across sheet ↔ pane moves.** Use a small `@MainActor` state object
  that caches the open detail ViewModel by selection. Input such as a typed remark then survives
  the fold, which is the HIG's continuity requirement. Reset the cache on an explicit new tap so
  a fresh open loads fresh data.
- When a multi-select changes while its review is open in the pane, update the cached ViewModel
  in place, carrying over user-typed fields. Don't recreate it.

### Independent panes

- Give each pane its **own** `ScrollView` or `List` and its own `.refreshable`, scoped to that
  pane's data. The panes scroll independently, and pulling one doesn't reload the other.
- Run refreshes in a **task the refresher owns**, de-duplicated by scope. When a fold re-lays out
  a pane, SwiftUI cancels the `.refreshable` task. If the network call lives in that task, it's
  cancelled with it. A second pull while one is in flight should await the running task.
- Disable hit-testing on a pane's cards (`allowsHitTesting(false)`) while the other pane is in a
  modal mode such as multi-select. Don't hide them.

### Readable columns and sheets on the inner display

- Single-column screens (login, PIN, settings, success) use one modifier:
  `.frame(maxWidth: isWide ? columnWidth : .infinity).frame(maxWidth: .infinity)`. Keep the
  width in **one** layout constant. Unbounded line lengths on the inner display hurt
  readability.
- Lists on the inner display get horizontal content margins
  (`.contentMargins(.horizontal, …, for: .scrollContent)`), so rows don't run edge to edge
  beside a vertical bar.
- **Sheets:**
  - Contextual panels (notifications, filters) use `.presentationPlacement(.trailing)`. Per the
    HIG, trailing sheets get a vertical bar.
  - Height-fitted bottom sheets stay centered, with a custom `PresentationSizing` that keeps the
    detent height and limits the width to about half the window.
- **Sheet close button:**
  - Host sheet content in a `NavigationStack` and put a `Button(role: .close)` in its toolbar,
    so the system can place the close in the vertical bar.
  - Tell content that draws its own ✕ to hide it, using an environment flag such as
    `isNativeSheetCloseShown`.
  - Provide an opt-out for content that has its own chrome (share sheet, file preview).
- If the toolbar close sits awkwardly in a centered regular-width sheet, an in-sheet close is
  acceptable. Make it at least 44 pt, give it an accessibility label, and add an accessibility
  identifier for UI tests.
- Present PIN and result steps as sheets at regular width instead of full-screen pushes, so the
  list context stays visible.

### House style for Duo code

- Mark the whole Duo view `@available(iOS 27.1, *)`, then split it into extensions with
  `// MARK: - iPhone Duo split layout`. Keep `body` short and move panes into computed
  properties.
- Write one-line "why" comments with arrows for posture logic, for example
  `/// Unfold: pushed detail → trailing pane.`
- Use design tokens (`DesignSystem.Spacing`, `DesignSystem.Padding`) and the shared text
  component, never literals.

## Anti-Patterns

- ❌ Branching layout on device model, hinge presence, or `UIScreen` inside a view. Use the
  hinge only to choose the seam, and use size classes for layout.
- ❌ A Duo view that forks the ViewModel or business logic instead of sharing it.
- ❌ Holding the selected model object in `@State`, which freezes a stale copy after a refresh.
- ❌ An empty trailing pane while nothing is selected.
- ❌ Animated push or pop during a fold, or a handoff that runs while the screen is off-screen.
- ❌ Recreating the detail ViewModel on every fold, which drops typed input.
- ❌ One `.refreshable` for both panes, or a network call that dies when SwiftUI cancels the
  refresh task.
- ❌ Full-width forms and full-width bottom sheets on the inner display.
- ❌ A custom ✕ overlay on every sheet when the system close would work, or two close buttons
  at once.
- ❌ Reading the key window's width from many places. Keep any window lookup inside one sizing
  type.

## Checklist

- [ ] Adoption strategy chosen: one adaptive view (default) or a per-screen factory seam (existing
      app). The seam is documented with a merge-back plan.
- [ ] The hinge is detected once at the app root. No view reads the device model.
- [ ] Duo views share ViewModels and leaf views with the standard views.
- [ ] List-and-detail uses `ArrangementView` at regular width, a stable selection ID,
      `.id(selection)` on the detail, and an empty-selection placeholder.
- [ ] Fold and unfold move the open detail between push/sheet and pane without animation and
      without losing input.
- [ ] Handoff is guarded by the selected tab, and the pane is cleared on disappear.
- [ ] Each pane scrolls and refreshes independently, and refresh work survives task cancellation.
- [ ] Forms use the shared readable column. Lists have content margins at regular width.
- [ ] Sheets have a deliberate placement and sizing. The close button is a system `.close` role
      where possible, and there's never a double close.

Also see [`../../../checklists/iphone_duo_review.md`](../../../checklists/iphone_duo_review.md) and
[`../../../checklists/code_review.md`](../../../checklists/code_review.md).

## Swift Examples

> These snippets show the patterns. They use `@Observable` per
> [`swiftui_standards.md`](../../../standards/swiftui_standards.md). On deployment targets below
> iOS 17, the same code works with `ObservableObject`, `@StateObject`, and the single-argument
> `onChange`.

### Capability detection and the adoption seam

```swift
// DuoSupport.swift
@MainActor @Observable
final class DuoDevice {
    static let shared = DuoDevice()
    private(set) var isDuo = false

    /// Keyed by model so a backup restored onto a different iPhone is ignored.
    private static var cacheKey: String { "DuoDevice.hasHinge.\(DeviceModel.identifier)" }

    private init() {
        guard #available(iOS 27.1, *) else { return }
        isDuo = UserDefaults.standard.object(forKey: Self.cacheKey) as? Bool ?? false
    }

    fileprivate func update(hasHinge: Bool) {
        UserDefaults.standard.set(hasHinge, forKey: Self.cacheKey)
        if isDuo != hasHinge { isDuo = hasHinge }
    }
}

extension View {
    /// Apply once at the app root, outside any `.id(...)` reset.
    @ViewBuilder
    func detectDuoHinge() -> some View {
        if #available(iOS 27.1, *) {
            onHingeChange { _, context in
                if context.hinge != nil { DuoDevice.shared.update(hasHinge: true) }
            }
        } else {
            self
        }
    }
}

struct DuoAdaptive<Duo: View, Standard: View>: View {
    @ViewBuilder let duo: () -> Duo
    @ViewBuilder let standard: () -> Standard

    var body: some View {
        if DuoDevice.shared.isDuo { duo() } else { standard() }
    }
}

// AccountListScreenFactory.swift — router and tab roots call this, never the views directly.
enum AccountListScreenFactory {
    @ViewBuilder
    static func make() -> some View {
        DuoAdaptive {
            if #available(iOS 27.1, *) { AccountListDuoView() }
        } standard: {
            AccountListView()
        }
    }
}
```

### List and detail with a stable selection

```swift
@available(iOS 27.1, *)
struct AccountListDuoView: View {
    @Environment(AccountListViewModel.self) private var viewModel
    @Environment(Router.self) private var router
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selectedAccountNumber: String?

    var body: some View {
        content
            .navigationTitle(isSplitLayout ? "" : "Accounts")
            .navigationBarTitleDisplayMode(isSplitLayout ? .inline : .large)
            .toolbar(isSplitLayout ? .visible : .automatic, for: .navigationBar) // bar doesn't jump
            .onChange(of: isSplitLayout) { _, isSplit in
                isSplit ? moveDetailIntoSplit() : pushSelectedDetail()
            }
    }
}

// MARK: - iPhone Duo split layout
@available(iOS 27.1, *)
extension AccountListDuoView {
    private var isSplitLayout: Bool { horizontalSizeClass == .regular }

    /// Looked up on every render, so a refresh updates the pane.
    private var selectedAccount: Account? {
        viewModel.accounts.first { $0.number == selectedAccountNumber }
    }

    @ViewBuilder
    private var content: some View {
        if isSplitLayout {
            ArrangementView {
                accountList
                    .overlay(alignment: .trailing) { Color.separator.frame(width: 1) }
                    .splitArrangementLayoutRatio(0.43)
            } secondary: {
                if let selectedAccount {
                    AccountDetailDuoView(account: selectedAccount, isEmbedded: true)
                        .id(selectedAccount.number) // reset per-item state
                } else {
                    DuoEmptySelectionView(title: "Select an account to see its details.")
                }
            }
            .arrangementViewStyle(.split.axes(.horizontal))
        } else {
            accountList
        }
    }

    private func open(_ account: Account) {
        if isSplitLayout {
            selectedAccountNumber = account.number
        } else {
            router.push(.accountDetail(account))
        }
    }
}
```

### Posture handoff without animation

```swift
enum DuoPosture {
    /// Fold/unfold: no push/pop animation, and deferred so the system re-layout isn't cancelled.
    static func withoutAnimation(_ changes: @escaping () -> Void) {
        DispatchQueue.main.async {
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction, changes)
        }
    }
}

@available(iOS 27.1, *)
extension AccountListDuoView {
    /// Unfold: pushed detail → trailing pane.
    private func moveDetailIntoSplit() {
        guard case .accountDetail(let account) = router.path.last else { return }
        DuoPosture.withoutAnimation {
            router.path.removeLast()
            selectedAccountNumber = account.number
        }
    }

    /// Fold: trailing pane → pushed detail.
    private func pushSelectedDetail() {
        guard let selectedAccount else { return }
        DuoPosture.withoutAnimation {
            selectedAccountNumber = nil
            router.push(.accountDetail(selectedAccount))
        }
    }
}
```

### Keeping typed input across sheet ↔ pane

```swift
@MainActor @Observable
final class RequestsDuoState {
    /// Reused while the request moves between sheet and pane on fold/unfold.
    private var openReviewViewModel: ReviewViewModel?

    func reviewViewModel(for requests: Set<Request.ID>) -> ReviewViewModel {
        if let openReviewViewModel, openReviewViewModel.requestIDs == requests {
            return openReviewViewModel
        }
        let viewModel = ReviewViewModel(requestIDs: requests)
        openReviewViewModel = viewModel
        return viewModel
    }

    /// Call on an explicit new tap so the next open loads fresh details.
    func reset() { openReviewViewModel = nil }
}
```

### Pane refresh that survives `.refreshable` cancellation

```swift
@MainActor @Observable
final class PaneRefresher {
    enum Scope: Hashable { case leading, trailing }
    private var tasks: [Scope: Task<Void, Never>] = [:]

    /// The refresher owns the task, so a pane re-layout on fold can't cancel the request.
    func refresh(_ scope: Scope, work: @escaping @MainActor () async -> Void) async {
        if let running = tasks[scope] {
            await running.value
            return
        }
        let task = Task { await work() }
        tasks[scope] = task
        await task.value
        tasks[scope] = nil
    }
}

// Each pane:
ScrollView { leadingCards }
    .refreshable { await refresher.refresh(.leading) { await viewModel.reloadSummary() } }
```

### Readable column and native sheet close

```swift
enum DuoLayout {
    /// Single-column screens on the inner display: design column plus side padding.
    static let formColumnWidth: CGFloat = 520 + DesignSystem.Padding.medium * 2
}

extension View {
    func duoFormColumn(isWide: Bool) -> some View {
        frame(maxWidth: isWide ? DuoLayout.formColumnWidth : .infinity)
            .frame(maxWidth: .infinity)
    }
}

extension EnvironmentValues {
    /// `true` inside a sheet whose ✕ is supplied by `nativeSheetClose()`; content hides its own.
    @Entry var isNativeSheetCloseShown = false
}

private struct NativeSheetCloseHost<Content: View>: View {
    let content: Content
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if #available(iOS 27.1, *), DuoDevice.shared.isDuo {
            NavigationStack {
                content
                    .environment(\.isNativeSheetCloseShown, true)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button(role: .close) { dismiss() } // can move into the vertical bar
                        }
                    }
            }
        } else {
            content.environment(\.isNativeSheetCloseShown, false)
        }
    }
}

extension View {
    /// Apply to the root of a sheet's content only.
    func nativeSheetClose() -> some View { NativeSheetCloseHost(content: self) }
}

// Contextual panel on the inner display:
.sheet(isPresented: $isPresentingNotifications) {
    NotificationView()
        .nativeSheetClose()
        .presentationPlacement(.trailing)
}
```

## Common Interview Questions

- When is a per-screen Duo seam justified over a single size-class-driven view, and what does it
  cost?
- Why detect the hinge instead of the model identifier, and why key the cache by model?
- How do you keep a typed remark when a review sheet becomes a pane on unfold?
- Why defer and de-animate the posture handoff?
- Why can `.refreshable` cancel your network request on a fold, and how do you prevent it?
- How do you decide sheet placement on the inner display?

## AI Implementation Notes

- Load [`iphone_duo_adaptive_layout.md`](iphone_duo_adaptive_layout.md) first. This skill is the
  SwiftUI integration layer on top of it.
- Ask, or infer from the repo, whether the app already uses a factory seam (`*ScreenFactory`,
  `DuoAdaptive`, a `UI/Duo/` folder). If it does, follow it for new screens. If it doesn't,
  default to one adaptive view.
- Match the house style you find: `ObservableObject` vs. `@Observable`, the router type
  (`Navigator`/`Router` with path enums), design-token names, and the shared text component.
  Don't introduce a second one.
- Posture, pane, and sheet logic stays in the view layer or a small view-scoped state object.
  ViewModels stay unaware of folds and widths.
- Previews: give every Duo view a compact and a regular `horizontalSizeClass` preview, plus a
  preview of the empty-selection pane.
- Related: [`iphone_duo_uikit_patterns.md`](iphone_duo_uikit_patterns.md) (the UIKit
  counterpart), [`../../../standards/swiftui_standards.md`](../../../standards/swiftui_standards.md),
  [`../../../workflows/prepare_app_for_iphone_duo.md`](../../../workflows/prepare_app_for_iphone_duo.md).
