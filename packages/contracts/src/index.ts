export type Platform = "android" | "ios" | "macos" | "windows" | "linux";

export type VoiceSessionState =
  | "idle"
  | "starting"
  | "listening"
  | "transcribing"
  | "processing"
  | "ready"
  | "inserted"
  | "cancelled"
  | "error";

export interface VoiceSessionConfig {
  locale: string;
  cleanupEnabled: boolean;
  removeFillers: boolean;
  autoPunctuation: boolean;
}

export interface TranscriptEvent {
  text: string;
  isFinal: boolean;
  sequence: number;
  receivedAt: string;
}

export interface CleanupResult {
  text: string;
  confidence?: number;
  changes: Array<{
    type: "punctuation" | "capitalization" | "filler_removed" | "grammar" | "vocabulary";
    before?: string;
    after?: string;
  }>;
  warnings: string[];
}

export interface TextTargetStatus {
  supported: boolean;
  application?: string;
  kind?: "textfield" | "document" | "richtext" | "unknown";
  canInsert: boolean;
  canReplaceSelection: boolean;
}

export interface UsageEvent {
  type:
    | "voice_session_started"
    | "transcript_first_token"
    | "transcript_finalized"
    | "cleanup_completed"
    | "insert_succeeded"
    | "insert_failed"
    | "permission_denied"
    | "provider_error";
  platform: Platform;
  durationMs?: number;
  errorCode?: string;
  createdAt: string;
}
