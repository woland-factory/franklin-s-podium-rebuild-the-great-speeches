// A mechanical sweep over the whole app's product-voice strings: rendered
// component output plus the export files' static labels. It rejects em/en
// dashes used as breaks, the banned LLM vocabulary, and negative empty-state
// phrasing, so a future edit cannot quietly regress the voice. Verbatim speech
// text, author names, and the user's own pasted text are exempt: each screen is
// fed clean, dash-free content so any hit must come from the app's own chrome.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";

import { App } from "./App";
import { Library } from "./components/Library";
import { SpeechScreen } from "./components/SpeechScreen";
import { SchedulePanel } from "./components/SchedulePanel";
import { Recorder } from "./components/Recorder";
import { ModelProgress } from "./components/ModelProgress";
import { Correction } from "./components/Correction";
import { AlignmentSurface } from "./components/AlignmentSurface";
import { ErrorState } from "./components/ErrorState";
import { FirstRunWalk } from "./components/FirstRunWalk";
import { Ledger } from "./components/Ledger";
import { PasteScreen } from "./components/PasteScreen";
import { Settings } from "./components/Settings";
import { Archive } from "./components/Archive";
import { AttemptView } from "./components/AttemptView";
import { CompareAttempts } from "./components/CompareAttempts";
import { buildExportJson, buildExportMarkdown } from "./lib/export";
import { saveLedgerItem, saveAttempt } from "./lib/db";
import type { AlignmentPair, Attempt, LedgerItem, Speech } from "./types";

// Clean, dash-free stand-in content so the sweep isolates the app's chrome.
const cleanSpeech: Speech = {
  id: "clean",
  title: "A Clean Speech",
  author: "A Speaker",
  year: 1900,
  source_url: "",
  public_domain_basis: "",
  full_text: "We stand together. We move forward.",
  sentences: ["We stand together.", "We move forward."],
  hint_deck: ["Stand together.", "Move forward."],
};

const cleanPairs: AlignmentPair[] = [
  { spoken: "we stand", original: "We stand together.", relation: "aligned" },
  { spoken: null, original: "We move forward.", relation: "original-only" },
  { spoken: "and a line of mine", original: null, relation: "spoken-only" },
];

function cleanAttempt(over: Partial<Attempt> = {}): Attempt {
  return {
    id: "a1",
    speech_id: cleanSpeech.id,
    created_at: Date.UTC(2026, 8, 20),
    mode: "warmup",
    transcript: "raw",
    corrected_transcript: "a clean take",
    audio_blob: null,
    alignment: cleanPairs,
    ...over,
  };
}

// --- the sweep rules ---
const EM_EN = /[—–]/;
const DASH_ASIDE = / - /; // space-hyphen-space used as a sentence break
const BANNED =
  /\b(seamless(?:ly)?|effortless(?:ly)?|unlock|elevate|empower|leverage|robust|dive in)\b/i;
const MARKETING = /in today's fast-paced world|we've got you covered/i;
const NEGATIVE: RegExp[] = [
  /you don't have/i,
  /\bunable to\b/i,
  /something went wrong/i,
  /\bno\b[^.]{0,24}\byet\b/i,
  /\bnothing\b[^.]{0,24}\bhere\b/i,
];

const ATTRS = ["aria-label", "placeholder", "title", "alt", "aria-valuetext"];

function collect(container: HTMLElement): string[] {
  const out: string[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node.textContent?.trim();
    if (t) out.push(t);
  }
  for (const el of Array.from(container.querySelectorAll("*"))) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v && v.trim()) out.push(v.trim());
    }
  }
  return out;
}

function assertClean(strings: string[]) {
  for (const s of strings) {
    expect(s, `em/en dash in: "${s}"`).not.toMatch(EM_EN);
    expect(s, `dash-aside in: "${s}"`).not.toMatch(DASH_ASIDE);
    expect(s, `banned vocabulary in: "${s}"`).not.toMatch(BANNED);
    expect(s, `marketing filler in: "${s}"`).not.toMatch(MARKETING);
    for (const re of NEGATIVE) {
      expect(s, `negative empty-state phrasing in: "${s}"`).not.toMatch(re);
    }
  }
}

