#!/usr/bin/env node
// Copy the onnxruntime-web WASM binaries into public/ort so they are served
// same-origin (required under COEP require-corp + connect-src 'self'). Runtime
// config points at /ort/ via env.backends.onnx.wasm.wasmPaths. This is a build
// step, not a git commit: public/ort is git-ignored.
import { mkdir, readdir, copyFile, stat } from "node:fs/promises";
import { join } from "node:path";

const SRC = join(process.cwd(), "node_modules", "onnxruntime-web", "dist");
const OUT = join(process.cwd(), "public", "ort");

async function main() {
  try {
    await stat(SRC);
  } catch {
    throw new Error(
      "onnxruntime-web not found. Run npm ci before copying ORT binaries.",
    );
  }
  await mkdir(OUT, { recursive: true });
  const entries = await readdir(SRC);
  // Ship the wasm binaries and their loader shims; skip source maps.
  const wanted = entries.filter(
    (f) => (f.endsWith(".wasm") || f.endsWith(".mjs")) && !f.endsWith(".map"),
  );
  for (const f of wanted) {
    await copyFile(join(SRC, f), join(OUT, f));
    console.log(`copied ${f}`);
  }
  console.log(`ORT binaries copied to public/ort (${wanted.length} files).`);
}

await main();
