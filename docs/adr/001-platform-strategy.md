# ADR 001 — Platform Strategy

**Status:** Accepted  
**Date:** 2026-09-04

## Context

SAYRR is intended to replace or enhance ordinary dictation at the point where users type.

Mobile operating systems already have system keyboards and speech input. Desktop applications often expose text fields without a universal voice-input layer.

Trying to force one identical interface across mobile and desktop would add unnecessary friction and ignore platform capabilities.

## Decision

We will use two primary interaction models.

### Mobile

Build SAYRR as a system keyboard/input method.

- Android: Input Method Editor (IME).
- iOS/iPadOS: custom keyboard extension.

The keyboard is the product's primary daily interaction. A separate companion app can handle onboarding, account, settings, vocabulary, history, and support.

### Desktop

Build SAYRR as a resident desktop application.

- Tauri 2.x application shell.
- System tray/menu bar.
- Global shortcut.
- Floating microphone launcher near a detected text target where practical.
- Native platform bridges for text-target discovery and insertion.

## Why

This approach aligns SAYRR with the place where text is entered:

```text
Mobile  -> keyboard
Desktop -> system utility / floating input layer
```

It avoids building a second chat-like interface that users must switch into before dictating.

## Consequences

### Positive

- Natural mobile workflow.
- Strong desktop differentiation.
- Direct insertion is possible through platform input and accessibility APIs where supported.
- Shared voice/AI pipeline can serve all platforms.
- Native platform behavior can be optimized independently.

### Negative

- Native platform code is required.
- Permission and store-review constraints differ by platform.
- Text insertion is not universally reliable across every desktop application.
- iOS requires special handling for network-backed keyboard functionality.

## Rejected alternative

A single cross-platform floating overlay for mobile and desktop was rejected as the primary architecture because it unnecessarily duplicates functionality already provided by mobile input methods and introduces platform-specific permission constraints without improving the core user experience.

## Follow-up

V1 implementation will validate the desktop path first and then the Android keyboard path. iOS keyboard behavior will be stabilized against Apple's keyboard-extension constraints. Linux desktop support is deliberately later because of the diversity of desktop input/accessibility stacks.

## References

- Apple Accessibility / AXUIElement: https://developer.apple.com/documentation/applicationservices/axuielement_h
- Apple AXUIElementSetAttributeValue: https://developer.apple.com/documentation/applicationservices/1460434-axuielementsetattributevalue
- Microsoft UI Automation text support: https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-ui-automation-textpattern-overview
- Microsoft UI Automation patterns: https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controlpatternsoverview
- Tauri global shortcut: https://v2.tauri.app/plugin/global-shortcut/
- Tauri clipboard manager: https://v2.tauri.app/plugin/clipboard/
