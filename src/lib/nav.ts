// Hash-based routing so the static host needs no SPA rewrite rule. Three views:
//   #/                      library (home)
//   #/speech/:id            the read/condense screen
//   #/speech/:id/warmup     the reconstruct flow for that speech
// In-memory state stays the source of truth for the reconstruction phase; the
// hash only distinguishes the three views and the selected speech.
export type View = "library" | "read" | "reconstruct";

export interface Route {
  view: View;
  speechId: string | null;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "speech" && parts[1]) {
    const speechId = decodeURIComponent(parts[1]);
    if (parts[2] === "warmup") return { view: "reconstruct", speechId };
    return { view: "read", speechId };
  }
  return { view: "library", speechId: null };
}

export function buildHash(view: View, speechId: string | null): string {
  if (view === "library" || !speechId) return "#/";
  const id = encodeURIComponent(speechId);
  if (view === "reconstruct") return `#/speech/${id}/warmup`;
  return `#/speech/${id}`;
}
