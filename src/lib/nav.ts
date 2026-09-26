// Hash-based routing so the static host needs no SPA rewrite rule. Views:
//   #/                      library (home)
//   #/speech/:id            the read/condense screen
//   #/speech/:id/warmup     the reconstruct flow for that speech
//   #/speech/:id/archive    the per-speech attempt archive
// In-memory state stays the source of truth for the reconstruction phase and
// the compare surface; the hash only distinguishes views and the speech.
export type View = "library" | "read" | "reconstruct" | "archive";

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
    if (parts[2] === "archive") return { view: "archive", speechId };
    return { view: "read", speechId };
  }
  return { view: "library", speechId: null };
}

export function buildHash(view: View, speechId: string | null): string {
  if (view === "library" || !speechId) return "#/";
  const id = encodeURIComponent(speechId);
  if (view === "reconstruct") return `#/speech/${id}/warmup`;
  if (view === "archive") return `#/speech/${id}/archive`;
  return `#/speech/${id}`;
}
