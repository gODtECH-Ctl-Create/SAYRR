import type {
  CleanupResult,
  TranscriptEvent,
  VoiceSessionConfig,
  VoiceSessionState,
} from "@sayrr/contracts";

export interface VoiceSessionSnapshot {
  id: string;
  state: VoiceSessionState;
  config: VoiceSessionConfig;
  partialText: string;
  finalText: string;
  cleanedText?: string;
  startedAt?: string;
  finishedAt?: string;
  errorCode?: string;
}

export type VoiceSessionListener = (snapshot: VoiceSessionSnapshot) => void;

function now(): string {
  return new Date().toISOString();
}

export class VoiceSessionController {
  private snapshot: VoiceSessionSnapshot;
  private readonly listeners = new Set<VoiceSessionListener>();

  constructor(id: string, config: VoiceSessionConfig) {
    this.snapshot = {
      id,
      state: "idle",
      config,
      partialText: "",
      finalText: "",
    };
  }

  getSnapshot(): VoiceSessionSnapshot {
    return { ...this.snapshot };
  }

  subscribe(listener: VoiceSessionListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  start(): void {
    this.transition("starting");
  }

  microphoneReady(): void {
    this.transition("listening", { startedAt: this.snapshot.startedAt ?? now() });
  }

  receiveTranscript(event: TranscriptEvent): void {
    if (this.snapshot.state !== "listening" && this.snapshot.state !== "transcribing") {
      throw new Error(`Cannot receive transcript while session is ${this.snapshot.state}`);
    }

    const nextState: VoiceSessionState = event.isFinal ? "processing" : "transcribing";

    this.transition(nextState, {
      partialText: event.isFinal ? this.snapshot.partialText : event.text,
      finalText: event.isFinal ? event.text : this.snapshot.finalText,
    });
  }

  cleaned(result: CleanupResult): void {
    if (this.snapshot.state !== "processing") {
      throw new Error(`Cannot clean while session is ${this.snapshot.state}`);
    }

    this.transition("ready", {
      cleanedText: result.text,
      finishedAt: now(),
    });
  }

  inserted(): void {
    if (this.snapshot.state !== "ready") {
      throw new Error(`Cannot insert while session is ${this.snapshot.state}`);
    }
    this.transition("inserted");
  }

  cancel(): void {
    if (this.snapshot.state === "inserted" || this.snapshot.state === "cancelled") return;
    this.transition("cancelled", { finishedAt: now() });
  }

  fail(errorCode: string): void {
    this.transition("error", { errorCode, finishedAt: now() });
  }

  reset(): void {
    this.snapshot = {
      id: this.snapshot.id,
      state: "idle",
      config: this.snapshot.config,
      partialText: "",
      finalText: "",
    };
    this.emit();
  }

  private transition(
    state: VoiceSessionState,
    patch: Partial<Omit<VoiceSessionSnapshot, "id" | "state">> = {},
  ): void {
    this.snapshot = { ...this.snapshot, ...patch, state };
    this.emit();
  }

  private emit(): void {
    const current = this.getSnapshot();
    this.listeners.forEach((listener) => listener(current));
  }
}
