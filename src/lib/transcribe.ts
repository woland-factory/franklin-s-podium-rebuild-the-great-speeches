export interface LoadProgress {
  // 0..1 across model download; null while indeterminate (before first byte).
  progress: number | null;
  backend: "webgpu" | "wasm" | null;
  phase: "loading" | "transcribing";
}

export type ProgressHandler = (p: LoadProgress) => void;

/**
 * Turn a recorded audio blob into text on-device. The heavy model code path
 * (transformers.js + onnxruntime-web) is dynamically imported here so it stays
 * out of the initial bundle. In E2E a fixed transcript is injected instead, so
 * the model never loads in CI.
 */
export async function getTranscript(
  blob: Blob,
  onProgress: ProgressHandler,
): Promise<string> {
  if (
    typeof window !== "undefined" &&
    typeof window.__E2E_TRANSCRIPT__ === "string"
  ) {
    return window.__E2E_TRANSCRIPT__;
  }
  const { decodeToMono16k } = await import("./audio");
  const audio = await decodeToMono16k(blob);
  const { runWhisper } = await import("./whisper");
  return runWhisper(audio, onProgress);
}
