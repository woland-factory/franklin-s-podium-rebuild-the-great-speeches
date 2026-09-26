import { useEffect, useMemo, useState } from "react";
import type { LedgerItem } from "../types";
import { listLedger, removeLedgerItem, type LedgerPage } from "../lib/db";
import { formatStamp } from "../lib/format";

const PAGE = 30;

interface Group {
  speechId: string;
  title: string;
  items: LedgerItem[];
}

// Items arrive clustered by source on the compound index, so a contiguous pass
// builds the groups. A group split across a page boundary merges under one
// heading because the flat list stays clustered.
function toGroups(items: LedgerItem[]): Group[] {
  const groups: Group[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.speechId === item.speech_id) last.items.push(item);
    else
      groups.push({
        speechId: item.speech_id,
        title: item.source_title,
        items: [item],
      });
  }
  return groups;
}

export function Ledger() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [cursor, setCursor] = useState<[string, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listLedger({ limit: PAGE })
      .then((page: LedgerPage) => {
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
  }, []);

  function loadMore() {
    if (cursor == null) return;
    setLoadingMore(true);
    listLedger({ limit: PAGE, after: cursor })
      .then((page) => {
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      })
      .catch(() => setCursor(null))
      .finally(() => setLoadingMore(false));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    void removeLedgerItem(id).catch(() => {});
  }

  const groups = useMemo(() => toGroups(items), [items]);

  return (
    <section className="card" aria-labelledby="ledger-heading">
      <h1 id="ledger-heading" className="speech-title">
        Lines worth stealing
      </h1>
      <p className="library-intro">
        The lines you kept, grouped by where you found them.
      </p>

      {loading ? (
        <ul className="ledger-groups" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="attempt-row-skeleton">
              <div className="skeleton" style={{ width: "40%" }} />
              <div className="skeleton" style={{ width: "85%" }} />
            </li>
          ))}
        </ul>
      ) : groups.length === 0 ? (
        <div className="ledger-empty">
          <p>
            Keep the lines you want to carry into your own speaking. Open any
            alignment and tap Keep on a line worth taking.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href="#/">
              Pick a speech
            </a>
          </div>
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <section
              key={group.speechId}
              className="ledger-group"
              aria-label={group.title}
            >
              <h2 className="ledger-group-title">{group.title}</h2>
              <ul className="ledger-list">
                {group.items.map((item) => (
                  <li key={item.id} className="ledger-row">
                    <div className="ledger-row-body">
                      <p className="ledger-phrase">{item.phrase}</p>
                      <p className="ledger-date">
                        Saved {formatStamp(item.saved_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost ledger-remove"
                      aria-label={`Remove "${item.phrase}" from your ledger`}
                      onClick={() => remove(item.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

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
