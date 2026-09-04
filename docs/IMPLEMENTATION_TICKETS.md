# SAYRR implementation tickets

## Phase 1 — Desktop foundation

1. Desktop shell: Tauri 2.x resident application with a compact voice launcher.
2. Global activation: register a configurable global shortcut.
3. Voice capture: microphone permission, start/stop/cancel lifecycle, and audio session state.
4. Speech provider: implement a provider adapter with streaming transcript events and explicit provider errors.
5. Cleanup: apply deterministic local cleanup first, with a replaceable AI cleanup provider behind a shared contract.
6. Text target: detect or select the active desktop text target where supported.
7. Text insertion: insert text using native target APIs where available, with clipboard and keyboard fallback.
8. End-to-end smoke test: focus a text field, activate SAYRR, speak, clean, insert, and record telemetry.

## Phase 1 completion gate

The phase is complete when a desktop build can execute the core flow reliably in a controlled test matrix:

```text
Focus text field -> activate -> capture speech -> transcript -> cleanup -> insert
```

The first supported validation targets are browser text fields and common Chromium-based applications. Unsupported targets must fail gracefully rather than silently losing text.

## Phase 2 — Android keyboard

- Android Input Method Editor (IME) shell
- Voice action inside keyboard
- Shared transcription and cleanup contracts
- Personal vocabulary
- Preferences and history

## Phase 3 — iOS keyboard

- Custom keyboard extension
- Keyboard-safe networking model
- Voice capture and insertion
- Companion app synchronization

## Phase 4 — Intelligence

- Nigerian English improvements
- Personal style
- Intent commands
- Context-aware rewriting
- Actions and integrations
