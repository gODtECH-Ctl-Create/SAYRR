# Decision Log

## 2026-09-04

### Platform strategy

Mobile uses system keyboard/input-method surfaces; desktop uses a resident floating/global-activation application.

See `docs/adr/001-platform-strategy.md`.

### V1 scope

The first version is intentionally limited to:

```text
Speak -> Transcribe -> Clean -> Insert
```

Actions, agents, and deep integrations are deferred.

### Data minimization

Raw audio is not persisted by default. History is user-controlled.

### Provider abstraction

Speech recognition is behind an adapter so vendor selection can change without changing platform clients.
