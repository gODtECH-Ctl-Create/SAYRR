export type TextTargetKind = "textfield" | "document" | "richtext" | "unknown";

export interface TextTarget {
  supported: boolean;
  application?: string;
  kind?: TextTargetKind;
  canInsert: boolean;
  canReplaceSelection: boolean;
  capturedAt: string;
  platform: "macos" | "windows" | "linux" | "unknown";
}

export interface InsertionResult {
  success: boolean;
  method: "native" | "clipboard-paste" | "keyboard-simulation" | "unsupported";
  errorCode?: string;
}

export interface TextInsertionProvider {
  captureTarget(): Promise<TextTarget> | TextTarget;
  insert(text: string, target: TextTarget): Promise<InsertionResult>;
}

export function unsupportedTarget(platform: TextTarget["platform"] = "unknown"): TextTarget {
  return {
    supported: false,
    canInsert: false,
    canReplaceSelection: false,
    capturedAt: new Date().toISOString(),
    platform,
  };
}
