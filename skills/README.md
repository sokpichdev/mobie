# Skills

Deep, single-topic capabilities. Load the relevant skill into your agent's context for
focused, expert implementation guidance. Each file follows the same structure: **Overview ·
Use Cases · Best Practices · Anti-Patterns · Checklist · Code Examples · Common Interview
Questions · AI Implementation Notes**.

**Platform layout.** Skills are split by platform inside each topic — `<topic>/ios/`,
`<topic>/android/`, `<topic>/flutter/`, … — and each file declares `platform:` in its
front-matter. Load only the platform you're working on. Each entry below is tagged with its
platform; iOS is the most complete set, and Flutter ships a foundation pack. Porting a skill? Add
it in the sibling platform folder and cross-link its counterpart (see
[CONTRIBUTING.md](../CONTRIBUTING.md#repository-layout-platforms)). Flutter package choices are
centralized in [`standards/flutter_standards.md`](../standards/flutter_standards.md#package-baseline).

## Architecture

- [mvvm.md](architecture/ios/mvvm.md) (iOS)
- [mvp.md](architecture/ios/mvp.md) (iOS)
- [clean_architecture.md](architecture/ios/clean_architecture.md) (iOS)
- [clean_architecture.md](architecture/flutter/clean_architecture.md) (Flutter)
- [state_management.md](architecture/flutter/state_management.md) (Flutter)
- [dependency_injection.md](architecture/ios/dependency_injection.md) (iOS)
- [dependency_injection.md](architecture/flutter/dependency_injection.md) (Flutter)
- [repository_pattern.md](architecture/ios/repository_pattern.md) (iOS)
- [repository_pattern.md](architecture/flutter/repository_pattern.md) (Flutter)
- [coordinator_navigation.md](architecture/ios/coordinator_navigation.md) (iOS)
- [router_navigation.md](architecture/flutter/router_navigation.md) (Flutter)
- [platform_channels.md](architecture/flutter/platform_channels.md) (Flutter)
- [modularization.md](architecture/ios/modularization.md) (iOS)

## UI

> Note: apart from the cross-paradigm iPhone Duo skill, `skills/ui/` holds UIKit files only because SwiftUI's equivalent guidance lives in [`standards/swiftui_standards.md`](../standards/swiftui_standards.md) and [`agents/swiftui_expert.md`](../agents/swiftui_expert.md).

- [uikit_view_layer.md](ui/ios/uikit_view_layer.md) (iOS)
- [massive_view_controller.md](ui/ios/massive_view_controller.md) (iOS)
- [iphone_duo_adaptive_layout.md](ui/ios/iphone_duo_adaptive_layout.md) (iOS — SwiftUI + UIKit: resizing, reserved regions, vertical bars, arrangement views)

> Flutter widget guidance lives in [`standards/flutter_standards.md`](../standards/flutter_standards.md)
> and [`agents/flutter_expert.md`](../agents/flutter_expert.md); the native boundary is covered by
> [platform_channels.md](architecture/flutter/platform_channels.md).

## Concurrency

- [promisekit_to_async.md](concurrency/ios/promisekit_to_async.md) (iOS)

## Networking

- [rest_api.md](networking/ios/rest_api.md) (iOS)
- [rest_api.md](networking/flutter/rest_api.md) (Flutter)
- [graphql.md](networking/ios/graphql.md) (iOS)
- [websocket.md](networking/ios/websocket.md) (iOS)
- [websocket.md](networking/flutter/websocket.md) (Flutter)
- [sse.md](networking/ios/sse.md) (iOS)
- [pagination.md](networking/ios/pagination.md) (iOS)
- [pagination.md](networking/flutter/pagination.md) (Flutter)
- [file_upload.md](networking/ios/file_upload.md) (iOS)

## Security

- [oauth2.md](security/ios/oauth2.md) (iOS)
- [oauth2.md](security/flutter/oauth2.md) (Flutter)
- [jwt.md](security/ios/jwt.md) (iOS)
- [ssl_pinning.md](security/ios/ssl_pinning.md) (iOS)
- [ssl_pinning.md](security/flutter/ssl_pinning.md) (Flutter)
- [certificate_pinning.md](security/ios/certificate_pinning.md) (iOS)
- [aes_encryption.md](security/ios/aes_encryption.md) (iOS)
- [keychain.md](security/ios/keychain.md) (iOS)
- [secure_storage.md](security/flutter/secure_storage.md) (Flutter)
- [biometric_auth.md](security/ios/biometric_auth.md) (iOS)

## Storage

- [coredata.md](storage/ios/coredata.md) (iOS)
- [sqlite.md](storage/ios/sqlite.md) (iOS)
- [local_persistence.md](storage/flutter/local_persistence.md) (Flutter)
- [offline_sync.md](storage/ios/offline_sync.md) (iOS)
- [offline_sync.md](storage/flutter/offline_sync.md) (Flutter)
- [caching.md](storage/ios/caching.md) (iOS)

## Notifications

- [apns.md](notifications/ios/apns.md) (iOS)
- [fcm.md](notifications/ios/fcm.md) (iOS)
- [deep_links.md](notifications/ios/deep_links.md) (iOS)

> No Flutter notification skill yet. Flutter deep links are covered in
> [router_navigation.md](architecture/flutter/router_navigation.md).

## Testing

- [unit_testing.md](testing/ios/unit_testing.md) (iOS)
- [unit_testing.md](testing/android/unit_testing.md) (Android)
- [unit_testing.md](testing/flutter/unit_testing.md) (Flutter)
- [integration_testing.md](testing/ios/integration_testing.md) (iOS)
- [ui_testing.md](testing/ios/ui_testing.md) (iOS)
- [widget_testing.md](testing/flutter/widget_testing.md) (Flutter)

## Performance

- [memory_optimization.md](performance/ios/memory_optimization.md) (iOS)
- [startup_optimization.md](performance/ios/startup_optimization.md) (iOS)
- [battery_optimization.md](performance/ios/battery_optimization.md) (iOS)
- [rendering_optimization.md](performance/flutter/rendering_optimization.md) (Flutter)
