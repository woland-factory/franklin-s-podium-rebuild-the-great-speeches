import { useRef, useState } from "react";

interface RecorderProps {
  onComplete: (blob: Blob) => void;
  onDenied: () => void;
  primaryLabel?: string;
}

export function Recorder({ onComplete, onDenied, primaryLabel = "Record your version" }: RecorderProps) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stopStream();
        setRecording(false);
        onComplete(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      stopStream();
      setRecording(false);
      onDenied();
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  return (
    <div className="recorder">
      {recording ? (
        <button type="button" className="btn btn-primary" onClick={stop}>
          <span className="rec-dot" aria-hidden="true" />
          Stop and transcribe
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={start}>
          {primaryLabel}
        </button>
      )}
      <p className="rec-status" role="status" aria-live="polite">
        {recording ? "Recording. Speak your reconstruction, then stop." : ""}
      </p>
    </div>
  );
}
