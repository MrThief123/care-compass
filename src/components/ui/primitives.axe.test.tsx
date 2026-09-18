import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { FileTile } from "../shared/file-tile";
import { SearchField } from "../shared/search-field";
import { EmptyState, ErrorState, ListRowSkeleton, CardGridSkeleton } from "../shared/states";
import { StatusPill } from "../shared/status-pill";

import { Avatar } from "./avatar";
import { Button } from "./button";
import { CardShell } from "./card-shell";
import { Checkbox } from "./checkbox";
import { CountBadge } from "./count-badge";
import { Icon } from "./icon";
import { ProgressBar } from "./progress-bar";
import { SegmentedControl } from "./segmented-control";

describe("[F0-14][AC-05] primitive accessibility", () => {
  it("Icon has no axe violations", async () => {
    const { container } = render(<Icon name="home" aria-hidden />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Avatar has no axe violations", async () => {
    const { container } = render(<Avatar name="Aisha Rahman" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Button has no axe violations", async () => {
    const { container } = render(
      <>
        <Button variant="primary">Save</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Learn more</Button>
        <Button disabled>Disabled</Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatusPill has no axe violations", async () => {
    const { container } = render(
      <>
        <StatusPill status="planned" />
        <StatusPill status="done" actorName="Aisha Rahman" />
        <StatusPill status="overdue" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CountBadge has no axe violations", async () => {
    const { container } = render(
      <>
        <CountBadge count={3} />
        <CountBadge count={2} tone="alert" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ProgressBar has no axe violations", async () => {
    const { container } = render(<ProgressBar value={60} label="Budget used" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CardShell has no axe violations", async () => {
    const { container } = render(<CardShell>Card content</CardShell>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Checkbox has no axe violations", async () => {
    const { container } = render(<Checkbox label="Take medication" checked onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SegmentedControl has no axe violations", async () => {
    const { container } = render(<SegmentedControl />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SearchField has no axe violations", async () => {
    const { container } = render(<SearchField value="" onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("FileTile has no axe violations", async () => {
    const { container } = render(
      <>
        <FileTile variant="filled" fileName="Care-plan.pdf" />
        <FileTile variant="add" onAdd={() => {}} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState and ErrorState have no axe violations", async () => {
    const { container } = render(
      <>
        <EmptyState title="All caught up" body="There are no overdue tasks right now." />
        <ErrorState onRetry={() => {}} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Skeletons have no axe violations", async () => {
    const { container } = render(
      <>
        <ListRowSkeleton />
        <CardGridSkeleton />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
