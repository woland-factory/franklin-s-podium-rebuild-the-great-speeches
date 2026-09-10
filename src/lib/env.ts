export interface AppEnv {
  SEED_DEMO?: string;
}

declare global {
  interface Window {
    __ENV__?: AppEnv;
    // E2E seam: when set, transcription returns this text instead of loading
    // the on-device model. Never set in production.
    __E2E_TRANSCRIPT__?: string;
  }
}

export function getEnv(): AppEnv {
  if (typeof window === "undefined") return {};
  return window.__ENV__ ?? {};
}

function truthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== "" && v !== "0" && v !== "false" && v !== "off";
}

/** Demo mode: staging SEED_DEMO env, or a ?demo=1 convenience param. */
export function isDemoEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (truthy(getEnv().SEED_DEMO)) return true;
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "1";
}
