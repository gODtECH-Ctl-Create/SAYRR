# SAYRR Desktop

Phase 1 desktop client for SAYRR.

## Core flow

```text
Focus text field -> activate SAYRR -> speak -> transcribe -> clean -> insert
```

## Current prototype

- Tauri 2.x resident application shell
- Hidden compact window that can be shown by the global shortcut
- `CommandOrControl+Shift+Space` global activation
- Browser speech recognition adapter for prototype validation
- Deterministic transcript cleanup
- System clipboard support
- Native paste fallback for macOS, Windows, and Linux
- Demo transcript path for testing insertion without microphone access

The browser speech recognition path is intentionally a prototype adapter. Production transcription will move behind the shared SAYRR speech-provider contract once the provider and backend are selected.

## Run

From the repository root:

```sh
pnpm install
pnpm desktop:dev
```

Build:

```sh
pnpm desktop:build
```

## Permissions

macOS direct paste may require Accessibility permission for SAYRR. Linux direct paste requires `xdotool` or `wtype` for the current fallback path.
