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
});

describe("buildHash", () => {
  it("round-trips each view", () => {
    expect(buildHash("library", null)).toBe("#/");
    expect(buildHash("read", "gettysburg")).toBe("#/speech/gettysburg");
    expect(buildHash("reconstruct", "gettysburg")).toBe(
      "#/speech/gettysburg/warmup",
    );
  });
});
