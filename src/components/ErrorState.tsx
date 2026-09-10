export type ErrorKind = "mic-denied" | "transcribe-failed" | "no-speech";

const COPY: Record<ErrorKind, { heading: string; body: string; action: string }> = {
  "mic-denied": {
    heading: "Turn on your microphone",
    body: "Your browser is blocking mic access. Allow it, then record your version.",
    action: "Record",
  },
  "transcribe-failed": {
    heading: "Give that take another go",
    body: "The transcription stopped before it finished. Record your version again.",
    action: "Record again",
  },
  "no-speech": {
    heading: "Speak a little louder",
    body: "That take came through too quiet to read. Move closer and record again.",
    action: "Record again",
  },
};

interface ErrorStateProps {
  kind: ErrorKind;
  onRetry: () => void;
}

export function ErrorState({ kind, onRetry }: ErrorStateProps) {
  const { heading, body, action } = COPY[kind];
  return (
    <section className="notice" role="alert" aria-labelledby="error-heading">
      <h2 id="error-heading">{heading}</h2>
      <p>{body}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        {action}
      </button>
    </section>
  );
}
