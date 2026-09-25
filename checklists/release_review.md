# Checklist: Release Review

Owned by the [Release Manager](../agents/release_manager.md) with
[DevOps](../agents/devops_expert.md). A green checklist is required before submission. See
[`workflows/release_application.md`](../workflows/release_application.md).

## Source & Versioning (Critical)

- [ ] Built from a clean, **tagged** commit produced by CI (not a local build).
- [ ] `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` bumped per SemVer; build number unique.
- [ ] Changelog/release notes prepared.

## Signing (Critical)

- [ ] Distribution certificate and provisioning profiles valid and not near expiry.
- [ ] Signing automated (Fastlane match); no manual cert juggling.
- [ ] dSYMs uploaded for crash symbolication.

## Quality Gates

- [ ] CI lint + unit/UI tests green on the release commit.
- [ ] Regression suite + manual QA signed off.
- [ ] Crash-free rate of the candidate build meets the baseline.

## Store Readiness

- [ ] Metadata, screenshots, and what's-new accurate for this version.
- [ ] iPhone Duo: built with Xcode 27.1+. Outer (1398×2034) and inner (2007×2853) screenshots
      prepared once App Store Connect accepts them.
- [ ] Privacy manifest + App Privacy "data use" declarations match actual data collection.
- [ ] Required permission usage strings (`Info.plist`) present and accurate.

## Rollout & Safety

- [ ] Phased rollout configured.
- [ ] Monitoring in place (crash-free rate, key metrics) for the rollout window.
- [ ] Rollback / expedited-hotfix plan documented and feasible.

## Post-Release

- [ ] Tag pushed; release notes published.
- [ ] Monitoring watched through the rollout ramp.
