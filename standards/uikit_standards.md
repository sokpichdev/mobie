---
platform: ios
ui: uikit
---

# Standard: UIKit Standards

Rules for programmatic UIKit + MVP screens on legacy targets (iOS 13+). Complements
[`coding_standards.md`](coding_standards.md) and [`architecture_standards.md`](architecture_standards.md).

## Screen Structure

The four-file convention is mandatory for every screen:

- **`<Name>Contract.swift`** — holds the view and presenter protocols, and nothing else.
- **`<Name>View.swift`** — a `UIView` subclass owning all layout and subviews.
- **`<Name>ViewController.swift`** — owns lifecycle and forwards to the presenter.
- **`<Name>Presenter.swift`** — has no `UIKit` import.

```swift
// ProfileContract.swift
protocol ProfileViewProtocol: AnyObject {
    func display(name: String)
    func showError(_ message: String)
}

protocol ProfilePresenterProtocol: AnyObject {
    func viewDidLoad()
    func didTapSave()
}
```

## Layout

- Programmatic only; Interface Builder is permitted for the launch screen and nothing else.
- Build constraints once in the view's initializer, never in `layoutSubviews`.
- Set `translatesAutoresizingMaskIntoConstraints = false` on every added subview.
- Prefer layout guides over magic numbers.

```swift
private func setUpConstraints() {
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    addSubview(titleLabel)

    NSLayoutConstraint.activate([
        titleLabel.topAnchor.constraint(equalTo: safeAreaLayoutGuide.topAnchor, constant: 16),
        titleLabel.leadingAnchor.constraint(equalTo: layoutMarginsGuide.leadingAnchor),
        titleLabel.trailingAnchor.constraint(equalTo: layoutMarginsGuide.trailingAnchor)
    ])
}
```

## Adaptive Layout (iPhone Duo)

Screens must resize across the iPhone Duo outer display (compact width) and inner display
(regular width), and when folded or in Split View. Full guidance:
[`skills/ui/ios/iphone_duo_adaptive_layout.md`](../skills/ui/ios/iphone_duo_adaptive_layout.md).

- Never use `UIDevice.userInterfaceIdiom`, `UIInterfaceOrientation`, or `UIScreen` bounds for
  layout decisions. Track `horizontalSizeClass`/`verticalSizeClass` with automatic trait tracking
  and lay out against the view's bounds.
- Pin content to `safeAreaLayoutGuide`/`layoutMarginsGuide`. A vertical bar adds an asymmetric
  leading or trailing inset.
- Put bar items on `navigationItem` (hosted by a `UINavigationController`). Never build a custom
  `UIToolbar`/`UINavigationBar`/`UITabBar`, because those can't move to the vertical bar.
- Create items with both a title and an image (`UIBarButtonItem(title:image:primaryAction:)`).
  Pin Done in `pinnedTrailingGroup`, group items in `UIBarButtonItemGroup`, set
  `visibilityPriority`, and put rare actions in `additionalOverflowItems`.
- Prefer `UISplitViewController` and `UIArrangementViewController` for two-pane content. Custom
  views avoid active regions from `reservedRegions(kind:)` by updating constraint constants,
  never by creating constraints in `layoutSubviews`.
- Override `preferredVerticalBarBehavior` to return `.disabled` only for full-screen,
  non-scrolling UI.

## View Controller Lifecycle

- One-time setup happens in `viewDidLoad`; anything that must repeat on re-entry goes in
  `viewWillAppear`.
- Never start network work from `init`.
- Never put business rules in a lifecycle method — forward to the presenter.

## Cells and Reuse

- Register cell classes by type, never by string literal.
- Implement `prepareForReuse` for any cell holding mutable state or an in-flight image load.
- Prefer `UITableViewDiffableDataSource` / `UICollectionViewDiffableDataSource` (available from
  iOS 13) over manual `reloadData()`.

## Presenters

- Mark `@MainActor`.
- Hold the view `weak`.
- Expose state as `private(set)`.
- Accept every dependency through the initializer as a protocol.

```swift
@MainActor
final class ProfilePresenter: ProfilePresenterProtocol {
    private weak var view: ProfileViewProtocol?
    private let repository: ProfileRepositoryProtocol
    private(set) var state: ProfileState = .idle

    init(view: ProfileViewProtocol, repository: ProfileRepositoryProtocol) {
        self.view = view
        self.repository = repository
    }

    func viewDidLoad() {
        Task { await load() }
    }

    func didTapSave() {}

    private func load() async {
        // fetch via repository, then update state and call the view
    }
}
```

## Accessibility

- Set `accessibilityLabel` on every interactive control.
- Set `accessibilityIdentifier` on anything a UI test drives.
- Support Dynamic Type with `UIFont.preferredFont(forTextStyle:)` and
  `adjustsFontForContentSizeCategory = true`.

## Related

- [`../skills/architecture/ios/mvp.md`](../skills/architecture/ios/mvp.md)
- [`../skills/ui/ios/uikit_view_layer.md`](../skills/ui/ios/uikit_view_layer.md)
- [`../skills/ui/ios/iphone_duo_adaptive_layout.md`](../skills/ui/ios/iphone_duo_adaptive_layout.md)
- [`../checklists/uikit_review.md`](../checklists/uikit_review.md)
- [`../checklists/iphone_duo_review.md`](../checklists/iphone_duo_review.md)
