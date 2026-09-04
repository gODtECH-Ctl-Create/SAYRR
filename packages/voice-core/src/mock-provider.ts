import type { VoiceSessionConfig } from "@sayrr/contracts";
import type { SpeechProvider, SpeechProviderEvents, SpeechProviderFactory } from "./provider";

export interface MockSpeechProviderOptions {
  transcript?: string;
  partialDelayMs?: number;
}

export class MockSpeechProvider implements SpeechProvider {
  readonly id = "mock";
  private readonly events: SpeechProviderEvents;
  private readonly options: Required<MockSpeechProviderOptions>;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private cancelled = false;

  constructor(events: SpeechProviderEvents, options: MockSpeechProviderOptions = {}) {
    this.events = events;
    this.options = {
      transcript: options.transcript ?? "I will send the proposal tomorrow morning",
      partialDelayMs: options.partialDelayMs ?? 120,
    };
  }

  start(_config: VoiceSessionConfig): void {
    this.cancelled = false;
  }

  sendAudio(_chunk: Uint8Array): void {
    if (this.cancelled || this.timer) return;

    this.timer = setTimeout(() => {
      if (this.cancelled) return;
      const words = this.options.transcript.split(/\s+/).filter(Boolean);
      let partial = "";
      for (const [index, word] of words.entries()) {
        partial = `${partial}${partial ? " " : ""}${word}`;
        this.events.onPartial(partial);
        if (index === words.length - 1) {
          this.events.onFinal(partial);
        }
      }
      this.timer = null;
    }, this.options.partialDelayMs);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  cancel(): void {
    this.cancelled = true;
    this.stop();
  }
}

export class MockSpeechProviderFactory implements SpeechProviderFactory {
  constructor(private readonly options: MockSpeechProviderOptions = {}) {}

  create(events: SpeechProviderEvents): SpeechProvider {
    return new MockSpeechProvider(events, this.options);
  }
}
