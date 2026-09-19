import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { EventDocument } from "@/types/domain";

import { DocumentTile } from "./document-tile";
import { fileTypeLabel, formatFileSize } from "./document-format";

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
    expect(label).toHaveClass("break-all");
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
