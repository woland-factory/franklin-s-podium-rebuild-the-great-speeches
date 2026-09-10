import { pipeline, env } from "@huggingface/transformers";
import type { ProgressHandler } from "./transcribe";

// Local-only resolution: COEP require-corp + strict connect-src means every
// runtime fetch must be same-origin, so the model and the ORT wasm are vendored
// under /models and /ort at build time. See scripts/fetch-model.mjs.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/models/";
env.useBrowserCache = true;

const wasmBackend = env.backends?.onnx?.wasm;
if (wasmBackend) {
  wasmBackend.wasmPaths = "/ort/";
  wasmBackend.numThreads = Math.min(
    4,
    Math.max(1, (navigator.hardwareConcurrency ?? 1) - 1),
  );
}

// Pinned model. Recorded here, in scripts/fetch-model.mjs, and in the README.
// dtype q8 (quantized) keeps the download small and runs on both the WebGPU and
// WASM backends; WebGPU is tried first and falls back to WASM automatically.
export const MODEL_ID = "onnx-community/whisper-base.en";
export const MODEL_REVISION = "51eefc0af78b103839eda9e7e4f4186acc6517fe";
const DTYPE = "q8";

type Backend = "webgpu" | "wasm";
type Transcriber = (
  audio: Float32Array,
  options?: Record<string, unknown>,
) => Promise<{ text?: string } | Array<{ text?: string }>>;

let pipePromise: Promise<{ asr: Transcriber; backend: Backend }> | null = null;

async function build(
  device: Backend,
  onProgress: ProgressHandler,
): Promise<Transcriber> {
  const options: Record<string, unknown> = {
    device,
    dtype: DTYPE,
    progress_callback: (info: unknown) => {
      const p = info as { status?: string; progress?: number };
      if (p.status === "progress" && typeof p.progress === "number") {
        onProgress({ progress: p.progress / 100, backend: device, phase: "loading" });
      } else if (p.status === "initiate" || p.status === "download") {
        onProgress({ progress: null, backend: device, phase: "loading" });
      }
    },
  };
  const asr = await pipeline(
    "automatic-speech-recognition",
    MODEL_ID,
    options as never,
  );
  return asr as unknown as Transcriber;
}

async function getPipeline(onProgress: ProgressHandler) {
  if (!pipePromise) {
    pipePromise = (async () => {
      const wantGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      if (wantGpu) {
        try {
          const asr = await build("webgpu", onProgress);
          return { asr, backend: "webgpu" as Backend };
        } catch {
          // WebGPU init failed at runtime; fall back to WASM.
        }
      }
      const asr = await build("wasm", onProgress);
      return { asr, backend: "wasm" as Backend };
    })().catch((err) => {
      pipePromise = null; // allow a later retry
      throw err;
    });
  }
  return pipePromise;
}

export async function runWhisper(
  audio: Float32Array,
  onProgress: ProgressHandler,
): Promise<string> {
  const { asr, backend } = await getPipeline(onProgress);
  onProgress({ progress: 1, backend, phase: "transcribing" });
  const output = await asr(audio, { chunk_length_s: 30, stride_length_s: 5 });
  const text = Array.isArray(output)
    ? output.map((o) => o.text ?? "").join(" ")
    : (output.text ?? "");
  return text.trim();
}
