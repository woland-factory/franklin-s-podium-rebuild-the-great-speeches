import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchedulePanel } from "./SchedulePanel";
import { gettysburg } from "../data/gettysburg";
import type { ScheduleEntry } from "../types";

const NOW = 1_700_000_000_000;

function schedule(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    speech_id: gettysburg.id,
    condensed_at: NOW,
    reveal_at: NOW + 2 * 86_400_000,
    status: "waiting",
    ...overrides,
  };
}

function noop() {}

describe("SchedulePanel", () => {
  it("offers gap presets with no schedule and stores one on choice", async () => {
    const onSchedule = vi.fn();
    const user = userEvent.setup();
    render(
      <SchedulePanel
        speech={gettysburg}
        schedule={null}
        onSchedule={onSchedule}
        onStartCold={noop}
        onClear={noop}
        initialNow={NOW}
      />,
    );
    expect(
      screen.getByRole("button", { name: "2 days" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 week" }));
    expect(onSchedule).toHaveBeenCalledWith(7);
  });

  it("shows the countdown, a closed cold control, and add-to-calendar while waiting", () => {
    render(
      <SchedulePanel
        speech={gettysburg}
        schedule={schedule()}
        onSchedule={noop}
        onStartCold={noop}
        onClear={noop}
        initialNow={NOW}
      />,
    );
    const live = screen.getByText(/^opens in 2 days\.$/i);
    expect(live).toHaveAttribute("aria-live", "polite");
    const cold = screen.getByRole("button", {
      name: /cold attempt opens in 2 days/i,
    });
    expect(cold).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /add to calendar/i }),
    ).toBeInTheDocument();
  });

  it("makes the cold attempt the primary action once ready", async () => {
    const onStartCold = vi.fn();
    const user = userEvent.setup();
    render(
      <SchedulePanel
        speech={gettysburg}
        schedule={schedule({ reveal_at: NOW - 1000 })}
        onSchedule={noop}
        onStartCold={onStartCold}
        onClear={noop}
        initialNow={NOW}
      />,
    );
    const start = screen.getByRole("button", { name: /start cold attempt/i });
    expect(start).toHaveClass("btn-primary");
    await user.click(start);
    expect(onStartCold).toHaveBeenCalledTimes(1);
  });

  it("offers another gap once the schedule is done", () => {
    render(
      <SchedulePanel
        speech={gettysburg}
        schedule={schedule({ status: "done" })}
        onSchedule={noop}
        onStartCold={noop}
        onClear={noop}
        initialNow={NOW}
      />,
    );
    expect(screen.getByText(/this cold attempt is done/i)).toBeInTheDocument();
    const fs = screen.getByRole("group", { name: /choose your next gap/i });
    expect(
      within(fs).getByRole("button", { name: "3 days" }),
    ).toBeInTheDocument();
  });

  it("keeps its copy positive and free of banned tells", () => {
    const { container } = render(
      <SchedulePanel
        speech={gettysburg}
        schedule={schedule()}
        onSchedule={noop}
        onStartCold={noop}
        onClear={noop}
        initialNow={NOW}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/[—–]/);
    expect(text).not.toMatch(/unlock/i);
    expect(text).not.toMatch(/seamless|effortless|elevate|empower|leverage/i);
  });
});
