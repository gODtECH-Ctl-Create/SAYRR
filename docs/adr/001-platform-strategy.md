# ADR 001 — Platform Strategy

**Status:** Accepted
**Date:** 2026-09-04

## Context

The product is intended to replace or enhance ordinary dictation at the point where users type.

Mobile operating systems already have system keyboards and speech input. Desktop applications often expose text fields without a universal voice-input layer.

Trying to force one identical interface across mobile and desktop would add unnecessary friction and ignore platform capabilities.

## Decision

We will use two primary interaction models:

### Mobile

Build as a system keyboard/input method.

- Android: Input Method Editor (IME).
- iOS/iPadOS: custom keyboard extension.

The keyboard is the product's primary daily interaction. A separate app is used for onboarding, account, settings, vocabulary, history, and support.

### Desktop

Build as a resident desktop application.

- Tauri 2.x application shell.
- System tray/menu bar.
- Global shortcut.
- Floating microphone launcher near a detected text target where practical.
- Native platform bridges for text-target discovery and insertion.

## Why

This approach aligns the product with the place where text is entered:

```text
Mobile  -> keyboard
Desktop -> system utility / floating input layer
```

It avoids building a second chat-like interface that users must switch into before dictating.

## Consequences

### Positive

- Natural mobile workflow.
- Strong desktop differentiation.
- Direct insertion is possible through platform input APIs.
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

V1 implementation will validate Android and desktop first, then stabilize iOS keyboard behavior against Apple's keyboard-extension constraints. Linux desktop support is deliberately later because of the diversity of desktop input/accessibility stacks.
