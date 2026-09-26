// Hash-based routing so the static host needs no SPA rewrite rule. Views:
//   #/                      library (home)
//   #/speech/:id            the read/condense screen
//   #/speech/:id/warmup     the reconstruct flow for that speech
//   #/speech/:id/archive    the per-speech attempt archive
//   #/ledger                the kept-lines ledger
//   #/paste                 paste-your-own-text entry
//   #/settings              settings and export
// A speech id may be a curated id or a "paste:<uuid>" user-source id; it is
// encodeURIComponent'd in buildHash and decoded in parseHash. In-memory state
// stays the source of truth for the reconstruction phase and the compare
// surface; the hash only distinguishes views and the speech.
export type View =
  | "library"
  | "read"
  | "reconstruct"
  | "archive"
  | "ledger"
  | "paste"
  | "settings";

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
  if (parts[0] === "ledger") return { view: "ledger", speechId: null };
  if (parts[0] === "paste") return { view: "paste", speechId: null };
  if (parts[0] === "settings") return { view: "settings", speechId: null };
  return { view: "library", speechId: null };
}

export function buildHash(view: View, speechId: string | null): string {
  if (view === "ledger") return "#/ledger";
  if (view === "paste") return "#/paste";
  if (view === "settings") return "#/settings";
  if (view === "library" || !speechId) return "#/";
  const id = encodeURIComponent(speechId);
  if (view === "reconstruct") return `#/speech/${id}/warmup`;
  if (view === "archive") return `#/speech/${id}/archive`;
  return `#/speech/${id}`;
}
