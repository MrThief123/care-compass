import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SearchField } from "./search-field";

describe("SearchField", () => {
  it("[F0-14][AC-03] shows 'No matches for \"Zoe\".' when the query has no results", () => {
    render(<SearchField value="Zoe" onChange={() => {}} noResultsFor="Zoe" />);

    expect(screen.getByText('No matches for "Zoe".')).toBeInTheDocument();
  });

  it("does not show a no-results message while empty", () => {
    render(<SearchField value="" onChange={() => {}} />);

    expect(screen.queryByText(/No matches for/)).not.toBeInTheDocument();
  });

  it("shows a loading indicator when loading", () => {
    render(<SearchField value="Zoe" onChange={() => {}} loading />);

    expect(screen.getByRole("status", { name: /searching/i })).toBeInTheDocument();
  });

  it("calls onClear when the clear button is clicked", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<SearchField value="Zoe" onChange={() => {}} onClear={onClear} />);

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
