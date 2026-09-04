# Voice Input Layer — Roadmap

## Phase 0 — Foundation

Status: **In progress**

- Product specification
- System architecture
- Platform architecture
- Privacy/security model
- Architecture decision records
- Repository cleanup
- Shared domain/API contracts

## Phase 1 — Core Voice Engine

Goal: prove that the voice pipeline is good before building deep platform integrations.

Deliver:

- Speech provider adapter
- Streaming session model
- Partial/final transcript handling
- Cleanup pipeline
- Vocabulary resolver
- Error/retry model
- Basic usage metrics

Acceptance test:

```text
microphone -> speech -> transcript -> cleanup -> final text
```

## Phase 2 — Desktop MVP

Priority: **P0**

Platforms:

- macOS
- Windows

Deliver:

- Tauri resident application
- System tray/menu bar
- Global shortcut
- Recording overlay
- Floating launcher
- Active text-target detection
- Text insertion adapters
- Clipboard fallback
- Native permission onboarding
- Basic settings window

Acceptance test:

```text
Slack/Discord/browser text field
    -> activate
    -> speak
    -> clean
    -> insert
```

## Phase 3 — Android Keyboard

Priority: **P0**

Deliver:

- Android application
- Input Method Editor (IME) service
- Keyboard microphone control
- Streaming speech session
- Vocabulary support
- Cleanup support
- Direct insertion into the active input connection
- Keyboard switching support
- Authentication/settings bridge

Acceptance test:

```text
WhatsApp/Telegram/Chrome
    -> our keyboard
    -> microphone
    -> speak
    -> insert
```

## Phase 4 — iOS Keyboard

Priority: **P0**

Deliver:

- Containing application
- Custom keyboard extension
- Voice control UI
- `UITextDocumentProxy` insertion
- Full Access onboarding where cloud processing requires it
- Privacy explanation
- Shared account/settings

Acceptance test:

```text
Messages/WhatsApp/Safari
    -> our keyboard
    -> microphone
    -> speak
    -> insert
```

## Phase 5 — Beta Intelligence

- Better Nigerian English handling
- Personal names
- Technical vocabulary
- Local business names
- Pidgin evaluation
- Improved cleanup quality
- User-specific vocabulary learning
- Style presets

## Phase 6 — Intelligent Voice Actions

Only after voice input is demonstrably useful.

Examples:

```text
Speak -> text
Speak -> rewrite
Speak -> summarize
Speak -> translate
Speak -> command
```

Potential later integrations:

- Email
- Tasks
- Calendar
- CRM
- Social publishing
- Developer tools

## Phase 7 — Voice Operating Layer

Long-term direction:

```text
Voice
  -> intent
  -> context
  -> decision
  -> approved action
  -> result
```

The architecture must keep this future possible without adding autonomous actions to V1.

## Release gates

A phase cannot be considered complete because the interface exists. Each phase must satisfy:

- build succeeds;
- permission flow works;
- primary interaction works in real target applications;
- failure paths are usable;
- no credentials are committed;
- privacy documentation matches behavior;
- measurable telemetry exists for core technical outcomes.
