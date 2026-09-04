import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { invoke } from "@tauri-apps/api/core";

import "./styles.css";

const SAMPLE_TEXT =
  "I’ll send the proposal tomorrow morning. Please remind me if I forget.";

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
      <div id="transcript" class="transcript placeholder">Your transcript will appear here.</div>
    </section>

    <div class="actions">
      <button id="listen" class="primary"><span class="dot"></span><span id="listen-label">Start listening</span></button>
      <button id="demo" class="secondary">Demo transcript</button>
      <button id="insert" class="secondary" disabled>Insert</button>
    </div>

    <footer><span id="provider">Speech provider: browser prototype</span><span id="target">Text target: not checked</span></footer>
  </main>
`;

const state = {
  listening: false,
  finalText: "",
  recognition: null as SpeechRecognition | null,
};

function setStatus(title: string, hint: string): void {
  document.querySelector("#status")!.textContent = title;
  document.querySelector("#hint")!.textContent = hint;
}

function setTranscript(text: string, placeholder = false): void {
  const el = document.querySelector<HTMLDivElement>("#transcript")!;
  el.textContent = text || "Your transcript will appear here.";
  el.classList.toggle("placeholder", placeholder || !text);
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
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim()
    .replace(/^\s*([a-z])/i, (_, c: string) => c.toUpperCase());
}

function startListening(): void {
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (!Recognition) {
    setStatus("Speech recognition unavailable.", "Use Demo transcript while we connect the production speech provider.");
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
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      text += event.results[i][0].transcript;
    }
    const cleaned = clean(text);
    setTranscript(cleaned, false);
    if (event.results[event.results.length - 1]?.isFinal) {
      state.finalText = cleaned;
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    stopRecognition();
    setStatus("Couldn’t hear that.", `Speech error: ${event.error}. Check microphone permission and try again.`);
  };

  recognition.onend = () => {
    state.listening = false;
    state.recognition = null;
    document.querySelector("#listen-label")!.textContent = "Start listening";
    document.querySelector("#listen")!.classList.remove("active");
    const text = (document.querySelector("#transcript")!.textContent ?? "").trim();
    if (text && text !== "Your transcript will appear here.") {
      state.finalText = text;
      setStatus("Text ready.", "Insert it into the active app or keep editing here.");
    }
  };

  state.recognition = recognition;
  recognition.start();
}

async function insertText(): Promise<void> {
  const text = state.finalText || (document.querySelector("#transcript")!.textContent ?? "").trim();
  if (!text || text === "Your transcript will appear here.") return;

  await writeText(text);
  try {
    await invoke("paste_text");
    setStatus("Inserted.", "SAYRR placed the text into the active application.");
  } catch (error) {
    setStatus("Copied to clipboard.", "Direct insertion was unavailable. Paste with Ctrl/Cmd+V.");
    console.error(error);
  }
}

async function registerGlobalShortcut(): Promise<void> {
  await unregister("CommandOrControl+Shift+Space").catch(() => undefined);
  await register("CommandOrControl+Shift+Space", async () => {
    const win = getCurrentWindow();
    await win.show();
    await win.setFocus();
    startListening();
  });
}

document.querySelector("#listen")!.addEventListener("click", () => {
  if (state.listening) stopRecognition();
  else startListening();
});

document.querySelector("#demo")!.addEventListener("click", () => {
  state.finalText = SAMPLE_TEXT;
  setTranscript(SAMPLE_TEXT);
  setStatus("Text ready.", "This demo path validates cleanup, clipboard, and insertion plumbing.");
});

document.querySelector("#insert")!.addEventListener("click", () => {
  void insertText();
});

document.querySelector("#close")!.addEventListener("click", () => {
  void getCurrentWindow().hide();
});

void listen("sayrr-target-status", (event) => {
  const detail = event.payload as { application?: string; supported: boolean };
  document.querySelector("#target")!.textContent = detail.supported
    ? `Target: ${detail.application ?? "supported"}`
    : "Text target: fallback mode";
});

void registerGlobalShortcut().catch((error) => {
  console.error("Unable to register SAYRR shortcut", error);
  setStatus("Shortcut unavailable.", "Use the Start listening button to continue the prototype.");
});
