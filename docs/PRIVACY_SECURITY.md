# Voice Input Layer — Privacy & Security Baseline

## Purpose

Voice Input Layer handles microphone data and, depending on configuration, text that a user intends to enter into another application. This makes privacy a core product requirement.

## Default data handling

### Audio

Raw audio is **not stored by default**.

Audio should be streamed to the selected speech provider for the duration of the active voice session and discarded after processing, subject to provider behavior and contract.

The product must document any third-party provider retention that cannot be disabled.

### Transcripts

The cleaned transcript may be stored in history only when history is enabled.

Users must be able to:

- view history;
- delete individual history records;
- clear all history;
- disable history.

### Vocabulary

Personal vocabulary is user-owned configuration and must be isolated per authenticated user.

## Authentication

Supabase Auth is the intended identity layer.

Every user-owned database table must enforce Row Level Security (RLS) policies so one user cannot read or modify another user's vocabulary, preferences, history, or usage records.

## Secrets

Provider API keys and other server credentials must never be committed to the repository or embedded into client binaries.

Client applications authenticate to the product backend using user/session credentials, not provider master keys.

## Mobile keyboard privacy

Custom keyboards are sensitive because they sit in the text-entry path.

The product must clearly explain:

- why the keyboard exists;
- what data leaves the device;
- whether cloud processing is used;
- what history is retained;
- how a user can disable the keyboard.

On iOS, a network-backed custom keyboard requires the user to enable **Allow Full Access**. Apple's documentation explicitly describes the additional capabilities and trust implications of this mode. citeturn989601search0

## Desktop permissions

### macOS

Cross-application text insertion may require Accessibility permission. The onboarding flow must explain exactly why the permission is requested and provide a link to system settings.

### Windows

The application should request only the permissions required for its selected text insertion strategy.

## Logging

Never place these into ordinary logs:

- raw microphone audio;
- full transcript text;
- passwords;
- access tokens;
- API keys;
- sensitive text captured from applications.

Logs may contain:

```text
session id
platform
application version
provider name
latency measurements
error codes
permission state
```

## Telemetry

Technical telemetry should be event-based and minimize user content.

Example:

```text
voice_session_started
transcript_first_token
transcript_finalized
cleanup_completed
insert_succeeded
insert_failed
```

## Threat model

Primary threats:

1. Provider credential exposure.
2. Unauthorized access to user history/vocabulary.
3. Accidental capture of audio outside an active user-initiated session.
4. Accidental insertion into the wrong application or field.
5. Abuse of the public API causing financial or availability impact.
6. Local compromise of desktop application permissions.

## Safety controls

- Explicit microphone permission.
- Explicit user activation for voice capture.
- Clear listening indicator.
- Automatic stop after inactivity/time limit.
- Server authentication and rate limiting.
- Row Level Security for user data.
- No automatic external action in V1.
- Target-confidence checks before desktop insertion.
- Manual copy fallback after insertion failure.

## Data retention baseline

Recommended initial defaults:

- raw audio: 0 days / transient only;
- transcription history: retained only when enabled;
- deleted history: hard delete from application database where technically appropriate;
- logs: short operational retention with no transcript content.

Actual retention periods should be finalized before public beta after reviewing provider policies and applicable law.
