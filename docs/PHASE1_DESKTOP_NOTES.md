# SAYRR Phase 1 desktop notes

The Phase 1 prototype currently uses a browser speech-recognition adapter when the operating system webview exposes the Web Speech API. This keeps the user flow testable before a production speech provider is selected.

The desktop shell is built around a resident Tauri application with a global activation shortcut. The application hides before paste so the previously active application can regain focus.

The current paste fallback is intentionally simple:

- macOS: AppleScript/System Events paste
- Windows: PowerShell SendKeys paste
- Linux: xdotool, then wtype fallback

Native accessibility-aware text target discovery remains the next hardening task. Apple Accessibility exposes accessible UI elements and settable attributes; Windows UI Automation exposes text/value patterns, but text insertion is control-dependent and keyboard input remains an important fallback.
