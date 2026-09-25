import { describe, expect, it } from "vitest";

import { statusPillClassName } from "./status-pill-class";

const classesOf = (status: Parameters<typeof statusPillClassName>[0]) =>
  statusPillClassName(status).split(" ");

describe("[FAM-UI-07] statusPillClassName", () => {
  it.each(["done", "planned", "overdue"] as const)(
    "[FAM-UI-07][PRD] %s pill may shrink, keeps its icon full size and is 26px tall (py-[3px])",
    (status) => {
      expect(classesOf(status)).toEqual(
        expect.arrayContaining(["min-w-0", "py-[3px]", "[&>svg]:shrink-0"]),
      );
    },
  );

  it("[FAM-UI-07][PRD] only the Done pill gets a transparent border: the kit's Planned and Overdue pills already have their own coloured border, which it must not override", () => {
    expect(classesOf("done")).toEqual(expect.arrayContaining(["border", "border-transparent"]));
    expect(classesOf("planned")).not.toContain("border-transparent");
    expect(classesOf("overdue")).not.toContain("border-transparent");
  });
});
