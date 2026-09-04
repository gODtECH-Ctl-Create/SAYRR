export type CleanupChangeType =
  | "punctuation"
  | "capitalization"
  | "filler_removed"
  | "grammar"
  | "vocabulary";

export interface CleanupChange {
  type: CleanupChangeType;
  before?: string;
  after?: string;
}

export interface CleanupOptions {
  autoPunctuation?: boolean;
  removeFillers?: boolean;
  vocabulary?: Record<string, string>;
}

export interface CleanupResult {
  text: string;
  changes: CleanupChange[];
  warnings: string[];
}

const FILLERS = /\b(?:um+|uh+|erm+|ah+|hmm+|you know|like)\b/gi;
const SPACE_BEFORE_PUNCTUATION = /\s+([,.!?;:])/g;
const MULTIPLE_SPACES = /\s+/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyVocabulary(
  text: string,
  vocabulary: Record<string, string>,
  changes: CleanupChange[],
): string {
  let result = text;
  for (const [source, replacement] of Object.entries(vocabulary)) {
    if (!source || !replacement) continue;
    const expression = new RegExp(`\\b${escapeRegExp(source)}\\b`, "gi");
    if (!expression.test(result)) continue;
    result = result.replace(expression, replacement);
    changes.push({ type: "vocabulary", before: source, after: replacement });
  }
  return result;
}

export function cleanupTranscript(input: string, options: CleanupOptions = {}): CleanupResult {
  const changes: CleanupChange[] = [];
  const warnings: string[] = [];
  let text = input.trim();

  if (!text) return { text: "", changes, warnings };

  const normalized = text
    .replace(MULTIPLE_SPACES, " ")
    .replace(SPACE_BEFORE_PUNCTUATION, "$1")
    .trim();

  if (normalized !== text) {
    changes.push({ type: "grammar", before: text, after: normalized });
    text = normalized;
  }

  if (options.removeFillers) {
    const withoutFillers = text.replace(FILLERS, "").replace(MULTIPLE_SPACES, " ").trim();
    if (withoutFillers !== text) {
      changes.push({ type: "filler_removed", before: text, after: withoutFillers });
      text = withoutFillers;
    }
  }

  if (options.vocabulary && Object.keys(options.vocabulary).length > 0) {
    text = applyVocabulary(text, options.vocabulary, changes);
  }

  const capitalized = text.replace(/(^|[.!?]\s+)([a-z])/g, (_match, prefix: string, letter: string) => {
    return `${prefix}${letter.toUpperCase()}`;
  });
  if (capitalized !== text) {
    changes.push({ type: "capitalization", before: text, after: capitalized });
    text = capitalized;
  }

  if (options.autoPunctuation && !/[.!?]$/.test(text)) {
    const punctuated = `${text}.`;
    changes.push({ type: "punctuation", before: text, after: punctuated });
    text = punctuated;
  }

  if (changes.length > 12) {
    warnings.push("Many cleanup changes were applied; review the result before inserting it.");
  }

  return { text, changes, warnings };
}
