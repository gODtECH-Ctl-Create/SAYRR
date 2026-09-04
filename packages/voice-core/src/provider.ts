import type { VoiceSessionConfig } from "@sayrr/contracts";

export interface SpeechProvider {
  readonly id: string;
  start(config: VoiceSessionConfig): Promise<void> | void;
  sendAudio(chunk: Uint8Array): Promise<void> | void;
  stop(): Promise<void> | void;
  cancel(): Promise<void> | void;
}

export interface SpeechProviderEvents {
  onPartial(text: string): void;
  onFinal(text: string): void;
  onError(error: Error): void;
}

export interface SpeechProviderFactory {
  create(events: SpeechProviderEvents): SpeechProvider;
}
