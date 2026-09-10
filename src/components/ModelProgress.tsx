import type { LoadProgress } from "../lib/transcribe";

export function ModelProgress({ progress, backend, phase }: LoadProgress) {
  const pct =
    progress == null ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);

  const backendLabel =
    backend === "webgpu"
      ? "Running on your GPU"
      : backend === "wasm"
        ? "Running on your CPU"
        : "Getting ready";

  return (
    <section className="card" aria-labelledby="progress-heading" aria-busy="true">
      <h2 id="progress-heading">
        {phase === "transcribing" ? "Transcribing your take" : "Loading the voice model"}
      </h2>

      {phase === "loading" ? (
        <>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct ?? undefined}
            aria-label="Model download progress"
          >
            <div className="progress-fill" style={{ width: `${pct ?? 4}%` }} />
          </div>
          <p className="muted">
            {pct == null
              ? "Starting the download. This happens once, then it stays on your device."
              : `${pct}% downloaded. It stays cached for next time.`}
          </p>
        </>
      ) : (
        <>
          <div className="skeleton" style={{ width: "90%" }} />
          <div className="skeleton" style={{ width: "70%" }} />
        </>
      )}

      <p className="muted">{backendLabel}. Nothing leaves your device.</p>
    </section>
  );
}
