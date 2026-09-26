import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Library } from "./Library";
import { speeches } from "../data/speeches";

describe("Library", () => {
  it("renders every curated speech with title, author, and year", () => {
    render(<Library speeches={speeches} onSelect={() => {}} />);
    for (const speech of speeches) {
      expect(
        screen.getByRole("button", {
          name: new RegExp(
            `${speech.title}.*${speech.author}, ${speech.year}`,
            "i",
          ),
        }),
      ).toBeInTheDocument();
    }
  });

  it("shows a positive one-line intro, not an empty-state apology", () => {
    render(<Library speeches={speeches} onSelect={() => {}} />);
    const intro = screen.getByText(/pick a speech to rebuild from memory/i);
    expect(intro).toBeInTheDocument();
    expect(intro.textContent).not.toMatch(/no speech|nothing|yet/i);
  });

  it("calls onSelect with the speech id when a row is pressed", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Library speeches={speeches} onSelect={onSelect} />);
    await user.click(
      screen.getByRole("button", { name: /gettysburg address/i }),
    );
    expect(onSelect).toHaveBeenCalledWith("gettysburg");
  });

  it("makes each row a single reachable control", () => {
    render(<Library speeches={speeches} onSelect={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(speeches.length);
  });
});
