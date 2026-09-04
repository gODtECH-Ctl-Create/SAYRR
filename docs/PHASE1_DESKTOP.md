# Phase 1 — Desktop vertical slice

## Goal

Prove SAYRR's defining interaction on desktop:

```text
Focus text field -> activate SAYRR -> speak -> transcribe -> clean -> insert
```

## Current implementation

The first desktop slice now contains:

- Tauri 2.x shell
- hidden compact resident window
- global shortcut: `CommandOrControl+Shift+Space`
- microphone speech-recognition prototype using the Web Speech API when supported by the operating-system webview
- deterministic transcript cleanup
- demo transcript mode for insertion testing without microphone access
- system clipboard integration
- native paste fallback for macOS, Windows, and Linux

## Known prototype limitation

Browser speech recognition is a compatibility prototype, not the production transcription backend. The production path will use the shared `SpeechProvider` contract and a server-side speech service so credentials and provider logic do not live in the desktop client.

## Insertion model

SAYRR hides its own window before pasting so the application that was active before activation can regain focus. The native paste command then triggers the platform paste action.

This is an intentionally pragmatic Phase 1 path. Native accessibility-aware text-target discovery will replace/augment the fallback after the first end-to-end voice insertion test is validated.

## Validation matrix

| Target | Expected Phase 1 behavior |
| --- | --- |
| Browser text input | Paste into previously active field |
| WhatsApp Web | Paste into message composer where normal clipboard insertion is accepted |
| Slack desktop/web | Paste into composer where normal clipboard insertion is accepted |
| Discord desktop/web | Paste into composer where normal clipboard insertion is accepted |
| ChatGPT web | Paste into prompt field |
| Unsupported/custom fields | Clipboard fallback, no silent data loss |

## Exit criteria

- Global shortcut starts SAYRR from another application.
- Speech can be captured where the prototype recognition API is available.
- A clean transcript is produced.
- Insert restores the previous application and attempts paste.
- Failure leaves the text available through the clipboard fallback.
- No raw audio is persisted by the desktop client.
