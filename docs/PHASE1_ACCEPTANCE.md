# SAYRR Phase 1 acceptance criteria

## Core interaction

- [ ] User can focus a text field in another desktop application.
- [ ] User can activate SAYRR with `CommandOrControl+Shift+Space`.
- [ ] SAYRR starts microphone capture or reports a clear permission/capability error.
- [ ] User can speak a sentence naturally.
- [ ] A transcript is shown while recognition is running when the platform supports interim results.
- [ ] A final cleaned transcript is produced.
- [ ] User can choose Insert.
- [ ] SAYRR hides before insertion so the previous application can regain focus.
- [ ] Text is written to the system clipboard.
- [ ] Native paste is attempted.
- [ ] When native paste fails, the user is explicitly told that the text remains in the clipboard.

## Non-functional

- [ ] No raw audio is persisted by the desktop client.
- [ ] Transcription provider credentials are not embedded in client code.
- [ ] Shortcut registration failure does not crash the app.
- [ ] Insertion failures do not silently discard the transcript.
- [ ] The desktop client remains small and resident without opening a dashboard.

## First manual targets

- [ ] Browser text field
- [ ] ChatGPT web text field
- [ ] WhatsApp Web composer
- [ ] Slack composer
- [ ] Discord composer

## Known limitations for this milestone

The current speech adapter uses the browser Web Speech API where the system webview exposes it. It is a development adapter, not the final transcription architecture.
