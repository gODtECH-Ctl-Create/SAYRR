# Voice Input Layer — Platform Architecture

This document turns the system architecture into concrete platform responsibilities.

## 1. Platform matrix

| Platform | V1 surface | Activation | Text insertion | Priority |
|---|---|---|---|---|
| Android | System keyboard / Input Method Editor (IME) | Keyboard microphone | IME input connection | P0 |
| iOS/iPadOS | Custom keyboard extension | Keyboard microphone | `UITextDocumentProxy` | P0 |
| macOS | Resident desktop app + floating launcher | Global shortcut / launcher | Accessibility API, clipboard, keyboard fallback | P0 |
| Windows | Resident desktop app + floating launcher | Global shortcut / launcher | UI Automation, clipboard, keyboard fallback | P0 |
| Linux | Resident desktop app | Global shortcut first | Desktop-specific adapters | P2 |

## 2. Mobile is not a floating-overlay product

The default mobile product surface should replace or augment the user's keyboard, not compete with the operating system's existing microphone affordance.

The advantage comes from replacing the basic dictation path with our own pipeline:

```text
Existing keyboard
     |
     X basic dictation

Our keyboard
     |
     +-- voice capture
     +-- better recognition
     +-- vocabulary
     +-- cleanup
     +-- insert
```

This makes the product useful even when a phone already provides speech-to-text.

## 3. Android

Android provides an Input Method Editor framework for system-wide alternative input methods. Implement the V1 keyboard using a service derived from `InputMethodService`. Android's input method documentation explicitly covers creating custom input methods and sending text to the application. citeturn989601search5turn989601search1

### Android components

```text
Android App
├── SetupActivity
├── SettingsActivity
├── VoiceKeyboardService : InputMethodService
├── VoiceSessionController
├── SpeechClient
├── VocabularyStore
└── AccountStore
```

### Keyboard lifecycle

```text
System selects keyboard
       |
 onStartInput
       |
 create/update keyboard view
       |
 user taps Voice
       |
 start voice session
       |
 receive transcript
       |
 insertText through current input connection
```

The keyboard must support switching to other installed input methods and behave like a normal keyboard. Android specifically recommends making switching accessible from the input method UI. citeturn989601search5

### Android data policy

Do not store all keystrokes. Voice sessions are explicit user actions. Only session outputs required by enabled history functionality should leave the device.

## 4. iOS/iPadOS

Implement a custom keyboard extension. Apple provides `UITextDocumentProxy` for inserting and deleting text in the active input view. citeturn461618search2turn461618search7

### iOS components

```text
Containing App
├── Onboarding
├── Account
├── Settings
├── Vocabulary
└── History

Keyboard Extension
├── KeyboardViewController
├── VoiceSessionController
├── SpeechClient
├── VocabularyResolver
└── TextInsertionController
```

### Full Access

A network-backed keyboard requires the user to enable **Allow Full Access**. Apple documents that custom keyboards without open access cannot use the network or microphone; with open access enabled, the keyboard can send input for server-side processing. citeturn989601search0

V1 onboarding must show:

1. What the keyboard does.
2. Why Full Access is required for cloud processing.
3. What data is sent.
4. What is not stored by default.
5. How to disable the keyboard at any time.

## 5. macOS

The macOS client is a resident Tauri application.

### Main process responsibilities

```text
App lifecycle
Tray/menu bar
Global shortcut
Floating launcher
Permission state
Voice session
Text target adapter
```

### Active target flow

```text
Global shortcut
      |
      v
Inspect focused application
      |
      v
Locate focused text element
      |
      +---- supported ----> direct insertion
      |
      +---- unsupported --> clipboard + paste
                                 |
                                 +--> keyboard fallback
```

Apple's Accessibility API provides `AXUIElement` APIs for reading/manipulating supported UI elements; `AXUIElementSetAttributeValue` can set an accessibility object's attribute when the target exposes the appropriate writable attribute. citeturn989601search4

The product should fail closed: if the target cannot be identified confidently, do not paste into an unknown location.

## 6. Windows

The Windows client is the same Tauri product with a Windows-native bridge.

Microsoft UI Automation exposes text-oriented control patterns, including Value and Text patterns. Value can provide a way to set editable values, while TextPattern itself does not provide modification and some controls require direct keyboard input. citeturn461618search1turn461618search3turn461618search4

### Windows insertion chain

```text
Focused target
      |
      v
UI Automation
      |
      +--> ValuePattern / writable target
      |
      +--> Legacy accessibility where supported
      |
      +--> Clipboard + paste
      |
      +--> SendInput / keyboard fallback
```

This layered approach matters because modern applications use different UI technologies and not every text editor exposes a uniform writable automation interface. Microsoft also documents that UI Automation coverage varies by framework and that some rich editors require keyboard input. citeturn461618search5

## 7. Linux

Linux should not be treated as a single text-input target. Desktop environments, display servers, accessibility stacks, and application toolkits differ.

V1 therefore targets Linux only after the macOS/Windows insertion pipeline is stable.

## 8. Desktop floating launcher

The floating launcher is a convenience surface, not the source of truth for activation.

Every desktop build must also support a global shortcut because:

- the floating launcher can be obscured;
- some applications redraw their content frequently;
- window geometry may be unavailable;
- some text fields cannot be inspected through accessibility APIs.

The floating launcher should be shown only when the desktop adapter can identify a plausible text target.

## 9. Desktop position strategy

The launcher should aim to sit near the focused text field, but this must be adaptive.

Priority:

1. exact text-field rectangle from accessibility/UI automation;
2. active-window lower input-area estimate;
3. last known position;
4. fixed screen-edge location.

The fallback must never imply that insertion is guaranteed.

## 10. Shared UX contract

Across every platform, the user should understand the same state vocabulary:

```text
Ready
Listening
Transcribing
Cleaning
Ready to insert
Inserted
Could not insert
```

The visual treatment can differ by platform, but the semantics should remain consistent.

## 11. Shared settings contract

The mobile and desktop clients should consume the same logical settings model:

```text
defaultLocale
autoPunctuation
removeFillers
cleanupEnabled
historyEnabled
```

Platform-specific settings remain local:

```text
mobile.keyboardChoice
mobile.fullAccessStatus
desktop.globalShortcut
desktop.showFloatingLauncher
desktop.accessibilityPermission
```

## 12. Native bridge contract

The shared application layer should see a platform-neutral interface:

```text
PlatformAdapter
  getPlatformStatus()
  getFocusedTarget()
  beginVoiceSession()
  insertText(text)
  replaceSelection(text)
  copyText(text)
  openSettings()
```

Native implementations own permissions, system APIs, lifecycle quirks, and platform-specific errors.

## 13. Testing matrix

Every release candidate must be tested against representative applications.

### Messaging

- WhatsApp Desktop
- Discord
- Slack
- Telegram

### Browser

- Chrome text fields
- Edge text fields
- Safari text fields

### Productivity

- Google Docs
- Microsoft Word
- Notion
- Notes/text editors

### Artificial intelligence/chat

- ChatGPT desktop/web
- Claude web/app where applicable

The supported test matrix should be kept as versioned documentation because application accessibility behavior can change over time.
