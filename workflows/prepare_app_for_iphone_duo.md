# Workflow: Prepare an App for iPhone Duo

Audit-and-fix procedure for making an existing iOS app (SwiftUI, UIKit, or mixed) resize, fold,
and present bars correctly on iPhone Duo. It follows Apple's
[Preparing your app for iPhone Duo](https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo)
and the
[HIG](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo).

## Objective

Make every screen work on the outer display, the inner display (portrait and landscape), when
partially folded, and in Split View, with correct vertical bars and no content under the fold or
cameras. Ship this incrementally, one screen or flow per PR.

## Inputs

- The iOS project and its detected UI paradigm (`swiftui` / `uikit` / `mixed`, per
  [`AGENTS.md`](../AGENTS.md#platform--paradigm-scoping)).
- Xcode 27.1 or later with the iPhone Duo simulator (Device Hub), or a physical device.
- List of top user flows, ranked by traffic.

## Outputs

- Audit report: a per-screen findings table (screen × pose → issue, severity).
- Fix PRs per screen or flow, each passing
  [`checklists/iphone_duo_review.md`](../checklists/iphone_duo_review.md).
- Updated previews, snapshots, and UI tests that cover compact (outer) and regular (inner) size
  classes.
- Release notes and App Store screenshots for iPhone Duo display sizes, when App Store Connect
  accepts them.

## Step-by-Step Process

1. **Toolchain.** *(DevOps Expert)* Move CI and local builds to Xcode 27.1+. Builds from Xcode 26
   or earlier don't extend under the status bar and camera.
2. **Baseline audit.** *(UI Expert)* Run each top flow in the iPhone Duo simulator. Check every
   view, sheet, and popover closed, fully open (rotate in both orientations), partially folded,
   and in Split View. Record: views that resize poorly, bars that don't go vertical, awkward
   presentations, and anything under the fold or a camera.
3. **Static scan.** *(Refactoring Expert or UI Expert)* Grep for `userInterfaceIdiom`,
   `UIScreen.main`, `interfaceOrientation`, custom `UIToolbar`/`UITabBar`/`UINavigationBar`
   usage, fixed screen-level widths, and toolbar items that are text-only or symbol-only. Add
   each hit to the report.
4. **Architecture pass.** *(iOS Architect, only for substantial findings)* Decide which screens
   move to system containers (`NavigationSplitView`/`UISplitViewController`, arrangement views),
   and confirm adaptive logic stays in the view layer, never in ViewModels or presenters.
5. **Fix resizing first.** *(UI Expert)* Replace device and idiom checks with size classes and
   container geometry. Adopt Auto Layout / trait tracking (UIKit) and flexible frames (SwiftUI).
   Preserve state across display changes.
6. **Fix bars.** *(UI Expert)* Move custom bars into navigation-container toolbars. Give every
   item a title and a symbol. Order Back/Close first, pin Done, group related items, set
   visibility priorities, move custom overflow into the system menu, and pick a compression
   behavior per screen.
7. **Fix the fold and cameras.** *(UI Expert)* Prefer arrangement views or split views. For
   custom layouts that remain, use `reservedRegions(kind:)`. Use even grid columns, and apply
   `backgroundExtensionEffect` / `UIBackgroundExtensionView` to hero images.
8. **Camera flows** *(if any)*. *(UI Expert + Performance Expert)* Select the capture device by
   facing direction and handle display changes mid-session.
9. **Accessibility.** *(Accessibility Expert)* Check the largest Dynamic Type size on the outer
   display, VoiceOver order with side bars and split panes, and RTL.
10. **Tests.** *(Testing Expert)* Add previews or snapshots for compact and regular size classes.
    Make UI tests use accessibility identifiers only.
11. **Review.** *(Code Reviewer)* Gate each PR with
    [`checklists/iphone_duo_review.md`](../checklists/iphone_duo_review.md) plus the paradigm
    checklist.
12. **Release.** *(Release Manager)* Prepare iPhone Duo screenshots (outer 1398×2034 / 2034×1398,
    inner 2007×2853 / 2853×2007 px, per
    [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)),
    and note iPhone Duo support in the release notes.

## Validation Steps

- Every audited screen passes the iPhone Duo checklist in all five poses, in LTR and RTL.
- No remaining grep hits for idiom, orientation, or screen-bounds layout logic, or each has a
  justified, commented exception.
- Previews or snapshots render in both compact and regular width.
- Build and tests are green on Xcode 27.1+.
- `npm run lint` passes for any docs touched.

## Failure Scenarios

- **An API in the skill doesn't compile** → The SDK has moved on. Check Apple's current
  documentation before substituting an API, and update
  [`skills/ui/ios/iphone_duo_adaptive_layout.md`](../skills/ui/ios/iphone_duo_adaptive_layout.md).
- **The deployment target is below iOS 27.1** → Gate the new APIs with `#available`. The
  resizing fixes (size classes, safe areas) help every device and need no gate.
- **The screen depends on a fixed aspect ratio** (game, camera, canvas) → Change the aspect ratio
  per pose. If letterboxing is unavoidable, fill the padding with artwork. Never leave empty bars.
- **A legacy screen uses a custom bar that's deeply embedded** → Route it through the Refactoring
  Expert: extract it into `navigationItem` items first, then apply the bar fixes.
- **Too many screens to fix at once** → Fix the top flows first and ship incrementally. The
  system handles standard components automatically, so start with custom UI.

## AI Agent Instructions

- Load [`skills/ui/ios/iphone_duo_adaptive_layout.md`](../skills/ui/ios/iphone_duo_adaptive_layout.md)
  plus the paradigm standard ([SwiftUI](../standards/swiftui_standards.md) or
  [UIKit](../standards/uikit_standards.md)) before editing.
- Audit before fixing: produce the findings table first and get agreement on scope.
- Fix one screen or flow per change. Don't combine a paradigm migration with iPhone Duo fixes.
- Never put display, fold, or bar logic in a ViewModel, presenter, or the Domain layer.
- Don't disable vertical bars to hide a layout bug.

## Acceptance Criteria

- [ ] Project builds with Xcode 27.1+.
- [ ] Audit report exists and every Critical/High finding is resolved or explicitly deferred.
- [ ] Every changed screen passes
      [`checklists/iphone_duo_review.md`](../checklists/iphone_duo_review.md).
- [ ] No layout logic depends on idiom, orientation, device model, or screen bounds.
- [ ] Toolbar items have titles and symbols, priorities, and correct ordering. There are no
      custom bars.
- [ ] Nothing essential sits under the fold or a camera in any pose.
- [ ] Compact and regular size-class previews or snapshots exist for changed screens.
