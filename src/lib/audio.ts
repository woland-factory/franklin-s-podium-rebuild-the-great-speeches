const TARGET_SAMPLE_RATE = 16000;

/**
 * Decode a recorded audio blob and resample it to 16 kHz mono Float32, the
 * shape Whisper expects. Uses an OfflineAudioContext for resampling.
 */
export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();

  const Ctx: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const decodeCtx = new Ctx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  } finally {
    void decodeCtx.close();
  }

  const duration = decoded.length / decoded.sampleRate;
  const frameCount = Math.max(1, Math.ceil(duration * TARGET_SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();

  return rendered.getChannelData(0).slice();
}
