import { useEffect, useState } from "react";
import type { Attempt, Speech } from "../types";
import { listAttempts, type AttemptPage } from "../lib/db";
import { formatStamp, modeLabel, firstLine } from "../lib/format";

interface ArchiveProps {
  speech: Speech;
  onOpen: (attempt: Attempt) => void;
  onCompare: (newer: Attempt, older: Attempt) => void;
  onBack: () => void;
  onStartWarmup: () => void;
}

const PAGE = 10;

export function Archive({
  speech,
  onOpen,
  onCompare,
  onBack,
  onStartWarmup,
}: ArchiveProps) {
  const [items, setItems] = useState<Attempt[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listAttempts(speech.id, { limit: PAGE })
      .then((page: AttemptPage) => {
        if (!live) return;
        setItems(page.items);
        setCursor(page.nextCursor);
      })
      .catch(() => {
        if (live) setCursor(null);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [speech.id]);

  function loadMore() {
    if (cursor == null) return;
    setLoadingMore(true);
    listAttempts(speech.id, { limit: PAGE, before: cursor })
      .then((page) => {
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      })
      .catch(() => setCursor(null))
      .finally(() => setLoadingMore(false));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // cap at two
      return [...prev, id];
    });
  }

  function compareSelected() {
    const chosen = selected
      .map((id) => items.find((a) => a.id === id))
      .filter((a): a is Attempt => Boolean(a))
      .sort((a, b) => b.created_at - a.created_at); // newest first
    if (chosen.length === 2) onCompare(chosen[0], chosen[1]);
  }

  return (
    <section className="card" aria-labelledby="archive-heading">
      <div className="btn-row" style={{ marginBottom: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back to speech
        </button>
      </div>
      <h1 id="archive-heading" className="speech-title">
        {speech.title}
      </h1>
      <p className="library-intro">
        Every reconstruction you record, saved on this device.
      </p>

      {loading ? (
        <ul className="speech-list" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="attempt-row-skeleton">
              <div className="skeleton" style={{ width: "40%" }} />
              <div className="skeleton" style={{ width: "80%" }} />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div>
          <p className="muted">Your attempts collect here. Warm up to add the first.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={onStartWarmup}>
              Start warm-up
            </button>
          </div>
        </div>
      ) : (
        <>
          {selected.length === 2 ? (
            <div className="btn-row" style={{ marginBottom: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={compareSelected}
              >
                Compare selected
              </button>
            </div>
          ) : null}

          <ul className="attempt-list">
            {items.map((a) => (
              <li key={a.id} className="attempt-item">
                <button
                  type="button"
                  className="attempt-row"
                  onClick={() => onOpen(a)}
                >
                  <span className="attempt-row-meta">
                    <span className={`mode-tag mode-${a.mode}`}>
                      {modeLabel(a.mode)}
                    </span>
                    <span className="attempt-stamp">
                      {formatStamp(a.created_at)}
                    </span>
                  </span>
                  <span className="attempt-snippet">
                    {firstLine(a.corrected_transcript) || "No words captured"}
                  </span>
                </button>
                <label className="attempt-compare-toggle">
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    disabled={selected.length >= 2 && !selected.includes(a.id)}
                  />
                  Compare
                </label>
              </li>
            ))}
          </ul>

          {cursor != null ? (
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
