import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { EventDocument } from "@/types/domain";

import { fileTypeLabel, formatFileSize } from "./document-format";
import { DocumentTile } from "./document-tile";

function doc(overrides: Partial<EventDocument> = {}): EventDocument {
  return {
    id: "doc-1",
    clientId: "client-margaret",
    eventId: "event-1",
    name: "Medication chart.pdf",
    mimeType: "application/pdf",
    sizeBytes: 84312,
    uploadedAt: "2026-10-12T10:15:00+11:00",
    ...overrides,
  };
}

describe("formatFileSize", () => {
  it.each([
    [0, "0 B"],
    [1, "1 B"],
    [999, "999 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [84312, "82.3 KB"],
    [1048575, "1.0 MB"],
    [1048576, "1.0 MB"],
    [5 * 1024 * 1024, "5.0 MB"],
    [25 * 1024 * 1024 * 1024, "25.0 GB"],
  ])("[FAM-UI-07][PRD] %i bytes reads %j", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });

  it("[FAM-UI-07][PRD] never prints NaN or a negative size for a broken value", () => {
    expect(formatFileSize(Number.NaN)).toBe("0 B");
    expect(formatFileSize(-5)).toBe("0 B");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("0 B");
  });
});

describe("fileTypeLabel", () => {
  it.each([
    ["application/pdf", "PDF"],
    ["image/jpeg", "JPEG"],
    ["image/png", "PNG"],
    ["image/heic", "HEIC"],
    ["application/msword", "Word"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word"],
    ["application/vnd.ms-excel", "Excel"],
    ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Excel"],
    ["text/plain", "Text"],
    ["APPLICATION/PDF", "PDF"],
    ["application/octet-stream", "File"],
    ["", "File"],
    ["not a mime type", "File"],
  ])("[FAM-UI-07][PRD] %j is labelled %j", (mimeType, expected) => {
    expect(fileTypeLabel(mimeType)).toBe(expected);
  });
});

describe("[FAM-UI-07] DocumentTile", () => {
  it("[FAM-UI-07][PRD] shows the file name, its type and its size", () => {
    render(<DocumentTile document={doc()} />);

    expect(screen.getByText("Medication chart.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF · 82.3 KB")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] cuts a 92-character name to two lines but keeps the whole name in its title and its text", () => {
    const name = `${"Ophthalmologist-letter-eye-drops-schedule-".repeat(3).slice(0, 88)}.pdf`;
    expect(name).toHaveLength(92);
    render(<DocumentTile document={doc({ name })} />);

    const label = screen.getByText(name);
    expect(label).toHaveAttribute("title", name);
    expect(label).toHaveClass("line-clamp-2");
    // Changed under FD-21 (was `toHaveClass("break-all")`): break-all split ordinary words.
    expect(label).not.toHaveClass("break-all");
    expect(label.textContent).toBe(name);
  });

  it("[FAM-UI-07][PRD] is information only: not a link or a button (the contract has metadata, no URL)", () => {
    render(<DocumentTile document={doc()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] copes with non-ASCII names, an unknown type and an empty file", () => {
    render(
      <DocumentTile
        document={doc({
          name: "薬のリスト 🩺.pdf",
          mimeType: "application/x-unknown",
          sizeBytes: 0,
        })}
      />,
    );

    expect(screen.getByText("薬のリスト 🩺.pdf")).toBeInTheDocument();
    expect(screen.getByText("File · 0 B")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] has no axe violations", async () => {
    const { container } = render(
      <ul>
        <li>
          <DocumentTile document={doc()} />
        </li>
      </ul>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

/**
 * jsdom has no layout, so these pin the classes that make each cause impossible; the layout
 * itself is proven by the real-browser width sweep in PROGRESS.md (DECISIONS.md FD-21).
 */
describe("[FAM-UI-07] DocumentTile: fits its tile at any window width", () => {
  const classesOf = (element: Element) => [...element.classList];
  const tileOf = (name: string) => screen.getByText(name).parentElement!;

  it("[FAM-UI-07][PRD] wraps a normal name at its spaces and never in the middle of a word (no break-all: it read 'Medication ch / art.pdf')", () => {
    render(<DocumentTile document={doc()} />);

    const label = screen.getByText("Medication chart.pdf");
    expect(classesOf(label)).not.toContain("break-all");
    expect(classesOf(label)).not.toContain("break-words");
    expect(classesOf(label)).not.toContain("[word-break:break-all]");
  });

  it("[FAM-UI-07][PRD] lets a name with no break point wrap anywhere only as a last resort, still cut at two lines, whole name in the title and the DOM", () => {
    const name = `${"Ophthalmologist".repeat(6)}.pdf`.slice(0, 92);
    expect(name).toHaveLength(92);
    expect(name).not.toMatch(/\s/);
    render(<DocumentTile document={doc({ name })} />);

    const label = screen.getByText(name);
    expect(classesOf(label)).toEqual(
      expect.arrayContaining(["line-clamp-2", "max-w-full", "[overflow-wrap:anywhere]"]),
    );
    expect(label).toHaveAttribute("title", name);
    expect(label.textContent).toBe(name);
  });

  it("[FAM-UI-07][PRD] keeps the type and size on one line, cut with an ellipsis if the tile is ever too narrow, the whole text in its title", () => {
    render(
      <DocumentTile
        document={doc({ mimeType: "application/vnd.ms-excel", sizeBytes: 25 * 1024 ** 3 })}
      />,
    );

    const line = screen.getByText("Excel · 25.0 GB");
    expect(classesOf(line)).toEqual(expect.arrayContaining(["truncate", "max-w-full"]));
    expect(line).toHaveAttribute("title", "Excel · 25.0 GB");
  });

  it("[FAM-UI-07][PRD] takes the width of its grid cell (min 10rem there) instead of a fixed 104px, and can shrink below its text", () => {
    render(<DocumentTile document={doc()} />);

    const tile = tileOf("Medication chart.pdf");
    expect(classesOf(tile)).toEqual(expect.arrayContaining(["w-full", "min-w-0"]));
    expect(classesOf(tile).filter((name) => /^w-\d+$/.test(name))).toEqual([]);
  });
});

/** Family · Info draws client documents, which carry a name but no type or size (FAM-UI-04, CHG-018). */
describe("[FAM-UI-04] DocumentTile: a document with a name only", () => {
  it("[FAM-UI-04][AC-03] draws just the name, with no type and size line, even when details are asked for", () => {
    const { container } = render(<DocumentTile document={{ name: "Care plan.pdf" }} />);

    expect(screen.getByText("Care plan.pdf")).toBeInTheDocument();
    expect(container.textContent).toBe("Care plan.pdf");
    expect(container.textContent).not.toMatch(/undefined|NaN|0 B/);
  });

  it("[FAM-UI-04][AC-03] still draws the type and size when the document has both", () => {
    render(<DocumentTile document={doc()} />);

    expect(screen.getByText("PDF · 82.3 KB")).toBeInTheDocument();
  });
});
