import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmationModal } from "./confirmation-modal";

/** Mirrors real usage: a trigger button that opens the modal, so focus return is observable. */
function ModalHarness({ onCancel }: { onCancel: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Deactivate staff member
      </button>
      <ConfirmationModal
        open={open}
        tone="destructive"
        title="Deactivate Aisha Rahman?"
        body="They will lose access immediately. Their past completions stay on record."
        confirmLabel="Deactivate"
        onConfirm={() => setOpen(false)}
        onCancel={() => {
          setOpen(false);
          onCancel();
        }}
      />
    </>
  );
}

describe("[UI-02][AC-02] ConfirmationModal", () => {
  it("calls onCancel on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ModalHarness onCancel={onCancel} />);

    const trigger = screen.getByRole("button", { name: "Deactivate staff member" });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("moves focus into the dialog when it opens", async () => {
    const user = userEvent.setup();
    render(<ModalHarness onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Deactivate staff member" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("traps Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<ModalHarness onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Deactivate staff member" }));
    const dialog = screen.getByRole("dialog");

    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("labels the dialog with its title and shows a warning icon", async () => {
    const user = userEvent.setup();
    render(<ModalHarness onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Deactivate staff member" }));

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Deactivate Aisha Rahman?");
    expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
  });

  it("calls onCancel from the close X and from Cancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ModalHarness onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Deactivate staff member" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Deactivate staff member" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("renders nothing while closed", () => {
    render(
      <ConfirmationModal
        open={false}
        title="Deactivate Aisha Rahman?"
        body="They will lose access immediately."
        confirmLabel="Deactivate"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
