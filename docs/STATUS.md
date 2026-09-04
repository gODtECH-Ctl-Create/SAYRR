# Voice Input Layer — Current Status

## Completed

- Replaced the old procurement README with the voice product foundation.
- Removed the old procurement license and temporary placeholder files.
- Added product specification.
- Added system architecture.
- Added platform architecture.
- Added roadmap.
- Added privacy/security baseline.
- Added architecture decision record for the platform strategy.
- Added V1 data model.
- Added V1 API contract.
- Added real-world test matrix.
- Added development workflow.
- Added shared TypeScript domain contracts.
- Added initial pnpm monorepo configuration.

## Current milestone

**Milestone 1 — Core Voice Engine**

The next implementation target is a provider-neutral voice session engine and cleanup pipeline that can be exercised independently of Android, iOS, Windows, and macOS UI.

## Current product architecture

```text
Mobile
  Android IME / iOS keyboard

Desktop
  Tauri resident app

Shared
  Voice session -> Speech -> Vocabulary -> Cleanup -> Text insertion

Backend
  Supabase Auth + PostgreSQL + API/voice gateway
```

## Next engineering sequence

1. Select and implement the first speech provider adapter.
2. Implement streaming voice session contracts and state machine.
3. Implement cleanup service with vocabulary injection.
4. Build a small web-based voice test harness.
5. Spike Windows text insertion.
6. Spike macOS text insertion.
7. Build Android IME prototype.
8. Build iOS keyboard prototype.

## Open questions

- Final product name.
- First speech provider and fallback provider.
- Exact desktop distribution/update strategy.
- Whether V1 history is enabled by default or opt-in.
- Final pricing/usage limits for the public beta.
