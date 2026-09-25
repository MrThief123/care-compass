import { describe, expect, it } from "vitest";

import { denseDay, melbourne, occurrence } from "./test-support";
import {
  DEFAULT_END_HOUR,
  DEFAULT_START_HOUR,
  MIN_BLOCK_PX,
  ROW_PX,
  layoutDay,
  timelineWindow,
} from "./today-layout";

function at(time: string, minutes: number, title = `Event at ${time}`) {
  return occurrence({ title, start: melbourne(time), durationMinutes: minutes, status: "planned" });
}

describe("[FAM-UI-01][PRD] timelineWindow", () => {
  it("opens on 07:00 to 19:00 (rows 07:00 to 18:00) for an empty day and for the design's day", () => {
    expect(timelineWindow([])).toEqual({
      startHour: DEFAULT_START_HOUR,
      endHour: DEFAULT_END_HOUR,
    });
    expect(DEFAULT_START_HOUR).toBe(7);
    expect(DEFAULT_END_HOUR).toBe(19);
    expect(timelineWindow([at("09:00", 60), at("11:30", 90), at("15:00", 60)])).toEqual({
      startHour: 7,
      endHour: 19,
    });
  });

  it("stretches earlier for an event before 07:00, down to midnight", () => {
    expect(timelineWindow([at("05:30", 30)]).startHour).toBe(5);
    expect(timelineWindow([at("00:10", 30)]).startHour).toBe(0);
  });

  it("stretches later for an event that runs past 19:00, up to midnight", () => {
    expect(timelineWindow([at("22:15", 60)]).endHour).toBe(24);
    expect(timelineWindow([at("23:30", 120)]).endHour).toBe(24);
    expect(timelineWindow([at("18:00", 60)]).endHour).toBe(19);
  });

  it("leaves room for the minimum block height, so a short late event is not pulled up onto earlier hours", () => {
    // A 10-minute event at 18:50 is drawn MIN_BLOCK_PX tall, which runs past 19:00.
    expect(timelineWindow([at("18:50", 10)]).endHour).toBe(20);
  });
});

describe("[FAM-UI-01][PRD] layoutDay with nothing in the way", () => {
  it("places a block by its start and duration on 44px hour rows", () => {
    const layout = layoutDay([at("09:00", 60)]);
    expect(ROW_PX).toBe(44);
    expect(layout.startHour).toBe(7);
    expect(layout.canvasHeight).toBe((19 - 7) * ROW_PX);
    expect(layout.blocks).toHaveLength(1);
    expect(layout.blocks[0]).toMatchObject({ top: 2 * ROW_PX, height: ROW_PX });
    expect(layout.stretched).toBe(false);
  });

  it("puts the design's three events exactly where the design draws them, on an even hour scale", () => {
    const layout = layoutDay([at("09:00", 60), at("11:30", 90), at("15:00", 60)]);

    expect(layout.blocks.map((block) => [block.top, block.height])).toEqual([
      [88, 44],
      [198, 66],
      [352, 44],
    ]);
    expect(layout.hours.map((mark) => mark.hour)).toEqual([
      7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ]);
    expect(layout.hours.map((mark) => mark.top)).toEqual(
      Array.from({ length: 12 }, (_, index) => index * ROW_PX),
    );
    expect(layout.stretched).toBe(false);
  });

  it("marks the hours in which an event starts", () => {
    const layout = layoutDay([at("09:00", 60), at("11:30", 90)]);

    expect(layout.hours.filter((mark) => mark.startsEvent).map((mark) => mark.hour)).toEqual([
      9, 11,
    ]);
  });

  it("keeps a short event tall enough to hold its title, assignee, duration and status pill on one row", () => {
    const [short] = layoutDay([at("09:00", 15)]).blocks;
    expect(short!.height).toBe(MIN_BLOCK_PX);
    expect(MIN_BLOCK_PX).toBeGreaterThanOrEqual(32);
  });

  it("returns no blocks and a default canvas for an empty day", () => {
    const layout = layoutDay([]);
    expect(layout.blocks).toEqual([]);
    expect(layout.canvasHeight).toBe(12 * ROW_PX);
    expect(layout.stretched).toBe(false);
  });

  it("lists blocks in time order, which is the order keyboard focus will follow", () => {
    const layout = layoutDay([at("15:00", 60), at("09:00", 60), at("11:30", 90)]);
    expect(layout.blocks.map((block) => block.occurrence.title)).toEqual([
      "Event at 09:00",
      "Event at 11:30",
      "Event at 15:00",
    ]);
  });

  it("reads Melbourne wall-clock time, not UTC", () => {
    // 09:00 in Melbourne (+11:00) is 22:00 UTC the day before.
    const [block] = layoutDay([at("09:00", 60)]).blocks;
    expect(block!.top).toBe(2 * ROW_PX);
  });

  it("draws an event that runs past midnight to the end of the day, and never off the canvas", () => {
    const layout = layoutDay([at("23:30", 120), at("23:50", 10)]);
    for (const block of layout.blocks) {
      expect(block.top).toBeGreaterThanOrEqual(0);
      expect(block.top + block.height).toBeLessThanOrEqual(layout.canvasHeight);
    }
  });
});

