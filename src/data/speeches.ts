import type { Speech } from "../types";
import { gettysburg } from "./gettysburg";
import { fightNoMore } from "./fight-no-more";
import { rightToVote } from "./right-to-vote";
import { aintIAWoman } from "./aint-i-a-woman";

// The ordered curated library. Every entry is a short public-domain oration
// (pre-1929 or a US government work) with its basis recorded in its module.
// Adding a speech is a new module imported here; no other wiring changes.
export const speeches: Speech[] = [
  gettysburg,
  fightNoMore,
  aintIAWoman,
  rightToVote,
];

// The speech the demo/seed path lands on. It has a bundled sample so the
// alignment surface shows real value with no recording.
export const featuredSpeechId = "gettysburg";

const byId = new Map(speeches.map((s) => [s.id, s]));

export function getSpeech(id: string | null | undefined): Speech | undefined {
  if (!id) return undefined;
  return byId.get(id);
}
