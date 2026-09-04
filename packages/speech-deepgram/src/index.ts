import type { VoiceSessionConfig } from "@sayrr/contracts";
import type { SpeechProvider, SpeechProviderEvents, SpeechProviderFactory } from "@sayrr/voice-core";

export interface DeepgramFluxOptions {
  tokenFactory: () => Promise<string>;
  model?: "flux-general-en" | "flux-general-multi";
  sampleRate?: 8000 | 16000 | 24000 | 32000 | 44100 | 48000;
  keyterms?: string[];
  endpoint?: string;
}

interface TurnInfoMessage {
  type: "TurnInfo";
  event: "Update" | "EagerEndOfTurn" | "TurnResumed" | "EndOfTurn";
  transcript?: string;
  sequence_id?: number;
}

interface ErrorMessage {
  type: "Error";
  code?: string;
  description?: string;
}

export class DeepgramFluxProvider implements SpeechProvider {
  readonly id = "deepgram-flux";
  private socket: WebSocket | null = null;
  private readonly events: SpeechProviderEvents;
  private readonly options: Required<Omit<DeepgramFluxOptions, "keyterms" | "tokenFactory" | "endpoint">> &
    Pick<DeepgramFluxOptions, "keyterms" | "tokenFactory" | "endpoint">;
  private closedByUs = false;

  constructor(events: SpeechProviderEvents, options: DeepgramFluxOptions) {
    this.events = events;
    this.options = {
      model: options.model ?? "flux-general-en",
      sampleRate: options.sampleRate ?? 16000,
      keyterms: options.keyterms ?? [],
      tokenFactory: options.tokenFactory,
      endpoint: options.endpoint ?? "wss://api.deepgram.com/v2/listen",
    };
  }

  async start(config: VoiceSessionConfig): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const token = await this.options.tokenFactory();
    if (!token) throw new Error("Deepgram token factory returned an empty token");

    const params = new URLSearchParams({
      model: this.options.model,
      encoding: "linear16",
      sample_rate: String(this.options.sampleRate),
      tag: "sayrr-v1",
    });

    if (this.options.model === "flux-general-multi") {
      params.append("language_hint", config.locale);
    }

    for (const keyterm of this.options.keyterms) {
      if (keyterm.trim()) params.append("keyterm", keyterm.trim());
    }

    this.closedByUs = false;
    const socket = new WebSocket(`${this.options.endpoint}?${params.toString()}`, ["token", token]);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const handleOpen = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("Unable to connect to Deepgram Flux"));
      };
      const cleanup = () => {
        socket.removeEventListener("open", handleOpen);
        socket.removeEventListener("error", handleError);
      };
      socket.addEventListener("open", handleOpen, { once: true });
      socket.addEventListener("error", handleError, { once: true });
    });

    socket.addEventListener("message", (event) => this.handleMessage(event));
    socket.addEventListener("error", () => {
      if (!this.closedByUs) this.events.onError(new Error("Deepgram Flux socket error"));
    });
    socket.addEventListener("close", () => {
      if (!this.closedByUs) this.events.onError(new Error("Deepgram Flux connection closed unexpectedly"));
      if (this.socket === socket) this.socket = null;
    });
  }

  sendAudio(chunk: Uint8Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Deepgram Flux connection is not ready");
    }
    this.socket.send(chunk);
  }

  stop(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: "ForceEndTurn" }));
  }

  cancel(): void {
    this.closedByUs = true;
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "CloseStream" }));
      this.socket.close(1000, "cancelled");
    }
    this.socket = null;
  }

  private handleMessage(event: MessageEvent): void {
    if (typeof event.data !== "string") return;

    let message: TurnInfoMessage | ErrorMessage;
    try {
      message = JSON.parse(event.data) as TurnInfoMessage | ErrorMessage;
    } catch {
      this.events.onError(new Error("Deepgram Flux returned invalid JSON"));
      return;
    }

    if (message.type === "Error") {
      this.events.onError(new Error(`${message.code ?? "DEEPGRAM_ERROR"}: ${message.description ?? "Unknown error"}`));
      return;
    }

    if (message.type !== "TurnInfo" || !message.transcript) return;

    if (message.event === "EndOfTurn") {
      this.events.onFinal(message.transcript.trim());
      return;
    }

    if (message.event === "Update" || message.event === "EagerEndOfTurn" || message.event === "TurnResumed") {
      this.events.onPartial(message.transcript.trim());
    }
  }
}

export class DeepgramFluxProviderFactory implements SpeechProviderFactory {
  constructor(private readonly options: DeepgramFluxOptions) {}

  create(events: SpeechProviderEvents): SpeechProvider {
    return new DeepgramFluxProvider(events, this.options);
  }
}
