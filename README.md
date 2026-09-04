# SAYRR

**Speak anywhere you type.**

SAYRR is a voice-first input layer designed to turn natural speech into clean text and place it directly into the text field the user is working in.

## V1

V1 focuses on one interaction:

```text
Focus a text field -> activate SAYRR -> speak -> transcribe -> clean -> insert
```

### Mobile

SAYRR is designed to become a selectable system keyboard/input method. The voice experience lives inside the keyboard rather than as a floating overlay.

- Android Input Method Editor (IME)
- iOS/iPadOS custom keyboard extension
- Enhanced speech input, punctuation, cleanup, and personal vocabulary

### Desktop

SAYRR is a lightweight resident application with:

- Global activation shortcut
- Floating voice launcher where the operating system can reliably identify the active text target
- Streaming transcription
- AI cleanup
- Native text insertion with clipboard/keyboard fallback

## Repository structure

```text
docs/
  PRODUCT_SPECIFICATION.md
  ARCHITECTURE.md
  PLATFORM_ARCHITECTURE.md
  DATA_MODEL.md
  API_CONTRACT.md
  PRIVACY_SECURITY.md
  ROADMAP.md
  TEST_MATRIX.md
  PROVIDER_EVALUATION.md
  BETA_PLAN.md
  RELEASE_CHECKLIST.md
  PHASE1_DESKTOP.md
  PHASE1_IMPLEMENTATION.md
  PHASE1_ACCEPTANCE.md
  adr/

apps/
  desktop/

packages/
  contracts/
  voice-core/

native/

supabase/
```

## Core architecture

```text
                         USER
                          |
            +-------------+-------------+
            |                           |
         MOBILE                      DESKTOP
            |                           |
      SAYRR Keyboard              SAYRR Desktop
      Android IME                 Tray/Menu Bar
      iOS Keyboard               Global Shortcut
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
- Rust for operating-system integration where web code cannot reliably access native APIs.
- Native Kotlin/Java for Android Input Method Editor integration.
- Native Swift for iOS keyboard extension integration.
- Supabase PostgreSQL for accounts, vocabulary, preferences, history, and usage metadata.
- Vercel for supporting web/API services where appropriate.
- A speech-provider abstraction so the transcription backend can change without changing client contracts.

## Product principles

1. Voice insertion is the core product, not the dashboard.
2. Use platform-native input mechanisms instead of simulated cross-platform behavior.
3. Do not store raw audio by default.
4. Personal vocabulary is first-class product data.
5. Cleanup preserves meaning and does not aggressively rewrite by default.
6. Every platform has an explicit fallback when direct insertion is unavailable.
7. Permissions and privacy are core architecture concerns.
8. V1 proves the input experience before autonomous actions are added.

## Status

**Phase 1: Desktop foundation in progress.**

The repository was repurposed from the old procurement prototype and is now the home of SAYRR development.
