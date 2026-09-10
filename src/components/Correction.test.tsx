import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Correction } from "./Correction";

describe("Correction", () => {
  it("shows the cleaned transcript as an editable default", () => {
    render(<Correction initialText="we are met on a field" onSubmit={() => {}} />);
    const box = screen.getByLabelText(/your spoken reconstruction/i);
    expect(box).toHaveValue("we are met on a field");
  });

  it("lets the user edit and proceeds with one press", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Correction initialText="we are met" onSubmit={onSubmit} />);

    const box = screen.getByLabelText(/your spoken reconstruction/i);
    await user.type(box, " on a field");
    await user.click(screen.getByRole("button", { name: /study alignment/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("we are met on a field");
  });

  it("disables the primary action when the field is empty", () => {
    render(<Correction initialText="" onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /study alignment/i })).toBeDisabled();
  });
});
