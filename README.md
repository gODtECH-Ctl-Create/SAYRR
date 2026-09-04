# Voice Input Layer

**Working title:** Voice Input Layer

A voice-first input system designed to let people speak wherever they normally type.

> **Speak anywhere you type. Get clean text. Insert it where you are.**

This repository is being repurposed from the old Proqurement prototype. The previous procurement stub is no longer the product direction.

## Product direction

The product has two primary surfaces:

- **Mobile:** a system keyboard/input method that users can select like any other keyboard. The keyboard exposes the product's enhanced voice input experience inside normal text fields.
- **Desktop:** a lightweight resident application that provides a global activation shortcut and a floating voice launcher around the active text area where the operating system allows reliable detection.

The first release focuses on one loop:

```text
Focus a text field -> activate voice -> speak -> transcribe -> clean -> insert
```

The longer-term vision can evolve toward intelligent voice commands and actions, but V1 is a voice-input product first.

## Repository structure

```text
docs/
  PRODUCT_SPECIFICATION.md
  ARCHITECTURE.md
  PLATFORM_ARCHITECTURE.md
  ROADMAP.md
  PRIVACY_SECURITY.md
  adr/
    001-platform-strategy.md

apps/               # application surfaces added during implementation
packages/           # shared TypeScript contracts and client libraries
native/             # platform-specific native integration where required
supabase/           # database migrations and server-side functions
```

## Core architecture

```text
                         USER
                          |
            +-------------+-------------+
            |                           |
         MOBILE                      DESKTOP
            |                           |
     System Keyboard             Resident App
     Android IME                  Tray/Menu Bar
     iOS Keyboard                Global Shortcut
            |                           |
            +-------------+-------------+
                          |
                    Voice Session
                          |
                 Speech Provider API
                          |
                   Raw Transcript
                          |
                 Vocabulary Context
                          |
                  AI Cleanup Layer
                          |
                    Final Text
                          |
                    Text Insertion
                          |
                Current Text Field
```

## Technical direction

- TypeScript for shared contracts and web-facing application logic.
- Tauri 2.x for the desktop application shell and native bridge layer.
- Rust for desktop system integration where JavaScript cannot safely or reliably access operating-system APIs.
- Native Kotlin/Java components for Android Input Method Editor integration.
- Native Swift components for iOS keyboard extension integration.
- Supabase PostgreSQL for account, vocabulary, preferences, history, and usage metadata.
- Vercel for the supporting web application and API services where appropriate.
- A provider abstraction around speech recognition so the transcription backend can change without changing the client contract.

## Development principles

1. Voice insertion is the core product, not a dashboard.
2. Platform-native input mechanisms are preferred over simulated cross-platform behavior.
3. Raw audio is not stored by default.
4. User vocabulary must be first-class product data.
5. AI cleanup must preserve meaning and avoid aggressive rewriting by default.
6. Every platform must have an explicit fallback when direct text insertion is unsupported.
7. Permissions and privacy are part of the product architecture, not post-release work.
8. V1 should prove the core interaction before adding autonomous actions.

## Documentation

Start with `docs/PRODUCT_SPECIFICATION.md` for the product requirements, then read `docs/ARCHITECTURE.md` and `docs/PLATFORM_ARCHITECTURE.md` for the implementation model.

## Status

**Foundation / architecture phase.**

The repository is intentionally being rebuilt around the voice-input product before implementation expands into the mobile and desktop clients.
