# Checklist: Accessibility Review

Owned by the [Accessibility Expert](../agents/accessibility_expert.md). Targets Apple
accessibility guidance and WCAG 2.1 AA. See [`swiftui_standards.md`](../standards/swiftui_standards.md).

## VoiceOver (Critical)

- [ ] Every interactive element has a meaningful `accessibilityLabel`.
- [ ] Correct traits set (`.isButton`, `.isHeader`, `.isSelected`, etc.).
- [ ] Reading order is logical; related elements grouped (`accessibilityElement(children:)`).
- [ ] Decorative images hidden from VoiceOver (`accessibilityHidden(true)`).
- [ ] State changes announced where needed (e.g. loading, errors).

## Dynamic Type (Critical)

- [ ] Uses semantic `Font` text styles, not fixed point sizes.
- [ ] Layout works at the largest accessibility text size (no clipping/overlap/truncation).
- [ ] Largest text size also verified on the iPhone Duo outer display, which is short and has
      vertical bars.
- [ ] Images/icons scale appropriately or have text alternatives.

## Color & Contrast

- [ ] Text/background contrast meets WCAG AA (≥ 4.5:1 normal, ≥ 3:1 large).
- [ ] Color is never the sole information carrier (paired with text/icon/shape).
- [ ] Verified in light and dark mode.

## Motion & Adaptation

- [ ] Non-essential animation gated behind `accessibilityReduceMotion`.
- [ ] Increase Contrast / Bold Text respected.

## Interaction

- [ ] Touch targets ≥ 44×44 pt.
- [ ] All actions reachable without gestures that have no accessible alternative.

## Testability

- [ ] Accessibility identifiers present on key controls (distinct from labels) for UI tests.
- [ ] All user-facing strings (incl. accessibility labels) localized.
