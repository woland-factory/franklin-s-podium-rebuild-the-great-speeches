import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeechScreen } from "./SpeechScreen";
import { fightNoMore } from "../data/fight-no-more";

describe("SpeechScreen", () => {
  it("renders a non-Gettysburg speech's title, byline, hints, and full text", () => {
    render(<SpeechScreen speech={fightNoMore} />);
    expect(
      screen.getByRole("heading", { name: /i will fight no more forever/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/chief joseph, 1877/i)).toBeInTheDocument();

    const hints = screen.getAllByRole("listitem");
    expect(hints).toHaveLength(fightNoMore.hint_deck.length);
    expect(screen.getByText(fightNoMore.hint_deck[0])).toBeInTheDocument();

    // Full text renders from static data, no async load required.
    expect(screen.getByText(fightNoMore.sentences[0])).toBeInTheDocument();
  });

  it("uses a count-agnostic moves heading", () => {
    render(<SpeechScreen speech={fightNoMore} />);
    expect(screen.getByRole("heading", { name: /^the moves$/i })).toBeInTheDocument();
    expect(screen.queryByText(/the ten moves/i)).toBeNull();
  });

  it("fires the start and back callbacks from their controls", async () => {
    const onStart = vi.fn();
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(
      <SpeechScreen speech={fightNoMore} onStart={onStart} onBack={onBack} />,
    );
    await user.click(screen.getByRole("button", { name: /start warm-up/i }));
    await user.click(screen.getByRole("button", { name: /all speeches/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders no action buttons when used as a reference", () => {
    render(<SpeechScreen speech={fightNoMore} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
