import { describe, it, expect } from "vitest";
import { parseHash, buildHash } from "./nav";

describe("parseHash", () => {
  it("reads the library for an empty or root hash", () => {
    expect(parseHash("")).toEqual({ view: "library", speechId: null });
    expect(parseHash("#/")).toEqual({ view: "library", speechId: null });
  });

  it("reads a speech read screen", () => {
    expect(parseHash("#/speech/gettysburg")).toEqual({
      view: "read",
      speechId: "gettysburg",
    });
  });

  it("reads a speech warm-up", () => {
    expect(parseHash("#/speech/fight-no-more/warmup")).toEqual({
      view: "reconstruct",
      speechId: "fight-no-more",
    });
  });

  it("reads a speech archive", () => {
    expect(parseHash("#/speech/gettysburg/archive")).toEqual({
      view: "archive",
      speechId: "gettysburg",
    });
  });

  it("reads the ledger, paste, and settings screens", () => {
    expect(parseHash("#/ledger")).toEqual({ view: "ledger", speechId: null });
    expect(parseHash("#/paste")).toEqual({ view: "paste", speechId: null });
    expect(parseHash("#/settings")).toEqual({
      view: "settings",
      speechId: null,
    });
  });

  it("decodes a paste:<uuid> source id on the read screen", () => {
    const id = "paste:1f2e3d4c-aaaa-bbbb-cccc-000011112222";
    expect(parseHash(`#/speech/${encodeURIComponent(id)}`)).toEqual({
      view: "read",
      speechId: id,
    });
  });
});

describe("buildHash", () => {
  it("round-trips each view", () => {
    expect(buildHash("library", null)).toBe("#/");
    expect(buildHash("read", "gettysburg")).toBe("#/speech/gettysburg");
    expect(buildHash("reconstruct", "gettysburg")).toBe(
      "#/speech/gettysburg/warmup",
    );
    expect(buildHash("archive", "gettysburg")).toBe(
      "#/speech/gettysburg/archive",
    );
    expect(buildHash("ledger", null)).toBe("#/ledger");
    expect(buildHash("paste", null)).toBe("#/paste");
    expect(buildHash("settings", null)).toBe("#/settings");
  });

  it("round-trips a paste:<uuid> source id through the read screen", () => {
    const id = "paste:1f2e3d4c-aaaa-bbbb-cccc-000011112222";
    expect(parseHash(buildHash("read", id))).toEqual({
      view: "read",
      speechId: id,
    });
  });
});
