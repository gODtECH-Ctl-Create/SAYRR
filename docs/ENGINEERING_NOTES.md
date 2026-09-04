# Engineering Notes

## First implementation principle

Do not start with a complete keyboard. First prove the voice pipeline and text-target insertion on one platform.

## Recommended first vertical slice

```text
Desktop test harness
 -> microphone
 -> streaming speech provider
 -> cleanup
 -> insert into a local text field
```

Once this works reliably, the same session and cleanup contracts move into the production Tauri shell and then mobile keyboard surfaces.

## Why desktop first for the vertical slice

The desktop path is the main product opportunity identified for V1 and makes insertion behavior measurable outside the constraints of a mobile keyboard extension.

The mobile products can reuse the same backend/provider contracts after the core behavior is stable.

## Do not optimize prematurely

V1 should not build a large local speech model, offline inference stack, or autonomous agent framework before real usage demonstrates the need.

Start with a provider adapter and keep local/offline recognition as a future provider option.
