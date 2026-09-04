# Native platform bridges

This area contains system-level code that cannot be expressed reliably as shared TypeScript.

Planned adapters:

- `macos/` — Accessibility and insertion bridge.
- `windows/` — UI Automation and input bridge.
- `android/` — Input Method Editor support as needed by the Android app.
- `ios/` — custom keyboard support as needed by the iOS extension.

Keep platform APIs behind small interfaces and return platform-neutral results to the shared product layer.
