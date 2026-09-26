import { useEffect, useState } from "react";
import type { ScheduleEntry, Speech } from "../types";
import { scheduleState, formatCountdown } from "../lib/schedule";
import { buildIcs, downloadIcs } from "../lib/ics";

interface SchedulePanelProps {
  speech: Speech;
  schedule: ScheduleEntry | null;
  // Chosen gap in days. The parent persists the entry and reloads it.
  onSchedule: (days: number) => void;
  onStartCold: () => void;
  onClear: () => void;
  // Seed the clock for deterministic tests; defaults to the real clock.
  initialNow?: number;
}

const PRESETS: { label: string; days: number }[] = [
  { label: "2 days", days: 2 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
];

export function SchedulePanel({
  speech,
  schedule,
  onSchedule,
  onStartCold,
  onClear,
  initialNow,
}: SchedulePanelProps) {
  const [now, setNow] = useState(() => initialNow ?? Date.now());

  // Recompute the countdown on a light interval and whenever the tab returns,
  // so it stays honest without a per-second tick. A fixed clock (tests) opts
  // out of ticking.
  useEffect(() => {
    if (initialNow !== undefined) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 60_000);
    window.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [initialNow]);

  const state = scheduleState(schedule, now);

  function addToCalendar() {
    if (!schedule) return;
    const contents = buildIcs({
      title: speech.title,
      revealAt: schedule.reveal_at,
      now: Date.now(),
      uid: `${speech.id}-${schedule.reveal_at}@franklins-podium`,
    });
    downloadIcs(`${speech.id}-cold-attempt.ics`, contents);
  }

  function presets(legend: string) {
    return (
      <fieldset className="gap-presets">
        <legend>{legend}</legend>
        <div className="btn-row">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              className="btn"
              onClick={() => onSchedule(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  const remaining = schedule ? schedule.reveal_at - now : 0;
  const countdown = formatCountdown(remaining);

  return (
    <section className="card schedule-panel" aria-labelledby="schedule-heading">
      <h2 id="schedule-heading">
        {state === "ready" ? "Cold attempt is open" : "Schedule a cold attempt"}
      </h2>

      {state === "none" ? (
        <>
          <p className="muted">
            Come back in a few days and speak it cold, once the words have
            faded. That gap is what makes the attempt worth studying.
          </p>
          {presets("Choose your gap")}
        </>
      ) : null}

      {state === "waiting" ? (
        <>
          <p className="muted" aria-live="polite">
            Opens in {countdown}.
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              disabled
              aria-disabled="true"
              aria-label={`Cold attempt opens in ${countdown}`}
            >
              Cold attempt opens in {countdown}
            </button>
          </div>
          <p className="muted">Warm up any time while you wait.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={addToCalendar}>
              Add to calendar
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Clear schedule
            </button>
          </div>
        </>
      ) : null}

      {state === "ready" ? (
        <>
          <p className="muted">
            The words have had time to fade. Speak it from memory now.
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStartCold}
            >
              Start cold attempt
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Clear schedule
            </button>
          </div>
        </>
      ) : null}

      {state === "done" ? (
        <>
          <p className="muted">
            This cold attempt is done. Your archive keeps it. Schedule another
            when you want to rebuild it again.
          </p>
          {presets("Choose your next gap")}
        </>
      ) : null}
    </section>
  );
}
