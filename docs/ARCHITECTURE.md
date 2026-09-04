# Voice Input Layer — System Architecture

## 1. Architectural goal

The system must make voice-to-text available at the point where users already type, without forcing them into a separate conversation or transcription application.

The architecture therefore separates the product into four concerns:

1. **Input surfaces** — mobile keyboards and the desktop resident app.
2. **Voice pipeline** — audio capture, streaming speech recognition, transcript finalization, and cleanup.
3. **User intelligence** — personal vocabulary, preferences, and optional context.
4. **Data and platform services** — authentication, history, usage, configuration, and observability.

## 2. Logical architecture

```text
                         +-------------------------+
                         |      Current App        |
                         | WhatsApp / Slack / etc. |
                         +------------+------------+
                                      |
                              active text target
                                      |
          +---------------------------+---------------------------+
          |                                                       |
   +------+-------+                                         +-----+------+
   | Mobile IME  |                                         | Desktop App|
   | Android/iOS |                                         | Tauri      |
   +------+-------+                                         +-----+------+
          |                                                       |
          +---------------------------+---------------------------+
                                      |
                              Voice Session API
                                      |
                         +------------v------------+
                         |      Voice Gateway      |
                         +------------+------------+
                                      |
                    +-----------------+------------------+
                    |                                    |
             Speech Provider                      Session Controls
                    |                                    |
             raw/partial text                    auth / rate limit
                    |                                    |
                    +-----------------+------------------+
                                      |
                         +------------v------------+
                         | Transcript Normalizer    |
                         +------------+------------+
                                      |
                         +------------v------------+
                         | Vocabulary Resolver     |
                         +------------+------------+
                                      |
                         +------------v------------+
                         | AI Cleanup Engine       |
                         +------------+------------+
                                      |
                              cleaned final text
                                      |
                    +-----------------+------------------+
                    |                                    |
             Insert into field                    Save history*
                    |                                    |
                    v                                    v
             Current application                    Supabase

* History is opt-in/configurable; raw audio is not stored by default.
```

## 3. Client responsibilities

### Mobile keyboard

The keyboard owns the immediate interaction:

- microphone button;
- listening UI;
- partial transcript display;
- final transcript display;
- insert/delete operations;
- keyboard switching;
- mobile-specific permission and lifecycle handling.

The normal containing application handles account, settings, vocabulary, and history management.

### Desktop resident app

The desktop app owns:

- startup/login state;
- tray/menu-bar presence;
- global activation shortcut;
- floating launcher visibility;
- active text-target detection;
- audio session;
- transcription interaction;
- cleanup result preview;
- text insertion;
- desktop permissions.

The main window should not be required for normal dictation.

## 4. Voice session state machine

```text
IDLE
  |
  | activate
  v
STARTING
  |
  | microphone ready
  v
LISTENING
  |
  | transcript events
  v
TRANSCRIBING
  |
  | speech ended
  v
PROCESSING
  |
  | cleaned text ready
  v
READY
  |      \
  | insert \ cancel
  v         v
INSERTED   CANCELLED
  |
  v
IDLE
```

Failure can occur at any state and must transition to a recoverable `ERROR` state with an actionable message.

## 5. Provider abstraction

Speech recognition must be isolated behind a provider contract.

Conceptual interface:

```text
SpeechProvider
  startSession(config)
  sendAudio(chunk)
  onPartialTranscript(handler)
  onFinalTranscript(handler)
  stopSession()
  cancelSession()
```

The application must not depend on provider-specific response shapes beyond the adapter layer.

## 6. Cleanup pipeline

The cleanup engine receives:

- final transcript;
- user vocabulary;
- language/locale;
- cleanup preferences;
- optional field context when the platform safely exposes it.

It returns:

```text
CleanupResult
  text
  confidence
  changes[]
  warnings[]
```

`changes[]` is intended for future explainability and user control, not necessarily displayed in V1.

## 7. Insertion abstraction

All clients implement a common conceptual contract:

```text
TextTarget
  detect()
  snapshotContext()
  insert(text)
  replaceSelection(text)
  fallbackInsert(text)
```

The implementation is platform-specific.

The product must prefer direct insertion first, then use an explicit fallback such as clipboard paste or simulated keyboard input where technically appropriate.

## 8. Data model

Initial Supabase PostgreSQL entities:

### profiles

```text
id
user_id
display_name
default_locale
created_at
updated_at
```

### vocabulary_entries

```text
id
user_id
term
category
pronunciation_hint
preferred_text
created_at
updated_at
```

### preferences

```text
id
user_id
auto_punctuation
remove_fillers
cleanup_enabled
history_enabled
default_locale
updated_at
```

### transcription_history

```text
id
user_id
raw_text
cleaned_text
locale
source_platform
duration_ms
created_at
```

Raw audio is intentionally absent from the default schema.

### usage_events

