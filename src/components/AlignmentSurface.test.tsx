import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlignmentSurface } from "./AlignmentSurface";
import type { AlignmentPair } from "../types";

const pairs: AlignmentPair[] = [
  { spoken: "we are met on a field", original: "We are met on a great battle-field", relation: "aligned" },
  { spoken: null, original: "It is altogether fitting and proper", relation: "original-only" },
  { spoken: "this reminds me of my own fear", original: null, relation: "spoken-only" },
];

describe("AlignmentSurface", () => {
  it("renders one row per pair with the spoken and original text", () => {
    render(<AlignmentSurface pairs={pairs} />);
    expect(screen.getByText("we are met on a field")).toBeInTheDocument();
    expect(
      screen.getByText("We are met on a great battle-field"),
    ).toBeInTheDocument();
    expect(screen.getByText("this reminds me of my own fear")).toBeInTheDocument();
    expect(
      screen.getByText("It is altogether fitting and proper"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("shows neutral captions for gap rows", () => {
    render(<AlignmentSurface pairs={pairs} />);
    expect(screen.getByText(/in the original, not in yours/i)).toBeInTheDocument();
    expect(screen.getByText(/in yours, not the original/i)).toBeInTheDocument();
  });

  it("never renders a percentage, score, pass/fail, or error styling", () => {
    const { container } = render(<AlignmentSurface pairs={pairs} />);
    const html = container.innerHTML;
    expect(html).not.toContain("%");
    expect(html).not.toMatch(/\b(score|percent|grade|pass|fail|correct|wrong)\b/i);
    expect(container.querySelector('[class*="error"]')).toBeNull();
    expect(container.querySelector('[class*="diff"]')).toBeNull();
    expect(container.querySelector('[class*="red"]')).toBeNull();
    expect(container.querySelector("del, ins, s")).toBeNull();
  });

  it("renders a replay control when an audio url is present", () => {
    const { container } = render(
      <AlignmentSurface pairs={pairs} audioUrl="blob:fake" />,
    );
    expect(container.querySelector("audio")).not.toBeNull();
  });
});
