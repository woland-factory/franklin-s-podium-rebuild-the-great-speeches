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

export interface Attempt {
  id: string;
  speech_id: string;
  created_at: number;
  transcript: string;
  corrected_transcript: string;
  audio_blob: Blob | null;
  alignment: AlignmentPair[];
}
