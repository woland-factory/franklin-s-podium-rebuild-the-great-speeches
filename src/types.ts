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
