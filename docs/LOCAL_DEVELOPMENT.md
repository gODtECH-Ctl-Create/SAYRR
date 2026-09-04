# SAYRR local development

## Prerequisites

- Node.js 22+
- pnpm 11.1.1+
- Rust toolchain for Tauri desktop builds
- Tauri system dependencies for the host operating system

## Install

```bash
corepack enable
corepack prepare pnpm@11.1.1 --activate
pnpm install
```

## Desktop development

From the repository root:

```bash
pnpm desktop:dev
```

Build the desktop application:

```bash
pnpm desktop:build
```

## Speech modes

Without `VITE_SAYRR_SPEECH_TOKEN_URL`, the desktop app uses its browser speech prototype.

For Deepgram Flux, copy `apps/desktop/.env.example` to an `.env` file and point `VITE_SAYRR_SPEECH_TOKEN_URL` at the deployed `deepgram-token` Supabase Edge Function.

The desktop client receives a short-lived token. Never place `DEEPGRAM_API_KEY` in the desktop `.env`, frontend source, or any committed file.

## Supabase speech token function

Required function secret:

```text
DEEPGRAM_API_KEY=...
```

The function also needs the standard Supabase environment values provided by the Edge Functions runtime.

## Validation

Run the workspace type-check:

```bash
pnpm typecheck
```

Before calling Phase 1 complete, validate the real insertion loop against the targets in GitHub Issue #9.
