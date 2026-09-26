export interface Speech {
  id: string;
  title: string;
  author: string;
  year: number;
  source_url: string;
  public_domain_basis: string;
  full_text: string;
  sentences: string[];
  hint_deck: string[];
}

export type AlignmentRelation = "aligned" | "original-only" | "spoken-only";

export interface AlignmentPair {
  spoken: string | null;
  original: string | null;
  relation: AlignmentRelation;
}

export type AttemptMode = "warmup" | "cold";

export interface Attempt {
  id: string;
  speech_id: string;
  created_at: number;
  mode: AttemptMode;
  transcript: string;
  corrected_transcript: string;
  audio_blob: Blob | null;
  alignment: AlignmentPair[];
}

export type ScheduleStatus = "waiting" | "ready" | "done";

export interface ScheduleEntry {
  speech_id: string;
  condensed_at: number; // when the user scheduled (proxy for "has read the moves")
  reveal_at: number; // epoch ms when the cold attempt opens
  status: ScheduleStatus;
}

// A line worth stealing, kept from an alignment surface. The keep control is
// additive and positive: it marks a master's line to carry into your own
// speaking, never a line you got wrong.
export interface LedgerItem {
  id: string; // crypto.randomUUID()
  phrase: string; // the original (master's) line kept, verbatim
  speech_id: string; // source id: a curated speech id, or a "paste:<uuid>" id
  source_title: string; // denormalized at save time for grouping and export
  note?: string; // reserved; no editor ships in this EPIC
  saved_at: number; // epoch ms
}

// A passage the user pasted to practice against. Segmented and cued with the
// same deterministic functions the curated speeches use, no model involved.
export interface UserText {
  id: string; // "paste:<uuid>"
  title: string; // deterministic, derived from the opening words
  text: string; // the pasted text, stored as a plain string
  sentences: string[]; // segmentSentences(text)
  hints: string[]; // one deterministic cue per sentence, same length/order
  created_at: number; // epoch ms
}
