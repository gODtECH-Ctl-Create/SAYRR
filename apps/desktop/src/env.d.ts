interface ImportMetaEnv {
  readonly VITE_SAYRR_SPEECH_TOKEN_URL?: string;
  readonly VITE_SAYRR_SPEECH_MODEL?: "flux-general-en" | "flux-general-multi";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
