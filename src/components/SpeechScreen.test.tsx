import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpeechScreen } from "./SpeechScreen";
import { gettysburg } from "../data/gettysburg";

describe("SpeechScreen", () => {
  it("renders the title, byline, and all ten hints from static data", () => {
    render(<SpeechScreen speech={gettysburg} />);
    expect(
      screen.getByRole("heading", { name: /the gettysburg address/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/abraham lincoln, 1863/i)).toBeInTheDocument();

    const hints = screen.getAllByRole("listitem");
    expect(hints).toHaveLength(gettysburg.hint_deck.length);
    expect(hints).toHaveLength(10);
    expect(screen.getByText(gettysburg.hint_deck[0])).toBeInTheDocument();
  });

  it("includes the full speech text without requiring any async load", () => {
    render(<SpeechScreen speech={gettysburg} />);
    expect(screen.getByText(gettysburg.sentences[0])).toBeInTheDocument();
  });
});
