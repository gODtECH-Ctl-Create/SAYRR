# Speech Provider Evaluation

The first speech provider has not been locked yet.

## Evaluation criteria

Score candidates on:

- streaming partial transcripts;
- final transcript quality;
- English accuracy;
- Nigerian English accuracy;
- latency;
- WebSocket or equivalent streaming support;
- browser/desktop/mobile compatibility;
- data retention controls;
- pricing at MVP scale;
- regional availability;
- reliability;
- ability to bias or contextualize vocabulary;
- contractual suitability for a keyboard/input product.

## Selection rule

Do not choose a provider only because its transcription demo sounds good. The winning provider must support the complete product flow: low-latency streaming, predictable client/server behavior, reasonable economics, and an acceptable privacy/data-retention posture.

## Architecture constraint

The product uses a `SpeechProvider` adapter. Provider selection is replaceable without changing the mobile keyboard, desktop insertion layer, or database model.

## Benchmark set

The provider benchmark should use a fixed anonymized evaluation set covering:

- ordinary Nigerian English;
- technical vocabulary;
- personal names;
- company names;
- common Nigerian place names;
- short and long messages;
- punctuation and mixed-case language;
- noisy/background audio scenarios.

Benchmark results should be committed as dated engineering evidence before the provider becomes the default.
