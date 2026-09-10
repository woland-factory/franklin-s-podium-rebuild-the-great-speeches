import { describe, it, expect, beforeEach } from "vitest";
import { isDemoEnabled } from "./env";

describe("isDemoEnabled", () => {
  beforeEach(() => {
    window.__ENV__ = { SEED_DEMO: "" };
    window.history.replaceState({}, "", "/");
  });

  it("is off by default", () => {
    expect(isDemoEnabled()).toBe(false);
  });

  it("is on when SEED_DEMO is a truthy env value", () => {
    window.__ENV__ = { SEED_DEMO: "1" };
    expect(isDemoEnabled()).toBe(true);
  });

  it("treats 0, false, and off as off", () => {
    for (const v of ["0", "false", "off", ""]) {
      window.__ENV__ = { SEED_DEMO: v };
      expect(isDemoEnabled()).toBe(false);
    }
  });

  it("is on with the ?demo=1 convenience param", () => {
    window.history.replaceState({}, "", "/?demo=1");
    expect(isDemoEnabled()).toBe(true);
  });
});
