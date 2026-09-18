import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SelectableListRow } from "./selectable-list-row";

describe("SelectableListRow", () => {
  it("[UI-03][AC-03] has aria-selected='true' and shows a check icon when selected", () => {
    render(<SelectableListRow name="Aisha Rahman" selected onClick={() => {}} />);

    expect(screen.getByRole("option", { name: "Aisha Rahman" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
  });

  it("has aria-selected='false' and no check icon when not selected", () => {
    render(<SelectableListRow name="Daniel K." selected={false} onClick={() => {}} />);

    expect(screen.getByRole("option", { name: "Daniel K." })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.queryByTestId("icon-check")).not.toBeInTheDocument();
  });
});
