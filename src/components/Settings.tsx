import { useEffect, useState } from "react";
import { readAllForExport } from "../lib/db";
import { getSpeech } from "../data/speeches";
import {
  downloadJson,
  downloadMarkdown,
  type ExportData,
} from "../lib/export";

type Working = "json" | "markdown" | null;

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [working, setWorking] = useState<Working>(null);

  useEffect(() => {
    let live = true;
    readAllForExport()
      .then((rows) => {
        if (!live) return;
        setHasData(rows.attempts.length > 0 || rows.ledger.length > 0);
      })
      .catch(() => {
        if (live) setHasData(false);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  async function run(kind: "json" | "markdown") {
    setWorking(kind);
    try {
      const rows = await readAllForExport();
      const titles = new Map(rows.userTexts.map((t) => [t.id, t.title]));
      const data: ExportData = {
        ...rows,
        exportedAt: Date.now(),
        resolveTitle: (id) => titles.get(id) ?? getSpeech(id)?.title ?? id,
      };
      if (kind === "json") downloadJson(data);
      else downloadMarkdown(data);
    } catch {
      // The download simply does not fire; nothing partial is written.
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="card" aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="speech-title">
        Settings
      </h1>
      <p className="library-intro">
        Everything you record and keep stays on this device. These downloads are
        yours to hold.
      </p>

      <h2>Download your data</h2>
      {loading ? (
        <div>
          <div className="skeleton" style={{ width: "50%" }} />
          <div className="skeleton" style={{ width: "70%" }} />
        </div>
      ) : hasData ? (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void run("json")}
            disabled={working !== null}
          >
            {working === "json" ? "Preparing" : "Download JSON"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void run("markdown")}
            disabled={working !== null}
          >
            {working === "markdown" ? "Preparing" : "Download Markdown"}
          </button>
        </div>
      ) : (
        <p className="muted">
          Record a reconstruction to fill your archive, then download it here.
        </p>
      )}
    </section>
  );
}
