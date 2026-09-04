import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { cleanupTranscript } from "@sayrr/cleanup";
import type { SpeechProvider } from "@sayrr/voice-core";
import { DeepgramFluxProviderFactory } from "@sayrr/speech-deepgram";

import "./styles.css";
import { startMicrophoneCapture, type AudioCaptureSession } from "./audio-capture";

const SAMPLE_TEXT =
  "um, I’ll send the proposal tomorrow morning please remind me if I forget";
const PLACEHOLDER = "Your transcript will appear here.";

type TargetSnapshot = {
  supported: boolean;
  application?: string;
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("SAYRR app root is missing");

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="mark">S</span><span>SAYRR</span></div>
      <button id="close" class="icon-button" aria-label="Close">×</button>
    </header>

    <section class="hero">
      <p class="eyebrow">VOICE INPUT</p>
      <h1 id="status">Ready when you are.</h1>
      <p id="hint" class="hint">Press <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>Space</kbd> to start.</p>
    </section>

    <section class="transcript-wrap">
      <div id="transcript" class="transcript placeholder">${PLACEHOLDER}</div>
    </section>

    <div class="actions">
      <button id="listen" class="primary"><span class="dot"></span><span id="listen-label">Start listening</span></button>
      <button id="demo" class="secondary">Demo cleanup</button>
      <button id="insert" class="secondary" disabled>Insert</button>
    </div>

    <footer><span id="provider">Speech provider: browser prototype</span><span id="target">Target: not captured yet</span></footer>
  </main>
`;

const state: {
  listening: boolean;
  finalText: string;
  recognition: SpeechRecognition | null;
  provider: SpeechProvider | null;
  audio: AudioCaptureSession | null;
  target: TargetSnapshot | null;
} = {
  listening: false,
  finalText: "",
  recognition: null,
  provider: null,
  audio: null,
  target: null,
};

function setStatus(title: string, hint: string): void {
  document.querySelector("#status")!.textContent = title;
  document.querySelector("#hint")!.textContent = hint;
}

function setProviderLabel(value: string): void {
  document.querySelector("#provider")!.textContent = `Speech provider: ${value}`;
}

function setTarget(snapshot: TargetSnapshot | null): void {
  state.target = snapshot;
  const element = document.querySelector("#target")!;
  if (!snapshot) {
    element.textContent = "Target: not captured yet";
    return;
  }
  element.textContent = snapshot.application
    ? `Target: ${snapshot.application}`
    : "Target: fallback mode";
}

function setTranscript(text: string, placeholder = false): void {
  const element = document.querySelector<HTMLDivElement>("#transcript")!;
  const value = text || PLACEHOLDER;
  element.textContent = value;
  element.classList.toggle("placeholder", placeholder || !text);
  (document.querySelector("#insert") as HTMLButtonElement).disabled = !text;
}

function setListeningUi(listening: boolean, label = listening ? "Listening…" : "Start listening"): void {
  state.listening = listening;
  document.querySelector("#listen-label")!.textContent = label;
  document.querySelector("#listen")!.classList.toggle("active", listening);
}

function stopBrowserRecognition(): void {
  state.recognition?.stop();
  state.recognition = null;
  setListeningUi(false);
}

async function stopAudioCapture(): Promise<void> {
  const audio = state.audio;
  state.audio = null;
  if (audio) await audio.stop();
}

function clean(text: string): string {
  return cleanupTranscript(text, {
    autoPunctuation: true,
    removeFillers: true,
  }).text;
}

async function startDeepgramListening(): Promise<boolean> {
  const tokenUrl = import.meta.env.VITE_SAYRR_SPEECH_TOKEN_URL;
  if (!tokenUrl) return false;

  setProviderLabel("Deepgram Flux");

  const provider = new DeepgramFluxProviderFactory({
    model: import.meta.env.VITE_SAYRR_SPEECH_MODEL ?? "flux-general-en",
    sampleRate: 16000,
    keyterms: ["SAYRR", "Supabase", "Vercel", "WhatsApp", "Slack", "Discord"],
    tokenFactory: async () => {
      const response = await fetch(tokenUrl, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(`Speech token request failed (${response.status})`);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as { access_token?: string };
        if (!data.access_token) throw new Error("Speech token response did not include access_token");
        return data.access_token;
      }
      const token = (await response.text()).trim();
      if (!token) throw new Error("Speech token response was empty");
      return token;
    },
  }).create({
    onPartial(text) {
      setTranscript(clean(text), false);
    },
    onFinal(text) {
      state.finalText = clean(text);
      setTranscript(state.finalText, false);
      setListeningUi(false);
      setStatus("Text ready.", "Insert it into the application you were using before SAYRR opened.");
      void stopAudioCapture();
      provider.cancel();
      state.provider = null;
    },
    onError(error) {
      console.error(error);
      setListeningUi(false);
      void stopAudioCapture();
      state.provider = null;
      setStatus("Speech connection failed.", "Your text is not lost. Try again or use the demo path.");
    },
  });

  state.provider = provider;

  try {
    await provider.start({
      locale: navigator.language || "en-NG",
      cleanupEnabled: true,
      removeFillers: true,
      autoPunctuation: true,
    });

    state.audio = await startMicrophoneCapture({
      sampleRate: 16000,
      onChunk(chunk) {
        try {
          provider.sendAudio(chunk);
        } catch (error) {
          console.error(error);
        }
      },
    });

    setListeningUi(true);
    setStatus("Listening…", "Speak naturally. SAYRR is transcribing in real time.");
    setTranscript("", true);
    return true;
  } catch (error) {
    console.error(error);
    provider.cancel();
    state.provider = null;
    await stopAudioCapture();
    setStatus("Speech provider unavailable.", "Falling back to the local browser prototype.");
    setProviderLabel("browser prototype");
    return false;
  }
}

function startBrowserListening(): void {
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Recognition) {
    setStatus("Speech recognition unavailable.", "Use Demo cleanup while a speech provider is configured.");
    return;
  }

  stopBrowserRecognition();
  const recognition = new Recognition();
  recognition.lang = navigator.language || "en-NG";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    setProviderLabel("browser prototype");
    setListeningUi(true);
    setStatus("Listening…", "Speak naturally. SAYRR will prepare clean text.");
    setTranscript("", true);
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let text = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      text += event.results[index][0].transcript;
    }
    const cleaned = clean(text);
    setTranscript(cleaned, false);
    if (event.results[event.results.length - 1]?.isFinal) state.finalText = cleaned;
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    stopBrowserRecognition();
    setStatus("Couldn’t hear that.", `Speech error: ${event.error}. Check microphone permission and try again.`);
  };

  recognition.onend = () => {
    state.recognition = null;
    setListeningUi(false);
    const text = (document.querySelector("#transcript")!.textContent ?? "").trim();
    if (text && text !== PLACEHOLDER) {
      state.finalText = text;
      setStatus("Text ready.", "Insert it into the application you were using before SAYRR opened.");
    }
  };

  state.recognition = recognition;
  recognition.start();
}

async function startListening(): Promise<void> {
  if (state.listening) return;
  const usedProductionProvider = await startDeepgramListening();
  if (!usedProductionProvider) startBrowserListening();
}

async function cancelListening(): Promise<void> {
  stopBrowserRecognition();
  if (state.provider) {
    state.provider.cancel();
    state.provider = null;
  }
  await stopAudioCapture();
}

async function captureTarget(): Promise<void> {
  try {
    const target = await invoke<TargetSnapshot>("capture_active_target");
    setTarget(target);
  } catch (error) {
    console.error("Unable to capture active target", error);
    setTarget({ supported: false });
  }
}

async function insertText(): Promise<void> {
  const text = state.finalText || (document.querySelector("#transcript")!.textContent ?? "").trim();
  if (!text || text === PLACEHOLDER) return;

  await cancelListening();
  const win = getCurrentWindow();
  await win.hide();
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  await writeText(text);

  try {
    await invoke("paste_text");
    state.finalText = "";
    setTranscript("", true);
  } catch (error) {
    console.error(error);
    await win.show();
    await win.setFocus();
    setStatus("Copied to clipboard.", "Direct insertion was unavailable. Paste with Ctrl/Cmd+V.");
  }
}

async function activate(): Promise<void> {
  await captureTarget();
  await startListening();
}

async function registerGlobalShortcut(): Promise<void> {
  const shortcut = "CommandOrControl+Shift+Space";
  await unregister(shortcut).catch(() => undefined);
  await register(shortcut, () => {
    void activate();
  });
}

document.querySelector("#listen")!.addEventListener("click", () => {
  if (state.listening) void cancelListening();
  else void startListening();
});

document.querySelector("#demo")!.addEventListener("click", () => {
  state.finalText = clean(SAMPLE_TEXT);
  setProviderLabel("deterministic demo");
  setTranscript(state.finalText);
  setStatus("Text ready.", "This demo validates cleanup before insertion.");
});

document.querySelector("#insert")!.addEventListener("click", () => {
  void insertText();
});

document.querySelector("#close")!.addEventListener("click", () => {
  void cancelListening().finally(() => getCurrentWindow().hide());
});

void registerGlobalShortcut().catch((error) => {
  console.error("Unable to register SAYRR shortcut", error);
  setStatus("Shortcut unavailable.", "Use the Start listening button to continue the prototype.");
});