```text
id
user_id
event_type
platform
duration_ms
characters
created_at
metadata
```

Do not put sensitive transcript content into `metadata`.

## 9. API boundaries

The initial backend may expose:

```text
POST /v1/sessions
POST /v1/sessions/:id/audio
POST /v1/sessions/:id/finish
POST /v1/cleanup
GET  /v1/vocabulary
POST /v1/vocabulary
PATCH /v1/vocabulary/:id
DELETE /v1/vocabulary/:id
GET  /v1/history
DELETE /v1/history/:id
GET  /v1/preferences
PATCH /v1/preferences
```

For low-latency streaming, `/audio` should be replaced or complemented by a persistent streaming channel once the first provider is selected and tested.

## 10. Repository architecture

The implementation should converge toward:

```text
apps/
  desktop/                # Tauri application
  web/                    # account/settings/help application
  android-ime/            # Android IME application/module
  ios-keyboard/           # iOS keyboard extension/application

packages/
  contracts/              # shared TypeScript API and domain types
  client/                 # API client
  voice-core/             # session state and provider contracts
  vocabulary/             # vocabulary matching utilities
  cleanup/                # cleanup prompts and result normalization

native/
  windows/                # UI Automation / input bridge
  macos/                  # Accessibility / input bridge
  android/                # Kotlin IME integration support
  ios/                    # Swift keyboard integration support

supabase/
  migrations/
  functions/

docs/
```

The native directories exist only for platform code that cannot reasonably be shared.

## 11. Desktop architecture

Tauri is selected as the desktop shell because it supports web frontends while providing a Rust native layer, small binaries, tray-style applications, and global shortcuts. citeturn472318search0turn472318search2turn472318search8

The desktop runtime is split into:

```text
React UI
  |
  +-- tray/menu UI
  +-- settings UI
  +-- recording UI
  +-- result preview
  |
Tauri command/event boundary
  |
Rust core
  +-- global shortcut
  +-- active application detection
  +-- text target integration
  +-- clipboard fallback
  +-- permission/status reporting
```

The Rust layer should not contain product copy or presentation logic.

## 12. Desktop text insertion strategy

### Windows

Prefer Microsoft UI Automation when a target control exposes an editable value/text interface. Microsoft documents `ValuePattern` for programmatically setting values and notes that TextPattern itself is read-only for editing, with direct keyboard input as a fallback. citeturn461618search1turn461618search3turn461618search5

Fallback order:

1. UI Automation value/text interface.
2. Clipboard + paste into the focused application.
3. Simulated keyboard input where safe and allowed.

### macOS

Prefer the Accessibility API to inspect and modify supported accessibility elements. `AXUIElementSetAttributeValue` can set an accessibility object's value when the focused control exposes a supported attribute. citeturn989601search4

Fallback order:

1. Accessibility API.
2. Clipboard + paste.
3. Simulated keyboard input where appropriate.

The application must clearly explain that macOS Accessibility permission is required for cross-application insertion.

## 13. Mobile architecture

### Android

Android's Input Method Editor (IME) framework is explicitly designed for alternative system-wide input methods, including software keyboards and speech input. A custom IME can extend `InputMethodService` and receive the current input session. citeturn989601search1turn989601search5

V1 should therefore treat the Android keyboard as the primary product surface rather than build a floating overlay.

### iOS/iPadOS

Apple's custom keyboard extensions interact with the current text field through `UITextDocumentProxy`, which provides methods such as `insertText` and `deleteBackward`. citeturn461618search2turn461618search7

Network-backed processing from a custom keyboard requires the user to enable **Allow Full Access**. Apple explicitly notes that this changes the keyboard's capabilities and privacy responsibilities. citeturn989601search0

V1 must make this requirement clear during onboarding.

## 14. Authentication

Use Supabase Auth for:

- email/password;
- optional OAuth providers later;
- device/session management;
- account recovery.

The keyboard and desktop client receive short-lived authenticated access and must never contain long-lived server secrets.

## 15. Observability

Track technical events without storing speech content unnecessarily:

```text
voice_session_started
first_transcript_received
final_transcript_received
cleanup_completed
insert_succeeded
insert_failed
permission_denied
provider_error
```

Include platform, app version, provider, duration and error code where useful.

Do not include transcript text in ordinary logs.

## 16. Reliability requirements

The voice session must recover from:

- microphone denial;
- audio interruptions;
- lost network;
- provider timeout;
- application losing focus;
- text target disappearing;
- clipboard failure;
- accessibility permission denial.

The user should always retain the final text in the product UI long enough to copy it manually after an insertion failure.

## 17. Architectural constraints

- No dependence on a specific speech provider.
- No raw-audio persistence by default.
- No cross-platform abstraction that hides fundamental operating-system differences.
- No requirement to launch the main application window for everyday dictation.
- No autonomous external action in V1.
- No aggressive rewriting by default.
