---
platform: ios
ui: uikit
---

# Skill: iPhone Duo Production Patterns — UIKit

## Overview

This skill shows how to retrofit iPhone Duo onto a large, existing, programmatic UIKit (MVP) app
whose navigation is built on `navigationController?.pushViewController(_:animated:)` calls
scattered across dozens of screens. The patterns come from shipping a two-pane layout on the
inner display without rewriting those call sites.

It builds on the platform rules in
[`iphone_duo_adaptive_layout.md`](iphone_duo_adaptive_layout.md): size classes, reserved
regions, vertical bars, and arrangement views. Read that skill first. Apple's
[HIG for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
remains the source of truth. This skill adds the integration engineering the HIG leaves out:

1. **Gating.** Ship Duo code from the same branch that still builds and runs on older Xcode and
   older iOS.
2. **A tab container seam.** Each tab's navigation controller sits inside an arrangement
   container, behind one factory.
3. **Path-based pane routing.** Each tab is one logical path of view controllers. On the inner
   display a host splits that path into a primary and a secondary pane. Existing `push`/`pop`
   calls keep working.
4. **Resizing fixes** that come up on almost every legacy screen.

On a greenfield UIKit app, start with `UISplitViewController` or `UIArrangementViewController`
and plain size-class traits. Only add path-based routing when push calls are spread throughout
an existing codebase.

## Use Cases

- Adding a list-and-detail split on the inner display to a tab-based UIKit app without touching
  every screen.
- Making `push`/`pop` from any screen land in the correct pane when the device is open, and
  collapse back into one stack when it's closed.
- Auditing a legacy UIKit codebase for code that breaks once a tab's root is no longer a
  `UINavigationController`.
- Fixing layouts that read screen width, ignore the vertical-bar safe-area inset, or animate
  layers during a fold.

## Best Practices

### Gate at compile time and at run time

- Wrap every Duo-only type and call in **two** gates. The first is
  `#if canImport(UIKit, _version: <iOS 27.1 SDK UIKit version>)`, so the same branch still
  compiles on an older Xcode (for example, a CI image that hasn't been upgraded). The second is
  `@available(iOS 27.1, *)` / `if #available(iOS 27.1, *)` for the runtime OS. Read the UIKit
  version from the SDK you build with, and keep it in one documented place.
- Put small, gated helpers on traits, such as `UITraitCollection.hasVerticalBar`. They return a
  safe default (`false`) on older SDKs, so call sites need no `#if`.
- Gating is not a reason to skip the ungated fixes. Safe-area margins, container-relative sizes,
  and trait-driven layout help every device, so ship them without a gate.

### One seam for the tab container

- Build every tab through **one factory** (for example `tabContainer(for:)`). On iOS 27.1+ it
  returns an arrangement-based container that wraps the tab's navigation controller. On older
  systems it returns the navigation controller unchanged.
- Once tabs can be containers, **every `as? UINavigationController` cast on
  `selectedViewController` or `viewControllers` silently fails.** Replace them all with one
  accessor (for example `tabNavigationController`) that unwraps either shape. Audit:
  - the tab bar controller delegate (`shouldSelect` / `didSelect`)
  - deep-link routing and "current screen" lookups
  - the "find the visible view controller" walker
  - language/theme reload loops over tabs
  - "pop back to an existing screen of type X" helpers, which must search the whole logical path
    and not just one pane's stack
- Forward status-bar style (`childForStatusBarStyle`) and vertical-bar behavior
  (`childForPreferredVerticalBarBehavior`) from the container to the pane that owns the
  chrome.

### Path-based pane routing

- Model each tab as **one ordered path** of view controllers. A host protocol (for example
  `SecondaryContentHosting`) owns `setPath(_:animated:)` and decides the split:
  - **Compact width:** the whole path goes in the primary navigation controller, which behaves
    exactly like before.
  - **Regular width:** the path is split after the last screen that opts in as a *primary pane
    screen*. Everything before that point stays leading; everything after opens trailing.
- Subclass the primary and secondary navigation controllers and route `push`, `pop`,
  `popTo`, `popToRoot`, and `setViewControllers` through the host when it's side by side.
  **This is the key win:** existing calls like `navigationController?.pushViewController(...)`
  become pane-aware with no change at the call site.
- Let screens opt in with small **marker protocols** instead of central type lists:
  - `PrimaryPaneScreen`: a list-like screen whose children open in the trailing pane.
  - `PaneCompanionProviding`: supplies default trailing content when nothing is selected, so
    the inner display never shows an empty half (the HIG's "show an extra level").
  - `PaneIdentifiable`: stops a push of the screen already shown in the trailing pane.
  - `PaneAloneObserving`: lets a screen restyle itself when it has the full width.
- **Re-split on trait change.** Register for `UITraitHorizontalSizeClass` and call
  `setPath(currentPath, animated: false)`. Folding or unfolding redistributes the *same*
  view-controller instances, so scroll position, input, and presenter state survive. This is the
  HIG's continuity requirement.
- Give the secondary pane's root a back item that pops into the primary pane. While side by side,
  hide the primary stack's own back buttons, because both panes are visible. Restore them when
  collapsing.
- **Vertical-bar ownership.** Return the pane that should own the vertical bar from
  `childForPreferredVerticalBarBehavior` (the trailing pane when it's open, otherwise the
  primary). Call `setNeedsUpdateOfVerticalBarConfiguration()` after every re-split. Set
  `verticalBarCompressionBehavior = .prefersBarItems` on the trailing pane's task screens, and
  give pane bar items `axisBehavior = .automatic`.
- Decide tab-bar visibility **in one place** from traits and stack depth: horizontal size class,
  whether a vertical bar is present, and how many screens are pushed. Don't scatter
  `hidesBottomBarWhenPushed` decisions.
- Debounce identical rapid pushes (for example, the same screen type within about 0.6 s).
  Re-splitting a path makes a double-tap push visible as a flashing pane.
- Pane-to-pane transitions are optional polish. If you animate them (slide forward, slide back,
  or cross-fade a snapshot), keep them under about 0.35 s, allow interaction during them, and use
  a cross-fade when **Reduce Motion** is on.

### Resizing fixes that recur on legacy screens

- **Pin horizontal margins to `safeAreaLayoutGuide`, not the superview.** A vertical bar adds an
  asymmetric leading or trailing inset. When the app has a shared "app layout guide" helper,
  fixing it there fixes most screens at once. Do the same for floating footer buttons.
- **Size from the container, never the screen.** Replace `UIScreen.main.bounds` or a
  `DeviceUtil.width`-style constant with the view's or table's current bounds. Banner heights
  derived from width must use the table's width. Background and overlay views that use frames
  need `autoresizingMask = .flexibleWidth`.
- **Paging collection views inside cells:** in `layoutSubviews`, refit `itemSize` to the new
  bounds **only when the width changed**. Then restore the same page index
  (`round(offset / oldWidth) * newWidth`). Invalidate grid layouts when the bounds size changes.
- **Round computed item sizes down** (`(width / 3).rounded(.down)`). Fractional widths that add
  up to slightly more than the container make the last column wrap at some widths.
- **Layer frames in `layoutSubviews`:** wrap them in `CATransaction.setDisableActions(true)`.
  Otherwise gradients and shadows animate implicitly and lag behind a fold.
- **Two-column dashboards at regular width:** keep **one presenter**. The view controller maps
  the presenter's sections onto two table views (leading and trailing), and every
  insert/reload/delete callback is routed to the table that shows that section. The presenter
  stays unaware of columns and never imports UIKit. Switch columns by activating pre-built
  constraint sets, and decide on `horizontalSizeClass == .regular`. If you need a width
  breakpoint (narrow Split View), measure the container's bounds, not the screen.
- **Custom tab-bar ornaments** (for example, a raised center scan button) can't follow the tab
  bar into the vertical bar. Hide the ornament when `traitCollection.hasVerticalBar` is true and
  give that tab item a real image, so it still shows in the vertical bar. Detect this with the
  trait, not with `tabBar.bounds.height > tabBar.bounds.width`.

### Workarounds (isolate, comment, and re-test on each SDK)

Some behavior in a custom two-pane container needs workarounds today. Keep each one in a single
named helper with a comment that explains which symptom it fixes, and delete it as soon as the
SDK fixes that symptom:

- **The vertical bar keeps the previous pane's items after a re-split.** First try
  `childForPreferredVerticalBarBehavior` together with
  `setNeedsUpdateOfVerticalBarConfiguration()`. Only if the bar still doesn't refresh, nudge it
  by briefly changing the top item's bar buttons and restoring them on the next run-loop turn.
- **The leading pane inherits the vertical bar's safe-area inset on its inner edge.** For each
  child, cancel the inherited inset on any edge that doesn't touch the window by setting
  `additionalSafeAreaInsets`. This assigns the inset only to the pane that actually sits next to
  the bar.

## Anti-Patterns

- ❌ Casting tab children with `as? UINavigationController` after tabs can be arrangement
  containers. Use a single unwrapping accessor.
- ❌ Rewriting every `pushViewController` call site to target a pane. Route through overridden
  navigation-controller methods instead.
- ❌ Building separate view-controller instances for the folded and unfolded layouts, which
  loses state on every fold.
- ❌ Hard-coded lists of "screens that open on the right". Use marker protocols on the screens.
- ❌ Margins pinned to the superview's leading/trailing edges, or sizes taken from
  `UIScreen.main.bounds` / a global width constant.
- ❌ Choosing column count with a magic pixel width when the size class answers the question.
- ❌ Detecting a vertical tab bar from its frame's aspect ratio instead of `verticalBarEdge`.
- ❌ A Duo-only API referenced outside `#if canImport(UIKit, _version:)` + `#available`, which
  breaks older-Xcode builds or crashes on older iOS.
- ❌ Undocumented vertical-bar or safe-area workarounds spread across screens.
- ❌ Pane transitions that ignore Reduce Motion or block touches while they run.

## Checklist

- [ ] All Duo-only code is behind `#if canImport(UIKit, _version:)` **and** `@available(iOS 27.1, *)`.
- [ ] Tabs are built through one container factory, and no `as? UINavigationController` cast on
      tab children remains.
- [ ] Deep links, visible-screen lookup, and "pop to existing screen" helpers search the logical
      path across both panes.
- [ ] `push`/`pop` from any screen lands in the right pane at regular width and in one stack at
      compact width.
- [ ] Fold/unfold re-splits the same view-controller instances, so scroll position, input, and
      selection survive.
- [ ] The trailing pane never shows empty: a companion screen or placeholder fills it.
- [ ] The pane that owns the vertical bar is returned from `childForPreferredVerticalBarBehavior`.
- [ ] Horizontal margins and floating buttons are pinned to `safeAreaLayoutGuide`.
- [ ] No sizes come from `UIScreen` or a global width constant. Paging cells keep their page
      across width changes.
- [ ] Every workaround lives in one commented helper.

Also see [`../../../checklists/iphone_duo_review.md`](../../../checklists/iphone_duo_review.md) and
[`../../../checklists/uikit_review.md`](../../../checklists/uikit_review.md).

## Swift Examples

> These snippets show the pattern, not a drop-in library. They use layout anchors per
> [`uikit_standards.md`](../../../standards/uikit_standards.md). In a SnapKit codebase, the same
> constraints written in SnapKit are equally correct.

### Two-level gate and a trait helper

```swift
// DuoAvailability.swift — the only place that knows the SDK's UIKit version.
extension UITraitCollection {
    /// `true` when the system shows a vertical bar (iPhone Duo, iOS 27.1+).
    var hasVerticalBar: Bool {
        #if canImport(UIKit, _version: 9127.0.85) // UIKit in the iOS 27.1 SDK
        if #available(iOS 27.1, *) {
            return verticalBarEdge != .unspecified
        }
        #endif
        return false
    }
}
```

### Tab container seam and unwrapping accessor

```swift
// TabBarViewController.swift
private func makeTab(for item: TabItem) -> UIViewController {
    let navigation = TabNavigationController(rootViewController: item.makeRoot())
    let tab = tabContainer(for: navigation)
    tab.tabBarItem = UITabBarItem(title: item.title, image: item.image, selectedImage: item.selectedImage)
    return tab
}

private func tabContainer(for navigation: TabNavigationController) -> UIViewController {
    #if canImport(UIKit, _version: 9127.0.85)
    if #available(iOS 27.1, *) {
        return TabArrangementViewController(primaryNavigationController: navigation)
    }
    #endif
    return navigation
}

// UIViewController+Pane.swift — replaces every `as? UINavigationController` on tab children.
extension UIViewController {
    var tabNavigationController: UINavigationController? {
        (self as? UINavigationController) ?? (self as? SecondaryContentHosting)?.primaryNavigationController
    }
}
```

### Host contract and marker protocols

```swift
// SecondaryContentHosting.swift
protocol SecondaryContentHosting: AnyObject {
    var primaryNavigationController: UINavigationController { get }
    var isShowingSideBySide: Bool { get }
    /// Leading stack + trailing stack, as one logical path.
    var pathViewControllers: [UIViewController] { get }
    func setPath(_ path: [UIViewController], animated: Bool)
}

/// A list-like screen whose children open in the trailing pane.
protocol PrimaryPaneScreen: UIViewController { }

/// Supplies default trailing content so the inner display never shows an empty pane.
protocol PaneCompanionProviding: UIViewController {
    func makePaneCompanion() -> UIViewController?
}

// Opt-in is one line per screen.
extension TransactionListViewController: PrimaryPaneScreen { }
```

### Pane-aware navigation controller (call sites unchanged)

```swift
final class TabNavigationController: UINavigationController {
    weak var paneHost: SecondaryContentHosting?

    private var sideBySideHost: SecondaryContentHosting? {
        guard let paneHost, paneHost.isShowingSideBySide else { return nil }
        return paneHost
    }

    override func pushViewController(_ viewController: UIViewController, animated: Bool) {
        guard let host = sideBySideHost else {
            super.pushViewController(viewController, animated: animated)
            return
        }
        host.setPath(viewControllers + [viewController], animated: animated)
    }

    @discardableResult
    override func popViewController(animated: Bool) -> UIViewController? {
        guard let host = sideBySideHost else { return super.popViewController(animated: animated) }
        let popped = topViewController
        host.setPath(Array(viewControllers.dropLast()), animated: animated)
        return popped
    }

    // Also override popToViewController, popToRootViewController, and setViewControllers.

    /// Used by the host to install a pane's stack without re-entering routing.
    func setPaneViewControllers(_ viewControllers: [UIViewController], animated: Bool) {
        super.setViewControllers(viewControllers, animated: animated)
    }
}
```

### Splitting the path and re-splitting on fold

```swift
@available(iOS 27.1, *)
final class TabArrangementViewController: UIArrangementViewController, SecondaryContentHosting {
    private let tabNavigation: TabNavigationController
    private let secondaryNavigation = SecondaryNavigationController()
    private var isSecondaryOpen = false

    var primaryNavigationController: UINavigationController { tabNavigation }
    var pathViewControllers: [UIViewController] {
        tabNavigation.viewControllers + (isSecondaryOpen ? secondaryNavigation.viewControllers : [])
    }

    init(primaryNavigationController: TabNavigationController) {
        tabNavigation = primaryNavigationController
        super.init()
        tabNavigation.paneHost = self
        secondaryNavigation.paneHost = self
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func viewDidLoad() {
        super.viewDidLoad()
        setViewController(tabNavigation, for: .primary)
        // Fold/unfold: redistribute the same instances, so state survives.
        registerForTraitChanges([UITraitHorizontalSizeClass.self]) { (self: Self, _) in
            self.setPath(self.pathViewControllers, animated: false)
        }
    }

    override var childForPreferredVerticalBarBehavior: UIViewController? {
        isSecondaryOpen ? secondaryNavigation : tabNavigation
    }

    var isShowingSideBySide: Bool { traitCollection.horizontalSizeClass == .regular }

    func setPath(_ path: [UIViewController], animated: Bool) {
        guard !path.isEmpty else { return }
        guard isShowingSideBySide, let start = Self.secondaryStart(of: path) else {
            layOut(primary: path, secondary: [], animated: animated)
            return
        }
        layOut(primary: Array(path.prefix(start)), secondary: Array(path.dropFirst(start)), animated: animated)
    }

    /// The trailing pane starts after the last primary-pane screen (or the root).
    private static func secondaryStart(of path: [UIViewController]) -> Int? {
        guard path.count > 1 else { return nil }
        let opener = path.indices.dropLast().last { $0 == 0 || path[$0] is PrimaryPaneScreen } ?? 0
        return opener + 1
    }

    private func layOut(primary: [UIViewController], secondary: [UIViewController], animated: Bool) {
        tabNavigation.setPaneViewControllers(primary, animated: false)
        secondaryNavigation.setPaneViewControllers(secondary, animated: false)
        isSecondaryOpen = !secondary.isEmpty
        setViewController(isSecondaryOpen ? secondaryNavigation : nil, for: .secondary, animated: false)
        updateArrangement(isSecondaryOpen ? .split.axes(.horizontal) : Self.fullWidth, animated: animated)
        setNeedsUpdateOfVerticalBarConfiguration()
    }

    private static var fullWidth: UISplitArrangement {
        var arrangement = UISplitArrangement.split.axes(.horizontal)
        var properties = arrangement.defaultViewProperties
        properties.width.preferred = .fractional(1)
        properties.width.maximum = .fractional(1)
        arrangement.setViewProperties(properties, for: .primary)
        return arrangement
    }
}
```

### Safe-area margins in a shared layout guide

```swift
// Before: leading/trailing pinned to the superview, so content slides under a vertical bar.
// After: pinned to the safe area, which includes the asymmetric vertical-bar inset.
NSLayoutConstraint.activate([
    guide.leadingAnchor.constraint(equalTo: safeAreaLayoutGuide.leadingAnchor, constant: Spacing.screen),
    guide.trailingAnchor.constraint(equalTo: safeAreaLayoutGuide.trailingAnchor, constant: -Spacing.screen),
    guide.topAnchor.constraint(equalTo: topAnchor),
    guide.bottomAnchor.constraint(equalTo: bottomAnchor)
])
```

### Paging cell that keeps its page across a fold

```swift
override func layoutSubviews() {
    super.layoutSubviews()
    guard let layout = collectionView.collectionViewLayout as? UICollectionViewFlowLayout else { return }
    let pageWidth = collectionView.bounds.width
    guard pageWidth > 0, layout.itemSize.width != pageWidth else { return }

    let oldWidth = layout.itemSize.width
    let page = oldWidth > 0 ? Int((collectionView.contentOffset.x / oldWidth).rounded()) : 0
    layout.itemSize.width = pageWidth
    layout.invalidateLayout()
    collectionView.layoutIfNeeded()
    collectionView.contentOffset.x = CGFloat(page) * pageWidth
}
```

### Two columns from one presenter

```swift
// HomeView.swift — both constraint sets are built once in init(frame:).
func setTwoColumns(_ isTwoColumns: Bool) {
    widgetsTableView.isHidden = !isTwoColumns
    NSLayoutConstraint.deactivate(isTwoColumns ? singleColumnConstraints : twoColumnConstraints)
    NSLayoutConstraint.activate(isTwoColumns ? twoColumnConstraints : singleColumnConstraints)
}

// HomeViewController.swift — the presenter still speaks in its own section indexes.
override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    let isTwoColumns = traitCollection.horizontalSizeClass == .regular
    guard isTwoColumns != self.isTwoColumns else { return }
    self.isTwoColumns = isTwoColumns
    customView.setTwoColumns(isTwoColumns)
    reloadBothTables()
}

func sectionDidReload(_ sections: IndexSet, with animation: UITableView.RowAnimation) {
    forEachTable(showing: sections) { $0.reloadSections($1, with: animation) }
}
```

## Common Interview Questions

- Why does wrapping a tab's navigation controller in an arrangement container break deep links,
  and how do you find every affected call site?
- How do you make dozens of existing `pushViewController` call sites pane-aware without changing
  them?
- What state must survive a fold, and why does redistributing the same view-controller instances
  preserve it?
- Why gate with both `canImport(_version:)` and `#available`? What does each one protect?
- How do you keep a presenter unaware of a two-column layout?
- When would you choose `UISplitViewController` over custom path routing?

## AI Implementation Notes

- Load [`iphone_duo_adaptive_layout.md`](iphone_duo_adaptive_layout.md) first. This skill is the
  UIKit integration layer on top of it.
- **Audit greps** for a UIKit retrofit: `as? UINavigationController`,
  `selectedViewController as?`, `UIScreen.main`, `DeviceUtil.width` (or similar width
  constants), `.leading.trailing.equalTo(`, `leadingAnchor.constraint(equalTo: leadingAnchor`,
  `userInterfaceIdiom`, `bounds.height > bounds.width`.
- Match the project's house style. If it uses SnapKit, a `BaseView`/`BaseViewController`, and
  `// MARK: -` extensions per concern, write the Duo code the same way. Group it in an
  `extension <Screen>ViewController { // iPhone Duo }` block or a dedicated file.
- Presenters never learn about panes, columns, folds, or bars. Only the view controller and the
  view adapt (see [`uikit_standards.md`](../../../standards/uikit_standards.md)).
- Keep the pane infrastructure in its own folder (for example `UI/Home/Tab Bar/`) so it can be
  swapped for `UISplitViewController` later without touching feature screens.
- Ship incrementally: first the gate and seam with no visual change, then the margin and sizing
  fixes, then pane routing, and finally one `PrimaryPaneScreen` opt-in per PR.
- Related: [`iphone_duo_swiftui_patterns.md`](iphone_duo_swiftui_patterns.md) (the SwiftUI
  counterpart), [`uikit_view_layer.md`](uikit_view_layer.md),
  [`../../../workflows/prepare_app_for_iphone_duo.md`](../../../workflows/prepare_app_for_iphone_duo.md).
