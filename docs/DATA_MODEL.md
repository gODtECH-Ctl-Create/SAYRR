# Voice Input Layer — V1 Data Model

## Design goals

The database stores user configuration and product metadata. It should not become an archive of everything the user says.

## Tables

### `profiles`

One row per authenticated user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | references Supabase Auth user |
| `display_name` | text | nullable |
| `default_locale` | text | e.g. `en-NG` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `vocabulary_entries`

User-specific words and preferred forms.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | owner |
| `term` | text | spoken or recognized term |
| `preferred_text` | text | inserted spelling |
| `category` | text | name, company, product, technical, local, other |
| `pronunciation_hint` | text | optional |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Recommended constraint: one normalized `term` per user.

### `preferences`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | unique owner |
| `auto_punctuation` | boolean | default true |
| `remove_fillers` | boolean | default true |
| `cleanup_enabled` | boolean | default true |
| `history_enabled` | boolean | default true |
| `default_locale` | text | default `en-NG` for Nigeria-first testing, configurable |
| `updated_at` | timestamptz | |

### `transcription_history`

Stores text, not raw audio.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | owner |
| `raw_text` | text | what the speech provider returned |
| `cleaned_text` | text | final output |
| `locale` | text | recognition locale |
| `source_platform` | text | android, ios, macos, windows, linux |
| `duration_ms` | integer | session length |
| `created_at` | timestamptz | |

This table should be written only when history is enabled.

### `usage_events`

Technical and billing-oriented usage information.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | owner |
| `event_type` | text | typed event name |
| `platform` | text | client platform |
| `duration_ms` | integer | nullable |
| `characters` | integer | nullable |
| `error_code` | text | nullable |
| `created_at` | timestamptz | |
| `metadata` | jsonb | non-sensitive technical metadata only |

## Row Level Security

Every user-owned table must use Row Level Security (RLS).

Policy pattern:

```text
user_id = auth.uid()
```

Server-side administrative jobs must use tightly scoped service credentials and must not become the default path for client reads.

## Indexes

Minimum indexes:

- `profiles.user_id` unique
- `vocabulary_entries.user_id`
- `vocabulary_entries.user_id, normalized_term` unique
- `preferences.user_id` unique
- `transcription_history.user_id, created_at desc`
- `usage_events.user_id, created_at desc`
- `usage_events.event_type, created_at desc`

## Retention

Recommended initial policy:

- Raw audio: not stored.
- History: controlled by `history_enabled` and explicit user deletion.
- Usage events: retain only for operational/analytics needs.
- Metadata: exclude content that could reconstruct the user's speech.

## Future tables

Potential later additions:

- `devices`
- `subscriptions`
- `style_profiles`
- `action_intents`
- `integrations`
- `command_runs`

These are deliberately excluded from the V1 schema until the corresponding product features exist.
