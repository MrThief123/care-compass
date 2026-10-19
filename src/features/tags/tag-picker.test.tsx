import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { TagList } from "./tag-list";
import { TagPicker } from "./tag-picker";

/*
 * [F0-29] The tag picker (AC-01, AC-03, AC-16): the client's tags as toggle chips, a box to add
 * a new one, and the limits. Rendered through a small stateful host, as the forms use it.
 */
function Host({ options, initial = [] }: { options: string[]; initial?: string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <TagPicker options={options} value={value} onChange={setValue} />
      <output data-testid="value">{value.join("|")}</output>
    </>
  );
}

const value = () => screen.getByTestId("value").textContent;

describe("[F0-29] TagPicker", () => {
  it("[F0-29][AC-01] shows each tag as a toggle; pressing one chooses it, again unchooses it", async () => {
    const user = userEvent.setup();
    render(<Host options={["Doctors", "Therapy"]} />);
    const doctors = screen.getByRole("button", { name: "Doctors" });
    expect(doctors).toHaveAttribute("aria-pressed", "false");

    await user.click(doctors);
    expect(doctors).toHaveAttribute("aria-pressed", "true");
    expect(value()).toBe("Doctors");

    await user.click(doctors);
    expect(doctors).toHaveAttribute("aria-pressed", "false");
    expect(value()).toBe("");
  });

  it("[F0-29][AC-01] adds a new tag with Add tag or Enter, chosen, and clears the box", async () => {
    const user = userEvent.setup();
    render(<Host options={["Doctors"]} />);
    await user.type(screen.getByLabelText("New tag"), "Dentist");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    expect(screen.getByRole("button", { name: "Dentist" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("New tag")).toHaveValue("");

    await user.type(screen.getByLabelText("New tag"), "  Eye   clinic {Enter}");
    expect(value()).toBe("Dentist|Eye clinic");
  });

  it("[F0-29][AC-03] a name already in the list, in another case, chooses that tag", async () => {
    const user = userEvent.setup();
    render(<Host options={["Doctors"]} />);
    await user.type(screen.getByLabelText("New tag"), "DOCTORS{Enter}");
    expect(screen.getAllByRole("button", { name: /doctors/i })).toHaveLength(1);
    expect(value()).toBe("Doctors");
  });

  it("[F0-29][AC-03] refuses a name over 30 characters, with a message", async () => {
    const user = userEvent.setup();
    render(<Host options={[]} />);
    await user.type(screen.getByLabelText("New tag"), `${"x".repeat(31)}{Enter}`);
    expect(screen.getByLabelText("New tag")).toHaveAccessibleDescription(
      /Tags can be up to 30 characters\./,
    );
    expect(value()).toBe("");
  });

  it("[F0-29][AC-03] refuses an 11th tag, with a message", async () => {
    const user = userEvent.setup();
    const ten = Array.from({ length: 10 }, (_, index) => `Tag ${index}`);
    render(<Host options={[...ten, "Extra"]} initial={ten} />);
    await user.click(screen.getByRole("button", { name: "Extra" }));
    expect(screen.getByRole("button", { name: "Extra" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Up to 10 tags.")).toBeInTheDocument();
  });

  it("[F0-29][AC-16] is axe clean and marks a chosen chip with more than colour", async () => {
    const { container } = render(<Host options={["Doctors", "Therapy"]} initial={["Doctors"]} />);
    expect(await axe(container)).toHaveNoViolations();
    expect(screen.getByRole("button", { name: "Doctors" }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Therapy" }).querySelector("svg")).toBeNull();
  });
});

describe("[F0-29] TagList", () => {
  it("[F0-29][AC-08] lists the tags, labelled; nothing for none", async () => {
    const { container, rerender } = render(<TagList tags={["Doctors", "Therapy"]} />);
    expect(screen.getByRole("list", { name: "Tags" })).toHaveTextContent("DoctorsTherapy");
    expect(await axe(container)).toHaveNoViolations();
    rerender(<TagList tags={[]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
