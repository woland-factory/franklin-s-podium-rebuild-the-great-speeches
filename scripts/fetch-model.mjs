#!/usr/bin/env node
// Vendor the pinned Whisper model into public/models so it is served
// same-origin (required under COEP require-corp + connect-src 'self'). This is
// a build step, not a git commit: public/models is git-ignored.
//
// Usage: node scripts/fetch-model.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

const MODEL_ID = "onnx-community/whisper-base.en";
const REVISION = "51eefc0af78b103839eda9e7e4f4186acc6517fe";
const OUT_ROOT = join(process.cwd(), "public", "models", MODEL_ID);

// dtype q8 needs the quantized encoder + merged decoder, plus the config and
// tokenizer files transformers.js loads at runtime.
const FILES = [
  "config.json",
  "generation_config.json",
  "preprocessor_config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "added_tokens.json",
  "normalizer.json",
  "merges.txt",
  "quantize_config.json",
  "onnx/encoder_model_quantized.onnx",
  "onnx/decoder_model_merged_quantized.onnx",
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchFile(rel) {
  const url = `https://huggingface.co/${MODEL_ID}/resolve/${REVISION}/${rel}`;
  const dest = join(OUT_ROOT, rel);
  if (await exists(dest)) {
    console.log(`skip  ${rel} (already vendored)`);
    return;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${rel}: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log(`saved ${rel} (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log(`Vendoring ${MODEL_ID} @ ${REVISION}`);
for (const rel of FILES) {
  await fetchFile(rel);
}
console.log("Model vendored to public/models.");