function sweep(container: HTMLElement) {
  assertClean(collect(container));
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

describe("full-app copy sweep", () => {
  it("masthead, nav, first-run walk, and library are clean", () => {
    const { container } = render(<App />);
    sweep(container);
  });

  it("the not-found state is clean", async () => {
    window.location.hash = "#/speech/does-not-exist";
    const { container } = render(<App />);
    await screen.findByRole("heading", { name: /choose a speech/i });
    sweep(container);
    window.location.hash = "";
  });

  it("library is clean", () => {
    const { container } = render(
      <Library speeches={[cleanSpeech]} onSelect={() => {}} />,
    );
    sweep(container);
  });

  it("read screen is clean", () => {
    const { container } = render(
      <SpeechScreen speech={cleanSpeech} onStart={() => {}} onBack={() => {}} />,
    );
    sweep(container);
  });

  it("schedule panel is clean in every state", () => {
    const now = Date.UTC(2026, 8, 20);
    const states = [
      null,
      { status: "waiting" as const, reveal_at: now + 2 * 86400_000 },
      { status: "waiting" as const, reveal_at: now - 86400_000 }, // ready
      { status: "done" as const, reveal_at: now - 86400_000 },
    ];
    for (const s of states) {
      const { container, unmount } = render(
        <SchedulePanel
          speech={cleanSpeech}
          schedule={
            s
              ? {
                  speech_id: cleanSpeech.id,
                  condensed_at: now,
                  reveal_at: s.reveal_at,
                  status: s.status,
                }
              : null
          }
          onSchedule={() => {}}
          onStartCold={() => {}}
          onClear={() => {}}
          initialNow={now}
        />,
      );
      sweep(container);
      unmount();
    }
  });

  it("recorder is clean", () => {
    const { container } = render(
      <Recorder onComplete={() => {}} onDenied={() => {}} />,
    );
    sweep(container);
  });

  it("model progress is clean while loading and transcribing", () => {
    for (const p of [
      { progress: null, backend: null, phase: "loading" as const },
      { progress: 0.5, backend: "wasm" as const, phase: "loading" as const },
      { progress: null, backend: "webgpu" as const, phase: "transcribing" as const },
    ]) {
      const { container, unmount } = render(<ModelProgress {...p} />);
      sweep(container);
      unmount();
    }
  });

  it("correction is clean", () => {
    const { container } = render(
      <Correction initialText="a clean take" onSubmit={() => {}} />,
    );
    sweep(container);
  });

  it("alignment surface is clean, kept and not kept, with replay", () => {
    const { container: a } = render(
      <AlignmentSurface
        pairs={cleanPairs}
        audioUrl="blob:mock"
        originalLabel={cleanSpeech.author}
        onToggleKeep={() => {}}
      />,
    );
    sweep(a);
    const { container: b } = render(
      <AlignmentSurface
        pairs={cleanPairs}
        onToggleKeep={() => {}}
        keptPhrases={new Set(["We move forward."])}
      />,
    );
    sweep(b);
  });

  it("every error state is clean", () => {
    for (const kind of ["mic-denied", "transcribe-failed", "no-speech"] as const) {
      const { container, unmount } = render(
        <ErrorState kind={kind} onRetry={() => {}} />,
      );
      sweep(container);
      unmount();
    }
  });

  it("first-run walk is clean", () => {
    const { container } = render(
      <FirstRunWalk activeStep={1} onSkip={() => {}} />,
    );
    sweep(container);
  });

  it("ledger is clean, empty and with a kept line", async () => {
    const { container: empty, unmount } = render(<Ledger />);
    await screen.findByText(/keep the lines you want to carry/i);
    sweep(empty);
    unmount();

    const item: LedgerItem = {
      id: "l1",
      phrase: "a clean kept line",
      speech_id: cleanSpeech.id,
      source_title: cleanSpeech.title,
      saved_at: Date.UTC(2026, 8, 20),
    };
    await saveLedgerItem(item);
    const { container: full } = render(<Ledger />);
    await screen.findByRole("button", { name: /remove/i });
    sweep(full);
  });

  it("paste screen is clean, including both error messages", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PasteScreen onCreated={() => {}} onBack={() => {}} />,
    );
    sweep(container); // placeholder, label, primary action

    await user.type(screen.getByLabelText(/your text/i), "too short");
    await user.click(screen.getByRole("button", { name: /find the moves/i }));
    await screen.findByText(/add a few more sentences/i);
    sweep(container);

    await user.clear(screen.getByLabelText(/your text/i));
    await user.click(screen.getByLabelText(/your text/i));
    await user.paste("a".repeat(10_001));
    await user.click(screen.getByRole("button", { name: /find the moves/i }));
    await screen.findByText(/runs long/i);
    sweep(container);
  });

  it("settings is clean, with and without data", async () => {
    const { container: empty, unmount } = render(<Settings />);
    await screen.findByText(/record a reconstruction to fill/i);
    sweep(empty);
    unmount();

    await saveAttempt(cleanAttempt());
    const { container: full } = render(<Settings />);
    await screen.findByRole("button", { name: /download json/i });
    sweep(full);
  });

  it("archive is clean, empty and with an attempt", async () => {
    const { container: empty, unmount } = render(
      <Archive
        speech={cleanSpeech}
        onOpen={() => {}}
        onCompare={() => {}}
        onBack={() => {}}
        onStartWarmup={() => {}}
      />,
    );
    await screen.findByText(/your attempts collect here/i);
    sweep(empty);
    unmount();

    await saveAttempt(cleanAttempt());
    const { container: full } = render(
      <Archive
        speech={cleanSpeech}
        onOpen={() => {}}
        onCompare={() => {}}
        onBack={() => {}}
        onStartWarmup={() => {}}
      />,
    );
    await screen.findByText(/a clean take/i);
    sweep(full);
  });

  it("opened attempt and compare views are clean", () => {
    const { container: one } = render(
      <AttemptView
        speech={cleanSpeech}
        attempt={cleanAttempt({ audio_blob: new Blob(["x"]) })}
        onBack={() => {}}
      />,
    );
    sweep(one);

    const { container: two } = render(
      <CompareAttempts
        speech={cleanSpeech}
        newer={cleanAttempt({ created_at: 2000 })}
        older={cleanAttempt({ created_at: 1000 })}
        onBack={() => {}}
        onRecordAnother={() => {}}
      />,
    );
    sweep(two);
  });

  it("export files' static labels are clean", () => {
    const data = {
      attempts: [cleanAttempt()],
      ledger: [
        {
          id: "l1",
          phrase: "a clean kept line",
          speech_id: cleanSpeech.id,
          source_title: cleanSpeech.title,
          saved_at: Date.UTC(2026, 8, 20),
        },
      ],
      userTexts: [],
      exportedAt: Date.UTC(2026, 8, 26),
      resolveTitle: () => cleanSpeech.title,
    };
    // Empty export exercises the "start this list" / "fill this section" copy.
    const emptyData = { ...data, attempts: [], ledger: [] };
    for (const md of [buildExportMarkdown(data), buildExportMarkdown(emptyData)]) {
      assertClean(md.split("\n").filter((l) => l.trim()));
    }
    // JSON keys and the app label are product voice too.
    assertClean(buildExportJson(data).split("\n").filter((l) => l.trim()));
  });
});
