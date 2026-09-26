import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import "fake-indexeddb/auto";
import { Settings } from "./Settings";
import { saveAttempt } from "../lib/db";
import type { Attempt } from "../types";

function attempt(): Attempt {
  return {
    id: "a1",
    speech_id: "gettysburg",
    created_at: 1000,
    mode: "warmup",
    transcript: "raw",
    corrected_transcript: "a take",
    audio_blob: null,
    alignment: [{ spoken: "hi", original: "hi there", relation: "aligned" }],
  };
}

let blobs: Blob[] = [];
let anchors: { download: string; href: string }[] = [];
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  blobs = [];
  anchors = [];
  URL.createObjectURL = vi.fn((b: Blob) => {
    blobs.push(b);
    return "blob:mock";
  }) as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      anchors.push({ download: this.download, href: this.href });
    });
});

afterEach(() => {
  clickSpy.mockRestore();
});

describe("Settings", () => {
  it("shows a positive nothing-to-export state when there is no data", async () => {
    render(<Settings />);
    const msg = await screen.findByText(/record a reconstruction to fill/i);
    expect(msg).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download json/i }),
    ).not.toBeInTheDocument();
  });

  it("offers a local JSON download from an in-memory blob, no network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await saveAttempt(attempt());
    const user = userEvent.setup();
    render(<Settings />);

    const jsonBtn = await screen.findByRole("button", {
      name: /download json/i,
    });
    await user.click(jsonBtn);

    await waitFor(() => expect(anchors).toHaveLength(1));
    expect(anchors[0].download).toBe("franklins-podium.json");
    expect(anchors[0].href).toBe("blob:mock");
    expect(blobs[0].type).toContain("application/json");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("offers a local Markdown download with the right filename and type", async () => {
    await saveAttempt(attempt());
    const user = userEvent.setup();
    render(<Settings />);

    const mdBtn = await screen.findByRole("button", {
      name: /download markdown/i,
    });
    await user.click(mdBtn);

    await waitFor(() => expect(anchors).toHaveLength(1));
    expect(anchors[0].download).toBe("franklins-podium.md");
    expect(blobs[0].type).toContain("text/markdown");
  });
});
