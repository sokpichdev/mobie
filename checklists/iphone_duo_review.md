---
platform: ios
---

# Checklist: iPhone Duo & Adaptive Layout Review

Review gate for any iOS UI change once the app targets iPhone Duo. It applies to both SwiftUI and
UIKit. Tag findings Critical/High/Medium/Low/Nit, and block on Critical/High. Source of truth:
[HIG — Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
and
[Preparing your app for iPhone Duo](https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo).
How-to: [`skills/ui/ios/iphone_duo_adaptive_layout.md`](../skills/ui/ios/iphone_duo_adaptive_layout.md).

## Build (Critical)

- [ ] Built with Xcode 27.1 or later. Xcode 26 builds don't extend under the status bar and
      camera.

## Resizing (Critical/High)

- [ ] No layout decision reads `userInterfaceIdiom`, `UIInterfaceOrientation`, the device model,
      or `UIScreen` bounds.
- [ ] Layout is driven by size classes and the container's or scene's bounds, with no fixed
      widths or heights sized to a specific iPhone.
- [ ] Content respects layout margins and safe-area insets, including the **asymmetric**
      leading or trailing inset a vertical bar adds.
- [ ] Screen renders correctly on the outer display, inner portrait, inner landscape, partially
      folded, and inner-display Split View.
- [ ] Opening, closing, and folding keep state: scroll position, selection, drafts, navigation
      path, and playback.
- [ ] Every control and piece of content is reachable in every pose. Overflowed items are still
      reachable through the overflow menu.

## Reserved Regions (High)

- [ ] No interactive control, text, or essential content sits under an active fold (`.division`)
      or a camera (`.occlusion`).
- [ ] Custom layouts query `reservedRegions(kind:…)` rather than hard-coding hinge or camera
      coordinates.
- [ ] Grids use an even column count when divided by the fold.
- [ ] Right-to-left layout verified. Reserved-region mirroring (`layoutDirectionBehavior`) is used
      correctly.
- [ ] Fold transitions make small adjustments, with no dramatic rearrangement.

## Bars & Toolbars (High/Medium)

- [ ] Bars come from navigation containers (`.toolbar` in `NavigationStack`/`NavigationSplitView`,
      or `navigationItem` in UIKit). There are no custom `UIToolbar`/`UITabBar`/`UINavigationBar`
      bars.
- [ ] Every non-text toolbar item has **both** a title and a symbol. No item that must appear
      vertically uses a custom view or is text-only.
- [ ] Order: Back/Close first, then prominent actions (Done pinned via `.topBarPinnedTrailing` /
      `pinnedTrailingGroup`).
- [ ] Related items grouped with `ToolbarItemGroup` / `UIBarButtonItemGroup`, with no manual
      spacers.
- [ ] Visibility priorities set: frequent and badged items `.high`, rare items `.low`.
- [ ] Custom overflow menus moved into `ToolbarOverflowMenu` / `additionalOverflowItems`. The
      ellipsis symbol is used only for overflow.
- [ ] Compression behavior fits the screen: the tab bar is kept for navigation-focused screens,
      and toolbar items are kept (`prefersToolbarItems` / `prefersBarItems`) for task-focused
      screens.
- [ ] Any `.horizontalOnly` axis behavior is intentional. The item is hidden when there's no
      horizontal bar.
- [ ] Controls for a non-trailing pane stay with that pane.
- [ ] Vertical bars are disabled only for full-screen, non-scrolling UI, as a stable choice that
      isn't toggled by view state.

## Containers & Presentation (Medium)

- [ ] System containers (split views, tab views, navigation stacks, arrangement views) are
      preferred over custom containers.
- [ ] Arrangement views aren't nested in a `List`, `ScrollView`, or split-view column, and
      navigation wraps them.
- [ ] Sheet placement (`presentationPlacement` / `preferredPlacement`) chosen deliberately on the
      inner display.
- [ ] Hero and background images extend under the vertical bar (`backgroundExtensionEffect` /
      `UIBackgroundExtensionView`).

## Camera (High, if the app captures media)

- [ ] The capture device is selected by facing direction and re-evaluated when the app changes
      display.
- [ ] Preview and orientation stay correct after opening or closing mid-capture.

## Accessibility & Tests

- [ ] Largest Dynamic Type size verified on the **outer** display (shortest height) with vertical
      bars.
- [ ] VoiceOver order stays logical when bars move to the side and panes split at the fold.
- [ ] UI tests locate elements by accessibility identifier, never by coordinates, because
      positions change per pose.
- [ ] Previews or snapshots cover compact (outer) and regular (inner) size classes.

## Verdict

- [ ] Verdict recorded: Approve / Approve-with-nits / Request-changes.
- [ ] Every Critical/High finding has a file:line reference, the pose where it reproduces, and a
      concrete fix.
