# Speech Provider Evaluation

## Initial implementation choice: Deepgram Flux

SAYRR V1 uses **Deepgram Flux** as the first production-oriented speech-to-text implementation while retaining a provider abstraction for future replacement.

The current Deepgram Flux API exposes turn-based streaming speech recognition over a WebSocket at `wss://api.deepgram.com/v2/listen`. The API supports `flux-general-en` and `flux-general-multi`, accepts raw audio with an explicit encoding/sample rate, emits incremental `TurnInfo` updates, and provides an `EndOfTurn` transcript event for completed turns. citeturn179024search1turn179024search3

Client connections must not contain SAYRR's long-lived Deepgram API key. Deepgram provides a token grant endpoint that issues a short-lived JSON Web Token (JWT) for client-side realtime connections; SAYRR therefore uses the Supabase `deepgram-token` function as the token broker. citeturn107531search0turn107531search1

## Why it fits V1

- Real-time streaming transcripts.
- Clear partial/final event model.
- Keyterm support for product names, technical terms, and user vocabulary. citeturn209918search3
- Temporary-token authentication for client-side connections. citeturn107531search0
- WebSocket transport matches SAYRR's low-latency desktop pipeline.

## What is not yet proven

This selection is an implementation decision, not a final benchmark result. We still need measured comparisons for:

- Nigerian English accuracy;
- African names and company names;
- noisy mobile/desktop microphones;
- latency from first audio to first useful transcript;
- transcription cost at SAYRR usage levels;
- retention and contractual requirements for production launch.

## Benchmark set

The provider benchmark must use a fixed anonymized evaluation set covering:

- ordinary Nigerian English;
- technical vocabulary;
- personal names;
- company names;
- common Nigerian place names;
- short and long messages;
- punctuation and mixed-case language;
- noisy/background audio scenarios.

Benchmark results should be committed as dated engineering evidence before production launch. Provider selection remains replaceable through the shared `SpeechProvider` contract.
