# Supabase

Supabase will provide authentication and PostgreSQL-backed product data for Voice Input Layer.

Initial planned tables:

- `profiles`
- `vocabulary_entries`
- `preferences`
- `transcription_history`
- `usage_events`

All user-owned tables require Row Level Security (RLS). The project should not persist raw audio by default.

Add migrations here as the schema is implemented.
