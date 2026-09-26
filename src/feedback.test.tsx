// Perceived-speed proofs (quality bar §1): the model download reports honest
// progress and holds the layout, and the export and paste controls show a
// working label the instant they are pressed, before their async work resolves.
// The Keep toggle, ledger Remove, and schedule optimism are proven in
// AlignmentSurface.test.tsx, Ledger.test.tsx, and SchedulePanel.test.tsx.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";
import { ModelProgress } from "./components/ModelProgress";

// A deferred promise so a mocked async op can be held pending mid-interaction.
const saveGate = vi.hoisted(() => {
  let release!: () => void;
  const promise = new Promise<void>((r) => (release = r));
  return { promise, release };
});
const exportGate = vi.hoisted(() => {
  let release!: (v: unknown) => void;
  const promise = new Promise((r) => (release = r));
  return { promise, release };
});

vi.mock("./lib/db", async (orig) => {
  const actual = await orig<typeof import("./lib/db")>();
  return {
    ...actual,
    saveUserText: vi.fn(() => saveGate.promise),
  };
});

describe("model progress is honest and holds the layout", () => {
  it("shows a real percentage when the download reports bytes", () => {
    render(<ModelProgress progress={0.42} backend="wasm" phase="loading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText(/42% downloaded/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing leaves your device/i)).toBeInTheDocument();
  });

  it("stays determinate-to-indeterminate before any bytes report", () => {
    render(<ModelProgress progress={null} backend={null} phase="loading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(
      screen.getByText(/this happens once, then it stays on your device/i),
    ).toBeInTheDocument();
  });

  it("holds the layout with skeletons while transcribing", () => {
    const { container } = render(
      <ModelProgress progress={null} backend="wasm" phase="transcribing" />,
    );
    expect(
      screen.getByRole("heading", { name: /transcribing your take/i }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });
});

describe("paste shows a working label the instant it is pressed", () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it("flips to Building and disables before the save resolves", async () => {
    const { PasteScreen } = await import("./components/PasteScreen");
    const user = userEvent.setup();
    render(<PasteScreen onCreated={() => {}} onBack={() => {}} />);

    await user.click(screen.getByLabelText(/your text/i));
    await user.paste(
      "We choose to go to the moon in this decade. We do it because it is hard.",
    );
    await user.click(screen.getByRole("button", { name: /find the moves/i }));

    // The save is still pending, and the control already acknowledges.
    const building = screen.getByRole("button", { name: /building/i });
    expect(building).toBeDisabled();

    saveGate.release();
  });
});

describe("export shows a working label the instant it is pressed", () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it("flips to Preparing and disables before the export resolves", async () => {
    vi.resetModules();
    const dbMod = await import("./lib/db");
    const rows = {
      attempts: [
        {
          id: "a1",
          speech_id: "gettysburg",
          created_at: 1000,
          mode: "warmup" as const,
          transcript: "raw",
          corrected_transcript: "take",
          audio_blob: null,
          alignment: [],
        },
      ],
      ledger: [],
      userTexts: [],
    };
    const spy = vi
      .spyOn(dbMod, "readAllForExport")
      .mockResolvedValueOnce(rows) // initial load: reveals the buttons
      .mockReturnValueOnce(exportGate.promise as Promise<typeof rows>); // export: held
    const exportMod = await import("./lib/export");
    vi.spyOn(exportMod, "downloadJson").mockImplementation(() => {});

    const { Settings } = await import("./components/Settings");
    const user = userEvent.setup();
    render(<Settings />);

    const jsonBtn = await screen.findByRole("button", {
      name: /download json/i,
    });
    await user.click(jsonBtn);

    const preparing = await screen.findByRole("button", { name: /preparing/i });
    expect(preparing).toBeDisabled();

    exportGate.release(rows);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /download json/i }),
      ).toBeEnabled(),
    );
    spy.mockRestore();
  });
});
