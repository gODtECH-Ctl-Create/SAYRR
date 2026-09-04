# Voice Input Layer — V1 API Contract

The API is designed around an explicit voice session. Clients should be able to stream audio/transcript updates without knowing which speech provider is used behind the service.

## Authentication

All user endpoints require an authenticated Supabase user session.

Server-side provider credentials are never exposed to clients.

## Voice session lifecycle

### `POST /v1/sessions`

Creates a voice session.

Request:

```json
{
  "locale": "en-NG",
  "platform": "windows",
  "cleanupEnabled": true,
  "removeFillers": true,
  "autoPunctuation": true
}
```

Response:

```json
{
  "sessionId": "uuid",
  "state": "starting",
  "expiresAt": "2026-09-04T00:00:00Z"
}
```

## Streaming audio

The preferred production implementation is a persistent streaming channel, such as WebSocket, from the client to a voice gateway.

Conceptual messages:

```json
{
  "type": "audio",
  "sequence": 14,
  "payload": "...binary/audio frame..."
}
```

Server events:

```json
{
  "type": "transcript.partial",
  "sequence": 22,
  "text": "I'll send the proposal"
}
```

```json
{
  "type": "transcript.final",
  "sequence": 29,
  "text": "I'll send the proposal tomorrow morning."
}
```

## Finish session

### `POST /v1/sessions/:id/finish`

Signals that recording has ended.

Response:

```json
{
  "sessionId": "uuid",
  "state": "processing"
}
```

The final cleanup result may be emitted through the streaming connection or retrieved with a subsequent request.

## Cleanup

### `POST /v1/cleanup`

```json
{
  "text": "um send the proposal to chukwudi tomorrow morning",
  "locale": "en-NG",
  "vocabulary": [
    {
      "term": "Chukwudi",
      "preferredText": "Chukwudi"
    }
  ],
  "options": {
    "removeFillers": true,
    "autoPunctuation": true
  }
}
```

Response:

```json
{
  "text": "Send the proposal to Chukwudi tomorrow morning.",
  "confidence": 0.97,
  "changes": [
    {
      "type": "filler_removed",
      "before": "um send",
      "after": "Send"
    },
    {
      "type": "vocabulary",
      "before": "chukwudi",
      "after": "Chukwudi"
    }
  ],
  "warnings": []
}
```

## Vocabulary

### `GET /v1/vocabulary`

Returns the authenticated user's entries.

### `POST /v1/vocabulary`

```json
{
  "term": "Chukwudi",
  "preferredText": "Chukwudi",
  "category": "name",
  "pronunciationHint": "chook-woo-dee"
}
```

### `PATCH /v1/vocabulary/:id`

Updates a vocabulary entry.

### `DELETE /v1/vocabulary/:id`

Deletes a vocabulary entry.

## History

### `GET /v1/history`

Returns recent stored sessions only when history is enabled for the user.

### `DELETE /v1/history/:id`

Deletes one history entry.

### `DELETE /v1/history`

Clears all history for the authenticated user.

## Preferences

### `GET /v1/preferences`

### `PATCH /v1/preferences`

Example:

```json
{
  "autoPunctuation": true,
  "removeFillers": true,
  "cleanupEnabled": true,
  "historyEnabled": true,
  "defaultLocale": "en-NG"
}
```

## Errors

Use a consistent error envelope:

```json
{
  "error": {
    "code": "PROVIDER_TIMEOUT",
    "message": "Speech recognition timed out. Try again.",
    "retryable": true
  }
}
```

Core error codes:

- `AUTH_REQUIRED`
- `MIC_PERMISSION_DENIED`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_TIMEOUT`
- `SESSION_EXPIRED`
- `RATE_LIMITED`
- `TEXT_TARGET_UNAVAILABLE`
- `INSERTION_FAILED`
- `INTERNAL_ERROR`

## Idempotency

Client requests that can be retried should support an idempotency key, especially session creation and history mutation endpoints.

## Versioning

All public product API routes use `/v1/` and are versioned independently from the speech-provider API.
