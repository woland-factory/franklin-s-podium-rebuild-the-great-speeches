import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("renders designed copy for each kind, not a raw error", () => {
    const { rerender } = render(<ErrorState kind="mic-denied" onRetry={() => {}} />);
    expect(screen.getByText(/turn on your microphone/i)).toBeInTheDocument();

    rerender(<ErrorState kind="transcribe-failed" onRetry={() => {}} />);
    expect(screen.getByText(/give that take another go/i)).toBeInTheDocument();

    rerender(<ErrorState kind="no-speech" onRetry={() => {}} />);
    expect(screen.getByText(/speak a little louder/i)).toBeInTheDocument();
  });

  it("offers a next-step action", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState kind="mic-denied" onRetry={onRetry} />);
    await user.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
