# Voice Input Layer — Development Workflow

## Branching

Use short-lived branches for implementation work:

```text
main
  |
  +-- feat/voice-core
  +-- feat/desktop-macos-spike
  +-- feat/desktop-windows-spike
  +-- feat/android-ime-spike
  +-- feat/ios-keyboard-spike
```

Merge completed work through pull requests after the relevant checks pass.

## Issue workflow

Each meaningful implementation unit should have a GitHub Issue containing:

- goal;
- scope;
- dependencies;
- acceptance criteria;
- test plan;
- definition of done.

## Definition of done

A task is complete only when:

1. Implementation is committed.
2. Type checks/builds pass for the affected surface.
3. Real target behavior is tested where applicable.
4. Privacy and permission behavior matches the documentation.
5. No secret or generated build artifact is committed.
6. Documentation is updated where behavior or architecture changed.

## Provider changes

Speech-provider work must remain behind the shared provider contract. Provider-specific types belong inside the provider adapter and must not leak into application/domain code.

## Native changes

Platform-specific code belongs in the relevant native adapter. Shared business logic stays in TypeScript where practical.

## Product discipline

Do not expand V1 into autonomous actions before the basic voice insertion loop is reliable.
