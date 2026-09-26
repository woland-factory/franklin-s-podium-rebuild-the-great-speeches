import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";
import { PasteScreen } from "./PasteScreen";
import { getUserText } from "../lib/db";
import { PASTE_MAX_CHARS } from "../lib/hints";
import type { UserText } from "../types";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const VALID =
  "We choose to go to the moon in this decade. We do it because it is hard.";

describe("PasteScreen", () => {
  it("rejects an over-cap paste with a designed error and stores nothing", async () => {
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<PasteScreen onCreated={onCreated} onBack={() => {}} />);

    await user.click(screen.getByLabelText(/your text/i));
    // Paste directly to avoid typing 10k characters.
    await user.paste("a".repeat(PASTE_MAX_CHARS + 1));
    await user.click(screen.getByRole("button", { name: /find the moves/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/runs long/i);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("rejects a too-short paste with a designed error", async () => {
    const user = userEvent.setup();
    render(<PasteScreen onCreated={() => {}} onBack={() => {}} />);
    await user.type(screen.getByLabelText(/your text/i), "too short");
    await user.click(screen.getByRole("button", { name: /find the moves/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /add a few more sentences/i,
    );
  });

  it("stores a valid paste as a source and hands it back", async () => {
    let created: UserText | null = null;
    const user = userEvent.setup();
    render(
      <PasteScreen onCreated={(t) => (created = t)} onBack={() => {}} />,
    );

    await user.click(screen.getByLabelText(/your text/i));
    await user.paste(VALID);
    await user.click(screen.getByRole("button", { name: /find the moves/i }));

    await waitFor(() => expect(created).not.toBeNull());
    const t = created as unknown as UserText;
    expect(t.id.startsWith("paste:")).toBe(true);
    expect(t.sentences.length).toBe(2);
    expect(t.hints.length).toBe(2);
    // It persisted under its id.
    expect((await getUserText(t.id))?.title).toBe(t.title);
  });

  it("keeps pasted markup as literal text, never HTML", async () => {
    let created: UserText | null = null;
    const user = userEvent.setup();
    render(
      <PasteScreen onCreated={(t) => (created = t)} onBack={() => {}} />,
    );
    const markup =
      "<img src=x onerror=alert(1)>. This is a second sentence of text.";
    await user.click(screen.getByLabelText(/your text/i));
    await user.paste(markup);
    await user.click(screen.getByRole("button", { name: /find the moves/i }));

    await waitFor(() => expect(created).not.toBeNull());
    const t = created as unknown as UserText;
    // The raw string is preserved verbatim; nothing is interpreted as markup.
    expect(t.text).toContain("<img");
    expect(document.querySelector("img")).toBeNull();
  });
});