describe("[FAM-UI-01][PRD] layoutDay when events overlap: stacked full width, the hour scale stretches", () => {
  it("never draws two blocks over each other: the later one sits below, and later hours move down with it", () => {
    const layout = layoutDay([at("09:00", 60, "A"), at("09:00", 60, "B")]);
    const [a, b] = layout.blocks;

    expect(a!.top).toBe(2 * ROW_PX);
    expect(b!.top).toBe(a!.top + a!.height);
    expect(layout.stretched).toBe(true);
    // The hour after the pair starts below both, so B is still inside 09:00's stretch of the scale.
    const tenOClock = layout.hours.find((mark) => mark.hour === 10)!;
    expect(tenOClock.top).toBeGreaterThanOrEqual(b!.top + b!.height);
  });

  it("says which blocks were pushed down, so the screen can tell a stacked block from a lone one", () => {
    const layout = layoutDay([at("09:00", 60, "A"), at("09:00", 60, "B"), at("14:00", 60, "Lone")]);

    expect(layout.blocks.map((block) => [block.occurrence.title, block.pushed])).toEqual([
      ["A", false],
      ["B", true],
      ["Lone", false],
    ]);
  });

  it("orders events that start together longest first, then by key, so the order never flickers", () => {
    const layout = layoutDay([
      at("09:00", 30, "Short"),
      at("09:00", 90, "Long"),
      at("09:00", 30, "Also short"),
    ]);

    expect(layout.blocks[0]!.occurrence.title).toBe("Long");
    expect(layout.blocks.map((block) => block.occurrence.title)).toEqual(
      layoutDay([
        at("09:00", 90, "Long"),
        at("09:00", 30, "Also short"),
        at("09:00", 30, "Short"),
      ]).blocks.map((block) => block.occurrence.title),
    );
  });

  it("puts an event that starts inside a longer one below it, not beside it", () => {
    const layout = layoutDay([at("09:00", 120, "Long"), at("09:30", 30, "Inside")]);
    const [long, inside] = layout.blocks;

    expect(inside!.top).toBe(long!.top + long!.height);
  });

  it("does not stretch anything for events that merely touch", () => {
    const layout = layoutDay([at("09:00", 60), at("10:00", 60)]);

    expect(layout.stretched).toBe(false);
    expect(layout.blocks.map((block) => block.top)).toEqual([88, 132]);
  });

  it("keeps the hour scale in order and every block inside its own hour, however crowded", () => {
    const layout = layoutDay(denseDay(32));

    const tops = layout.hours.map((mark) => mark.top);
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(new Set(tops).size).toBe(tops.length);

    for (const block of layout.blocks) {
      const minutes = block.startMinutes;
      const hour = Math.floor(minutes / 60);
      const mark = layout.hours.find((candidate) => candidate.hour === hour)!;
      const next = layout.hours.find((candidate) => candidate.hour === hour + 1);
      expect(block.top, block.occurrence.title).toBeGreaterThanOrEqual(mark.top);
      if (next) expect(block.top, block.occurrence.title).toBeLessThan(next.top);
    }
  });

  it("keeps every block of a 32-occurrence day and none overlaps another", () => {
    const layout = layoutDay(denseDay(32));

    expect(layout.blocks).toHaveLength(32);
    expect(new Set(layout.blocks.map((block) => block.occurrence.key)).size).toBe(32);
    expect(layout.stretched).toBe(true);

    for (const [index, block] of layout.blocks.entries()) {
      expect(block.top).toBeGreaterThanOrEqual(0);
      expect(block.top + block.height).toBeLessThanOrEqual(layout.canvasHeight);
      const previous = layout.blocks[index - 1];
      if (previous) expect(block.top).toBeGreaterThanOrEqual(previous.top + previous.height);
    }
  });

  it("copes with a hundred occurrences in one day", () => {
    const layout = layoutDay(denseDay(100));

    expect(layout.blocks).toHaveLength(100);
    expect(Number.isFinite(layout.canvasHeight)).toBe(true);
    expect(layout.canvasHeight).toBeGreaterThanOrEqual(100 * MIN_BLOCK_PX);
  });
});

describe("[FAM-UI-01][PRD] layoutDay.yAt places the current time on the same scale", () => {
  it("is even when nothing is stretched", () => {
    const layout = layoutDay([at("09:00", 60)]);

    expect(layout.yAt(7 * 60)).toBe(0);
    expect(layout.yAt(10 * 60 + 30)).toBe(3.5 * ROW_PX);
  });

  it("follows the stretched hours, so the line still sits between the labels it is between", () => {
    const layout = layoutDay([at("09:00", 60, "A"), at("09:00", 60, "B")]);
    const nine = layout.hours.find((mark) => mark.hour === 9)!;
    const ten = layout.hours.find((mark) => mark.hour === 10)!;

    const middle = layout.yAt(9 * 60 + 30)!;
    expect(middle).toBeGreaterThan(nine.top);
    expect(middle).toBeLessThan(ten.top);
  });

  it("is null outside the hours shown", () => {
    const layout = layoutDay([]);

    expect(layout.yAt(6 * 60)).toBeNull();
    expect(layout.yAt(19 * 60 + 1)).toBeNull();
    expect(layout.yAt(12 * 60)).not.toBeNull();
  });
});
