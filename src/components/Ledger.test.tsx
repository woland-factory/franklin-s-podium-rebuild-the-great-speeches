import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";
import { Ledger } from "./Ledger";
import { saveLedgerItem, countLedger } from "../lib/db";
import type { LedgerItem } from "../types";

function item(
  id: string,
  speechId: string,
  title: string,
  savedAt: number,
  phrase: string,
): LedgerItem {
  return {
    id,
    phrase,
    speech_id: speechId,
    source_title: title,
    saved_at: savedAt,
  };
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("Ledger", () => {
  it("renders kept lines grouped under a source heading with dates", async () => {
    await saveLedgerItem(
      item("1", "gettysburg", "The Gettysburg Address", 1000, "of the people"),
    );
    await saveLedgerItem(
      item("2", "gettysburg", "The Gettysburg Address", 2000, "for the people"),
    );
    await saveLedgerItem(
      item("3", "paste:x", "My own words", 1500, "my own line"),
    );

    render(<Ledger />);

    expect(
      await screen.findByRole("heading", {
        name: "The Gettysburg Address",
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "My own words", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("of the people")).toBeInTheDocument();
    expect(screen.getByText("my own line")).toBeInTheDocument();
    expect(screen.getAllByText(/^Saved /)).toHaveLength(3);
  });

  it("removes a row and drops its group when it was the last item", async () => {
    await saveLedgerItem(
      item("1", "gettysburg", "The Gettysburg Address", 1000, "of the people"),
    );
    const user = userEvent.setup();
    render(<Ledger />);

    const remove = await screen.findByRole("button", {
      name: /remove "of the people" from your ledger/i,
    });
    await user.click(remove);

    await waitFor(() =>
      expect(screen.queryByText("of the people")).not.toBeInTheDocument(),
    );
    await waitFor(async () => expect(await countLedger()).toBe(0));
  });

  it("shows a positive empty state, not an apology", async () => {
    render(<Ledger />);
    const msg = await screen.findByText(/keep the lines you want to carry/i);
    expect(msg).toBeInTheDocument();
    expect(msg.textContent).not.toMatch(/no lines|nothing|don't have|yet/i);
  });
});
