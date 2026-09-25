---
platform: ios
---

# Skill: iPhone Duo & Adaptive Layout

## Overview

iPhone Duo (announced September 9, 2026) is Apple's first foldable iPhone. It has a compact
**outer display** (used when closed) and a large **inner display** (used when open), each with
its own front camera, joined by a center hinge. As the device opens, closes, partially folds,
and rotates, the app moves between displays and changes size many times per session. The
guidance below is distilled from Apple's official sources — treat those as the source of truth
and re-check them when the SDK changes:

- HIG: [Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- Technology Overview: [Preparing your app for iPhone Duo](https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo)
- Hub: [Get ready for iPhone Duo](https://developer.apple.com/iphone-duo/) — requires **Xcode 27.1** (iOS 27.1 SDK)

Four concepts define the platform:

1. **Resizing is the core requirement.** Size classes are the fundamentals: **compact width on
   the outer display, regular width on the inner display**. Split View multitasking on the inner
   display adds more sizes. An app that already resizes well on iPad, on Mac, or in iPhone
   Mirroring is most of the way there.
2. **Reserved regions** are areas that content avoids or that components adapt around. There are
   two kinds: **occlusions** (the outer front camera, which is always present and expands into
   the Dynamic Island, and the inner camera, which is only present while active) and
   **divisions** (the folding region, active only when the device is partially open). A region
   can be active or inactive.
3. **Vertical bars.** In most poses, the system moves the status bar, Dynamic Island area,
   toolbar, navigation controls, and tab bar into a **vertical bar on the side of the display**
   to save vertical space. The exception is the inner display in portrait, which keeps standard
   horizontal bars. Vertical bars stay aligned with the hardware: they keep their position in
   right-to-left languages, and in Split View each app places its bar on its outer edge.
4. **Arrangement views** (`ArrangementView` / `UIArrangementViewController`) are containers for
   a primary and a secondary view. They re-lay out automatically for size, orientation, and the
   fold, in two styles: **split** and **overlay**.

Build with Xcode 27.1 or later. **An app built with Xcode 26 or earlier doesn't extend under
the status bar and camera** on iPhone Duo, so it doesn't use the full display.

## Use Cases

- Auditing an existing iOS app for iPhone Duo readiness (both paradigms).
- Building a new screen that must resize across the outer display, the inner display, the fold,
  and Split View.
- Custom layouts (canvases, grids, media players, games) that must stay clear of the fold or
  the cameras.
- Organizing toolbars and tab bars so the right items survive in a vertical bar and the
  overflow menu.
- Camera apps that must follow the active camera as the device moves between displays.

## Best Practices

### Resizing & layout

- **Prefer system containers.** `NavigationSplitView` / `UISplitViewController`, `TabView` /
  `UITabBarController`, `NavigationStack` / `UINavigationController`, and arrangement views
  handle the outer display, the open and folded inner display, and camera occlusions
  automatically. Alerts, context menus, and sheets move around the fold on their own.
- **Base layout decisions on size classes and container bounds**, never on the device. Size
  views relative to their container, not to fixed iPhone dimensions. Calculate from the scene's
  or containing view's bounds, not from `UIScreen` dimensions.
- **UIKit: don't use `UIDevice.userInterfaceIdiom` or `UIInterfaceOrientation` for layout
  decisions.** Use Auto Layout and automatic trait tracking of `horizontalSizeClass` and
  `verticalSizeClass` (Apple states this rule explicitly).
- **Lay out with layout margins and safe area insets.** Vertical bars add a leading or trailing
  safe-area inset, so content space is **asymmetric**. Never hard-code symmetric horizontal
  padding in place of the safe area.
- **Keep one information hierarchy on both displays.** Show an extra level on the inner display
  when it helps. For example, Mail shows a list *or* a message when closed, and both side by
  side when open. Keep functionality and state the same across displays and poses.
- **Make small adjustments, not dramatic rearrangements**, when the device folds. Controls that
  jump or disappear are hard to find again.
- **In grids, prefer an even number of columns** so content divides cleanly at the fold.
- **Games:** you may lock orientation, but you must fill the screen in every pose. Prefer
  changing the aspect ratio to letterboxing. If you can't avoid letterboxing, add artwork to the
  padding.

### Reserved regions (custom views only)

- System components adapt on their own. Query reserved regions **only in custom layouts** that
  place content where the fold or a camera could land.
- SwiftUI: use `GeometryReader` →
  `proxy.reservedRegions(kind: .division | .occlusion, options:, layoutDirectionBehavior:)` →
  `[ReservedRegion]`. The default `layoutDirectionBehavior` is `.mirrors`, which flips regions
  for right-to-left layouts. Use `.fixed` only when you mirror frames yourself.
- UIKit: `view.reservedRegions(kind:options:)` → `[UIView.ReservedRegion]`.
- Each region exposes `frame` (including margins), `margins`, `isActive`, `kind`, and `id`.
  **Always filter on `isActive` before avoiding a region.** Pass `options: .includeInactive`
  when you also want inactive ones, for example to reserve space before the fold appears.

### Arrangement views

- Use a **split** arrangement when the layout is already an `HStack`/`VStack` of two peers
  (for example, now playing and lyrics). It splits horizontally when the container is wider than
  tall and vertically when it's taller than wide. Constrain the direction with
  `.split.axes(.horizontal)`.
- Use an **overlay** arrangement when the layout is already a `ZStack` (for example, player
  controls over video). When closed or fully open, the primary view sits on top. When partially
  folded, the views move to either side of the fold, with the primary view placed trailing or
  bottom.
- **Keep navigation outside the arrangement view.** Wrap it in `NavigationSplitView`, `TabView`,
  and similar containers. Never nest it in a `NavigationSplitView` column, `List`, or
  `ScrollView`, where part of it can become unreachable.

### Vertical bars & toolbars

- **Use the bars that navigation containers provide.** In SwiftUI, apply `.toolbar {}` inside a
  `NavigationStack` / `NavigationSplitView`. In UIKit, set items on a view controller's
  `navigationItem`. A custom `UIToolbar` / `UINavigationBar` / `UITabBar` **won't be presented
  vertically**.
- **Give every non-text item both a title and a symbol** (SwiftUI `Label`, or
  `UIBarButtonItem(title:image:…)`). Vertical bars use the icon, horizontal bars prefer the
  icon, and the overflow menu uses both. **An item with a title but no icon, or with a custom
  view, never appears in a vertical bar.** Keep text-only buttons to a minimum.
- **Order: navigation first.** The top of the vertical bar is for Back or Close, followed by
  prominent actions like Done. Use `.topBarPinnedTrailing` (SwiftUI) or
  `navigationItem.pinnedTrailingGroup` (UIKit) for Done. Use `.cancellationAction` (SwiftUI) or
  `leadingItemGroups` (UIKit) for a custom Back or Close button.
- **Group, don't space.** `ToolbarItemGroup` / `UIBarButtonItemGroup` add spacing and adapt it
  automatically. Don't add fixed spacers.
- **Set overflow priority.** Items overflow bottom to top by default. Set
  `.visibilityPriority(.high/.low)` (SwiftUI) or `visibilityPriority` (UIKit), first on groups
  and then on items. Keep frequent actions (Compose, New Note) and badged items visible longest.
- **Use the system overflow menu.** Move your custom "…" menu into `ToolbarOverflowMenu`
  (SwiftUI) or `navigationItem.additionalOverflowItems` (UIKit). Reserve the ellipsis symbol for
  overflow.
- **Control which axis an item can use** with `.axisBehavior(.automatic | .horizontalOnly |
  .verticalPreferred)` (SwiftUI) or `UIBarButtonItem.axisBehavior` (UIKit). A `.horizontalOnly`
  item is **hidden** when no horizontal bar is present.
- **Choose what compresses first.** Navigation-focused screens keep the tab bar (the default).
  Task-focused screens keep toolbar items: use
  `.toolbarVerticalCompressionBehavior(.prefersToolbarItems)` (SwiftUI) or
  `navigationItem.verticalBarCompressionBehavior = .prefersBarItems` (UIKit).
- **Keep controls near the content they affect.** Controls for a leading pane stay at the top of
  that pane. Don't move them into the trailing vertical bar.
- **Don't override the default bar placement in general.** Opt out with
  `.toolbarVerticalBehavior(.disabled)` or `preferredVerticalBarBehavior = .disabled` only for
  full-screen, non-scrolling UIs (video player, calculator-style layouts). Make it a stable
  choice, never toggled by view state. To *hide* bars, use the visibility APIs instead.
- **Custom floating UI:** read `@Environment(\.toolbarVerticalEdge)` (a `HorizontalEdge?`, `nil`
  when no vertical bar is used) or `traitCollection.verticalBarEdge` (UIKit), and place custom
  bars relative to it.
- **Hero and background images:** extend them under the vertical bar with
  `.backgroundExtensionEffect()` (SwiftUI) or `UIBackgroundExtensionView` (UIKit), and keep
  scrolling content inset.

### Presentation contexts

- **Inspectors** always use horizontal bars.
- **Split views:** the sidebar and content columns use horizontal bars; the detail column uses
  a vertical bar.
- **Sheets on the outer display** use vertical bars by default. Opt out with
  `toolbarVerticalBehavior(.disabled)` / `preferredVerticalBarBehavior`. **Sheets on the inner
  display** use a horizontal bar when centered or leading and a vertical bar when trailing. Set
  the placement with `.presentationPlacement(.leading/.trailing)` (SwiftUI) or
  `UISheetPresentationController.preferredPlacement` (UIKit).

### Camera

- iPhone Duo has three capture cameras: outer front, inner front, and rear. When the device opens
  or closes, the app can change display, and **the camera in use may now face the opposite
  direction**. Select the camera by the direction it faces, per
  [Choosing a camera by the direction it faces](https://developer.apple.com/documentation/avkit/choosing-a-camera-by-the-direction-it-faces).
  Don't hard-code a single `AVCaptureDevice`.
- To show content on the outer display while capturing with the rear camera and the device fully
  open, see
  [Registering a camera capture accessory on iPhone Duo](https://developer.apple.com/documentation/avfoundation/registering-a-camera-capture-accessory-on-iphone-duo).

## Anti-Patterns

- ❌ Branching layout on `UIDevice.current.userInterfaceIdiom`, `UIInterfaceOrientation`, a
  model identifier, or `UIScreen.main.bounds`.
- ❌ Fixed widths or heights sized to a specific iPhone, or a hard-coded "phone vs. tablet" split.
- ❌ Custom `UIToolbar`/`UITabBar`/`UINavigationBar` or hand-rolled SwiftUI bars that can't move
  to the vertical axis.
- ❌ Symbol-only buttons with no title (they're unlabeled in the overflow menu), or text-only
  buttons (they can never appear in a vertical bar).
- ❌ A custom "…" overflow menu alongside the system one.
- ❌ Fixed spacers between toolbar items instead of groups.
- ❌ Disabling vertical bars app-wide to avoid the redesign, or toggling the behavior per view
  state.
- ❌ Interactive controls, text, or a grid seam centered under the fold. Odd column counts that
  split an item across the hinge.
- ❌ Assuming symmetric horizontal safe-area insets.
- ❌ Re-architecting the screen when the display changes, or losing scroll position, selection,
  or draft text on open or close.
- ❌ An arrangement view nested in a `List`, `ScrollView`, or split-view column, or wrapping
  navigation.
- ❌ Keeping a camera session bound to a single `AVCaptureDevice` across display changes.
- ❌ Shipping an iPhone Duo build compiled with Xcode 26 or earlier.

## Checklist

- [ ] Built with Xcode 27.1+ (content extends under the status bar and camera).
- [ ] No layout logic depends on idiom, orientation, device model, or screen bounds. Only size
      classes and container geometry are used.
- [ ] Every screen verified closed, fully open (portrait and landscape), partially folded, and in
      Split View on the inner display, in both LTR and RTL.
- [ ] State (scroll position, selection, drafts, navigation path) survives open, close, and fold
      transitions.
- [ ] Bars come from navigation containers and appear vertically where the system expects.
- [ ] Every non-text toolbar item has both a title and a symbol. Frequent and badged items have
      `.high` visibility priority. Overflow uses the system menu.
- [ ] Back/Close is first and Done is pinned. Items are grouped, with no manual spacing.
- [ ] Compression behavior matches the screen's purpose (navigation vs. task).
- [ ] Custom layouts avoid active `.division` and `.occlusion` reserved regions. Grids use even
      column counts.
- [ ] Nothing interactive or essential sits under the fold or behind a camera.
- [ ] Any vertical-bar opt-out is limited to full-screen, non-scrolling UI and doesn't change with
      state.
- [ ] Camera features re-select the device by facing direction after display changes.

Also see [`../../../checklists/iphone_duo_review.md`](../../../checklists/iphone_duo_review.md).

## Swift Examples

> Example snippets use the iOS 27.1 SDK APIs named in Apple's documentation. Gate them with
> `if #available(iOS 27.1, *)` when the deployment target is lower.

### SwiftUI — toolbar organized for vertical bars

```swift
struct NoteEditorView: View {
    @State private var viewModel: NoteEditorViewModel

    var body: some View {
        NoteEditorContent(viewModel: viewModel)
            .toolbar {
                // Prominent action pinned below Back at the top of the vertical bar.
                ToolbarItem(placement: .topBarPinnedTrailing) {
                    Button("Done", systemImage: "checkmark") { viewModel.done() }
                }

                // Related actions grouped — the system manages spacing.
                ToolbarItemGroup(placement: .bottomBar) {
                    Button("Checklist", systemImage: "checklist") { viewModel.insertChecklist() }
                    Button("Attach", systemImage: "paperclip") { viewModel.attach() }
                }
                .visibilityPriority(.low)

                ToolbarItem(placement: .bottomBar) {
                    Button("New Note", systemImage: "square.and.pencil") { viewModel.newNote() }
                }
                .visibilityPriority(.high) // frequent action survives longest

                // Rarely used actions always live in the system overflow menu.
                ToolbarOverflowMenu {
                    Button("Export PDF", systemImage: "doc.richtext") { viewModel.exportPDF() }
                    Button("Print", systemImage: "printer") { viewModel.print() }
                }
            }
            // Task-focused screen: keep toolbar items, minimize the tab bar.
            .toolbarVerticalCompressionBehavior(.prefersToolbarItems)
    }
}
```

### SwiftUI — adapt to the fold with an arrangement view

```swift
struct PlayerScreen: View {
    let viewModel: PlayerViewModel

    var body: some View {
        // Navigation containers wrap the arrangement, never the reverse.
        NavigationStack {
            ArrangementView {
                PlayerControls(viewModel: viewModel)   // primary
            } secondary: {
                VideoSurface(player: viewModel.player) // secondary
            }
            .arrangementViewStyle(.overlay) // controls over video; splits at the fold
        }
    }
}
```

### SwiftUI — custom grid that avoids the fold

```swift
struct GalleryGrid: View {
    let photos: [Photo]

    var body: some View {
        GeometryReader { proxy in
            let fold = proxy.reservedRegions(kind: .division).first(where: \.isActive)
            // Even column count so the hinge falls between items, not through one.
            let columns = Array(repeating: GridItem(.flexible()), count: fold == nil ? 4 : 6)

            ScrollView {
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(photos) { PhotoCell(photo: $0) }
                }
                .padding(.horizontal)
            }
        }
    }
}
```

### UIKit — bar items for vertical presentation

```swift
// NoteEditorViewController.swift — items live on navigationItem, never a custom UIToolbar.
override func viewDidLoad() {
    super.viewDidLoad()
    presenter.onViewDidLoad()

    let done = UIBarButtonItem(
        title: String(localized: "Done"),
        image: UIImage(systemName: "checkmark"),
        primaryAction: UIAction { [weak self] _ in self?.presenter.didTapDone() }
    )
    navigationItem.pinnedTrailingGroup = UIBarButtonItemGroup(barButtonItems: [done], representativeItem: nil)

    let newNote = UIBarButtonItem(
        title: String(localized: "New Note"),
        image: UIImage(systemName: "square.and.pencil"),
        primaryAction: UIAction { [weak self] _ in self?.presenter.didTapNewNote() }
    )
    newNote.visibilityPriority = .high

    let formatting = UIBarButtonItem(
        title: String(localized: "Format"),
        image: UIImage(systemName: "textformat"),
        primaryAction: UIAction { [weak self] _ in self?.presenter.didTapFormat() }
    )
    formatting.visibilityPriority = .low

    navigationItem.trailingItemGroups = [
        UIBarButtonItemGroup(barButtonItems: [newNote, formatting], representativeItem: nil)
    ]
    navigationItem.additionalOverflowItems = UIDeferredMenuElement.uncached { [weak self] completion in
        completion(self?.presenter.overflowActions() ?? [])
    }
    navigationItem.verticalBarCompressionBehavior = .prefersBarItems
}
```

### UIKit — arrangement view controller

```swift
let arrangement = UIArrangementViewController()
arrangement.setViewController(nowPlayingVC, for: .primary)
arrangement.setViewController(lyricsVC, for: .secondary)
// Side by side only; the secondary view is not stacked below in tall layouts.
arrangement.updateArrangement(.split.axes(.horizontal))
navigationController.pushViewController(arrangement, animated: true)
```

### UIKit — keep a custom control clear of reserved regions

```swift
// CanvasView.swift — constraints are built once in init; only constants change here.
override func layoutSubviews() {
    super.layoutSubviews()
    let blocked = (reservedRegions(kind: .division) + reservedRegions(kind: .occlusion))
        .filter(\.isActive)
    let paletteFrame = paletteDefaultFrame()
    if let hit = blocked.first(where: { $0.frame.intersects(paletteFrame) }) {
        paletteLeadingConstraint.constant = hit.frame.maxX - bounds.minX + 8
    } else {
        paletteLeadingConstraint.constant = defaultPaletteInset
    }
}
```

## Common Interview Questions

- What makes an app "ready" for iPhone Duo, and why do size classes matter more than device
  checks?
- What's the difference between an occlusion and a division reserved region, and when is each
  active?
- Why won't a custom `UIToolbar` move to the vertical bar, and how do you fix it?
- Why must toolbar items have both a title and a symbol?
- When would you choose a split arrangement over an overlay arrangement?
- When is it acceptable to disable vertical bars?
- How should a camera app behave when the user opens the device mid-capture?

## AI Implementation Notes

- Treat Apple's HIG and Technology Overview (linked in [Overview](#overview)) as authoritative.
  If an API here doesn't compile against the project's SDK, check the current documentation
  rather than guessing a replacement.
- When auditing, search first for `userInterfaceIdiom`, `UIScreen.main`,
  `interfaceOrientation`, custom `UIToolbar`/`UITabBar`/`UINavigationBar` subclasses, fixed
  `frame(width:)`/`widthAnchor.constraint(equalToConstant:)` values on screen-level containers,
  and toolbar buttons missing a title or symbol.
- Reach for system containers and arrangement views before custom reserved-region math.
- Keep adaptive-layout logic in the view layer (the SwiftUI `View`, or the UIKit `<Screen>View`).
  ViewModels and presenters stay unaware of displays, folds, and bars. A presenter never imports
  UIKit, so it can't know about reserved regions.
- In UIKit, create constraints once in `init(frame:)` per
  [`uikit_view_layer.md`](uikit_view_layer.md). Reserved-region adaptation only updates
  `constant`s or activates pre-built constraint sets.
- Related: [`../../../standards/swiftui_standards.md`](../../../standards/swiftui_standards.md),
  [`../../../standards/uikit_standards.md`](../../../standards/uikit_standards.md),
  [`../../../workflows/prepare_app_for_iphone_duo.md`](../../../workflows/prepare_app_for_iphone_duo.md),
  [`../../../checklists/iphone_duo_review.md`](../../../checklists/iphone_duo_review.md).
