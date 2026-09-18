import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CalendarHeader } from "./calendar-header";

describe("[UI-01][AC-05] CalendarHeader", () => {
  it("selects W and shows the range label when no view prop is given", () => {
    render(<CalendarHeader range={{ start: "2026-11-30", end: "2026-12-06" }} />);

    expect(screen.getByText("30 Nov – 6 Dec 2026")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");
  });

  it("calls onPrev and onNext when the chevrons are clicked", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <CalendarHeader
        range={{ start: "2026-11-30", end: "2026-12-06" }}
        onPrev={onPrev}
        onNext={onNext}
      />,
    );

    await user.click(screen.getByRole("button", { name: /previous/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
