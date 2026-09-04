# Immediate Next Actions

## P0 — Core voice engine

1. Pick two candidate speech providers and run the fixed benchmark.
2. Implement the provider adapter interface.
3. Implement streaming session transport.
4. Connect the existing session state machine to provider events.
5. Add cleanup service and vocabulary injection.
6. Build a local voice test harness.

## P0 — Desktop spike

1. Scaffold Tauri desktop app.
2. Register global shortcut.
3. Implement macOS focused-target probe.
4. Implement Windows focused-target probe.
5. Implement insertion fallbacks.
6. Test against Slack, Discord, browsers, and ChatGPT.

## P0 — Mobile spike

After the core engine is stable:

1. Android Input Method Editor prototype.
2. iOS custom keyboard prototype.
3. Validate streaming/network/privacy behavior.

## P1 — Product shell

- Authentication
- Vocabulary management
- History
- Settings
- Usage page
- Privacy/help pages
