import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { cleanupTranscript } from "@sayrr/cleanup";

import "./styles.css";

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

const state = {
  listening: false,
  finalText: "",
  recognition: null as SpeechRecognition | null,
  target: null as TargetSnapshot | null,
};

function setStatus(title: string, hint: string): void {
  document.querySelector("#status")!.textContent = title;
  document.querySelector("#hint")!.textContent = hint;
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

function stopRecognition(): void {
  state.recognition?.stop();
  state.recognition = null;
  state.listening = false;
  document.querySelector("#listen-label")!.textContent = "Start listening";
  document.querySelector("#listen")!.classList.remove("active");
}

function clean(text: string): string {
  return cleanupTranscript(text, {
    autoPunctuation: true,
    removeFillers: true,
  }).text;
}

function startListening(): void {
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (!Recognition) {
    setStatus(
      "Speech recognition unavailable.",
      "Use Demo cleanup while the production speech provider is being connected.",
    );
    return;
  }

  stopRecognition();
  const recognition = new Recognition();
  recognition.lang = navigator.language || "en-NG";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    state.listening = true;
    document.querySelector("#listen-label")!.textContent = "Listening…";
    document.querySelector("#listen")!.classList.add("active");
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
    if (event.results[event.results.length - 1]?.isFinal) {
      state.finalText = cleaned;
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    stopRecognition();
    setStatus(
      "Couldn’t hear that.",
      `Speech error: ${event.error}. Check microphone permission and try again.`,
    );
  };

  recognition.onend = () => {
    state.listening = false;
    state.recognition = null;
    document.querySelector("#listen-label")!.textContent = "Start listening";
    document.querySelector("#listen")!.classList.remove("active");
    const text = (document.querySelector("#transcript")!.textContent ?? "").trim();
    if (text && text !== PLACEHOLDER) {
      state.finalText = text;
      setStatus("Text ready.", "Insert it into the application you were using before SAYRR opened.");
    }
  };

  state.recognition = recognition;
  recognition.start();
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

  const win = getCurrentWindow();
  await win.hide();
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  await writeText(text);

  try {
    await invoke("paste_text");
  } catch (error) {
    console.error(error);
    await win.show();
    await win.setFocus();
    setStatus("Copied to clipboard.", "Direct insertion was unavailable. Paste with Ctrl/Cmd+V.");
    return;
  }

  state.finalText = "";
  setTranscript("", true);
  setStatus("Inserted.", "SAYRR placed the text into the captured target.");
}

async function activate(): Promise<void> {
  await captureTarget();
  const win = getCurrentWindow();
  await win.show();
  await win.setFocus();
  startListening();
}

async function registerGlobalShortcut(): Promise<void> {
  const shortcut = "CommandOrControl+Shift+Space";
  await unregister(shortcut).catch(() => undefined);
  await register(shortcut, () => {
    void activate();
  });
}

document.querySelector("#listen")!.addEventListener("click", () => {
  if (state.listening) stopRecognition();
  else startListening();
});

document.querySelector("#demo")!.addEventListener("click", () => {
  state.finalText = clean(SAMPLE_TEXT);
  setTranscript(state.finalText);
  setStatus("Text ready.", "This demo validates cleanup before insertion.");
});

document.querySelector("#insert")!.addEventListener("click", () => {
  void insertText();
});

document.querySelector("#close")!.addEventListener("click", () => {
  stopRecognition();
  void getCurrentWindow().hide();
});

void registerGlobalShortcut().catch((error) => {
  console.error("Unable to register SAYRR shortcut", error);
  setStatus("Shortcut unavailable.", "Use the Start listening button to continue the prototype.");
});
