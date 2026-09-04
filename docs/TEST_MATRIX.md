# Voice Input Layer — V1 Test Matrix

## Purpose

Voice Input Layer only succeeds when it works in real applications, not just inside its own demo screen.

## Desktop application matrix

### macOS

| Target | Text field | Direct insertion | Clipboard fallback | Status |
|---|---|---:|---:|---|
| Slack | message composer | test | test | planned |
| Discord | message composer | test | test | planned |
| Chrome | textarea/input | test | test | planned |
| Safari | textarea/input | test | test | planned |
| Notes | document | test | test | planned |
| ChatGPT | composer | test | test | planned |

### Windows

| Target | Text field | UI Automation | Clipboard fallback | Status |
|---|---|---:|---:|---|
| Slack | message composer | test | test | planned |
| Discord | message composer | test | test | planned |
| Edge | textarea/input | test | test | planned |
| Chrome | textarea/input | test | test | planned |
| Notepad | edit control | test | test | planned |
| ChatGPT | composer | test | test | planned |

## Android keyboard matrix

Test at minimum:

- WhatsApp
- Telegram
- Chrome
- Gmail
- Google Docs
- Slack
- Discord
- ChatGPT Android application when available

For each target, verify:

1. Keyboard appears normally.
2. User can switch away from the keyboard.
3. Voice activation starts correctly.
4. Partial transcript appears.
5. Final text is correct.
6. Text inserts at the current cursor.
7. Selection replacement works where supported.
8. Password/secure fields do not trigger cloud speech processing.
9. Microphone denial is handled cleanly.

## iOS keyboard matrix

Test at minimum:

- Messages
- WhatsApp
- Safari
- Gmail
- Slack
- Discord
- Notes
- ChatGPT web/application where supported

Verify both:

- keyboard without full access;
- keyboard with full access enabled.

## Voice quality test set

Maintain an anonymized evaluation set covering:

- short messages;
- long messages;
- punctuation spoken explicitly;
- names;
- company names;
- product names;
- technical terms;
- Nigerian English;
- common local place names;
- mixed English/Pidgin samples when the model/provider supports them.

## Latency tests

Measure:

- tap to listening;
- speech start to first partial transcript;
- speech end to final transcript;
- final transcript to cleaned result;
- cleaned result to insertion.

## Failure tests

- no microphone permission;
- provider unavailable;
- network disconnected during session;
- session timeout;
- focused field disappears;
- user changes application during processing;
- accessibility permission missing;
- clipboard unavailable;
- insertion target read-only.

## Release rule

A platform moves from `planned` to `beta` only after representative real-application tests pass for the primary insertion path and fallback behavior.
