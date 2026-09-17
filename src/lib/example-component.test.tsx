import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Inline component: proves the Vitest + jsdom + Testing Library pipeline
// renders and queries JSX. Real components belong to F0-14/F0-15 (src/components).
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}</p>;
}

describe("Greeting", () => {
  it("renders the given name", () => {
    render(<Greeting name="Care Compass" />);
    expect(screen.getByText("Hello, Care Compass")).toBeInTheDocument();
  });
});
