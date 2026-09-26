import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";
import { Archive } from "./Archive";
import { saveAttempt } from "../lib/db";
import { gettysburg } from "../data/gettysburg";
import type { Attempt } from "../types";

function makeAttempt(createdAt: number, over: Partial<Attempt> = {}): Attempt {
  return {
    id: `${gettysburg.id}:${createdAt}`,
    speech_id: gettysburg.id,
    created_at: createdAt,
    mode: "warmup",
    transcript: "raw",
    corrected_transcript: `Take number ${createdAt}`,
    audio_blob: null,
    alignment: [{ spoken: "a", original: "a", relation: "aligned" }],
    ...over,
  };
}

function noop() {}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("Archive", () => {
  it("renders rows with mode, timestamp, and a snippet, newest first", async () => {
    await saveAttempt(makeAttempt(1000, { mode: "warmup" }));
    await saveAttempt(makeAttempt(2000, { mode: "cold" }));

    render(
      <Archive
        speech={gettysburg}
        onOpen={noop}
        onCompare={noop}
        onBack={noop}
        onStartWarmup={noop}
      />,
    );

    const rows = await screen.findAllByRole("button", { name: /take number/i });
    expect(rows).toHaveLength(2);
    // Newest first: the cold take (2000) leads.
    expect(within(rows[0]).getByText("Cold")).toBeInTheDocument();
    expect(within(rows[0]).getByText(/take number 2000/i)).toBeInTheDocument();
    expect(within(rows[1]).getByText("Warm-up")).toBeInTheDocument();
  });

  it("loads a second page when there are more than the page cap", async () => {
    for (let i = 1; i <= 12; i++) await saveAttempt(makeAttempt(i * 1000));
    const user = userEvent.setup();

    render(
      <Archive
        speech={gettysburg}
        onOpen={noop}
        onCompare={noop}
        onBack={noop}
        onStartWarmup={noop}
      />,
    );

    const rows = await screen.findAllByRole("button", { name: /take number/i });
    expect(rows).toHaveLength(10);
    await user.click(screen.getByRole("button", { name: /load more/i }));
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /take number/i }),
      ).toHaveLength(12),
    );
  });

  it("opens an attempt when its row is pressed", async () => {
    await saveAttempt(makeAttempt(1000));
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <Archive
        speech={gettysburg}
        onOpen={onOpen}
        onCompare={noop}
        onBack={noop}
        onStartWarmup={noop}
      />,
    );

    const row = await screen.findByRole("button", { name: /take number 1000/i });
    await user.click(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].id).toBe(`${gettysburg.id}:1000`);
  });

  it("shows a positive empty state with a warm-up control", async () => {
    const onStartWarmup = vi.fn();
    const user = userEvent.setup();

    render(
      <Archive
        speech={gettysburg}
        onOpen={noop}
        onCompare={noop}
        onBack={noop}
        onStartWarmup={onStartWarmup}
      />,
    );

    const intro = await screen.findByText(/your attempts collect here/i);
    expect(intro.textContent).not.toMatch(/no attempts|nothing|unable/i);
    await user.click(screen.getByRole("button", { name: /start warm-up/i }));
    expect(onStartWarmup).toHaveBeenCalledTimes(1);
  });

  it("compares two selected attempts newest first", async () => {
    await saveAttempt(makeAttempt(1000));
    await saveAttempt(makeAttempt(2000));
    const onCompare = vi.fn();
    const user = userEvent.setup();

    render(
      <Archive
        speech={gettysburg}
        onOpen={noop}
        onCompare={onCompare}
        onBack={noop}
        onStartWarmup={noop}
      />,
    );

    await screen.findAllByRole("button", { name: /take number/i });
    const checks = screen.getAllByRole("checkbox");
    await user.click(checks[0]);
    await user.click(checks[1]);
    await user.click(screen.getByRole("button", { name: /compare selected/i }));
    expect(onCompare).toHaveBeenCalledTimes(1);
    const [newer, older] = onCompare.mock.calls[0];
    expect(newer.created_at).toBe(2000);
    expect(older.created_at).toBe(1000);
  });
});
