---
platform: ios
ui: uikit
---

# Checklist: UIKit Review

Review gate for programmatic UIKit + MVP screens. Tag findings Critical/High/Medium/Low/Nit;
block on Critical/High. Complements [`uikit_standards.md`](../standards/uikit_standards.md).

## Screen Structure

- [ ] Four-file convention followed: `Contract.swift`, `View.swift`, `ViewController.swift`, `Presenter.swift`.
- [ ] Contract file holds only the view and presenter protocols — no implementation.
- [ ] `View` is a `UIView` subclass owning all layout and subviews; no business logic.
- [ ] `ViewController` only owns lifecycle and forwards to the presenter — no business logic.
- [ ] Presenter file has no `import UIKit`.

## Presenter (Critical/High)

- [ ] Presenter takes every dependency through its initializer as a protocol — no `.shared` singleton access.
- [ ] Presenter's `init` performs no work: no network calls, no timers, no notification registration.
- [ ] Presenter holds the view `weak` and is marked `@MainActor`.
- [ ] Presenter has at least one unit test using a spy view and a stub repository.

## View Layer

- [ ] Layout is programmatic; Interface Builder used only for the launch screen.
- [ ] Constraints built once in the view's initializer, never in `layoutSubviews`.
- [ ] `translatesAutoresizingMaskIntoConstraints = false` set on every added subview.
- [ ] Layout guides used instead of magic numbers.
- [ ] Cells registered by type, never by string literal.
- [ ] `prepareForReuse` implemented for any cell holding mutable state or an in-flight image load.
- [ ] Diffable data source used instead of manual `reloadData()` where applicable.
- [ ] No `userInterfaceIdiom`/`UIInterfaceOrientation`/`UIScreen` bounds in layout logic. Bar items
      live on `navigationItem`, with a title and an image (see
      [`iphone_duo_review.md`](iphone_duo_review.md)).

## Lifecycle

- [ ] One-time setup lives in `viewDidLoad`; anything that must repeat on re-entry lives in `viewWillAppear`.
- [ ] No network calls or business rules triggered directly from a lifecycle method.
- [ ] `init` performs no side effects.

## Accessibility

- [ ] `accessibilityLabel` set on every interactive control.
- [ ] `accessibilityIdentifier` set on anything a UI test drives.
- [ ] Dynamic Type supported via `UIFont.preferredFont(forTextStyle:)` and `adjustsFontForContentSizeCategory = true`.

## Tests

- [ ] Presenter tests use a spy view and a stub repository/use case — no real network, no `UIApplication.shared`.
- [ ] Success and error/empty paths covered for presenter logic.
- [ ] No `sleep`/timing hacks; async work awaited or expectations used.

## Verdict

- [ ] Verdict recorded: Approve / Approve-with-nits / Request-changes.
- [ ] Every Critical/High finding has a file:line and a concrete fix.
