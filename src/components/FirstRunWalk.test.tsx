import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirstRunWalk } from "./FirstRunWalk";

describe("FirstRunWalk", () => {
  it("renders four imperative steps anchored to the controls", () => {
    render(<FirstRunWalk activeStep={1} onSkip={() => {}} />);
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(screen.getByText(/record your version/i)).toBeInTheDocument();
    expect(screen.getByText(/study the pairs/i)).toBeInTheDocument();
  });

  it("marks the active step", () => {
    render(<FirstRunWalk activeStep={2} onSkip={() => {}} />);
    const active = screen.getByText(/fix any misheard words/i);
    expect(active).toHaveAttribute("aria-current", "step");
  });

  it("is skippable", async () => {
    const onSkip = vi.fn();
    const user = userEvent.setup();
    render(<FirstRunWalk activeStep={0} onSkip={onSkip} />);
    await user.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
