import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

import { getTaskLog } from "@/server/events/queries";

import { loadTaskLog } from "./load-task-log";
import { parseTaskLogParams, type TaskLogParams } from "./task-log-params";
import { TaskLogView, type TaskLogViewProps } from "./task-log-view";
import { taskLogHref, taskLogQuery } from "./task-routes";

/*
 * [F0-29] The Task log's Tag filter (AC-07, AC-09, AC-15, AC-16) and the tags under each task
 * (AC-08), for Family and Carer (one view). Read through the real contract on the mock source.
 */
const ID = "client-margaret";
const PLAIN: TaskLogParams = { q: "", page: 1 };
const MEDICATION_EVENTS = new Set([
  "event-margaret-med-review",
  "event-margaret-morning-meds",
  "event-margaret-evening-meds",
]);

beforeEach(() => vi.stubEnv("DATA_SOURCE", "mock"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function renderLog(props: Partial<TaskLogViewProps> = {}) {
  const { items, total, pageSize } = await getTaskLog(ID, { page: 1 });
  return render(
    <TaskLogView
      clientId={ID}
      items={items}
      total={total}
      pageSize={pageSize}
      params={PLAIN}
      {...props}
    />,
  );
}

describe("[F0-29] Task log tag in the URL", () => {
  it("[F0-29][AC-07] reads ?tag= cleaned, and writes it back", () => {
    expect(parseTaskLogParams({ tag: "  Doctors " }).tag).toBe("Doctors");
    expect(taskLogQuery({ q: "", tag: "Doctors", page: 2 })).toBe("tag=Doctors&page=2");
    expect(taskLogHref(ID, { q: "", tag: "Eye clinic", page: 1 })).toBe(
      "/family/client-margaret/tasks?tag=Eye+clinic",
    );
  });

  it("[F0-29][AC-09] ignores a tag that is not a valid tag name", () => {
    expect(parseTaskLogParams({ tag: "x".repeat(31) }).tag).toBeUndefined();
    expect(parseTaskLogParams({ tag: "   " }).tag).toBeUndefined();
    expect(parseTaskLogParams({ tag: ["Doctors", "Therapy"] }).tag).toBe("Doctors");
    expect(taskLogQuery({ q: "", tag: "x".repeat(31), page: 1 })).toBe("");
  });

  it("[F0-29][AC-07] loadTaskLog asks the contract for that tag only", async () => {
    const loaded = await loadTaskLog(ID, { tag: "medication" });
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.params.tag).toBe("medication");
    expect(loaded.total).toBeGreaterThan(0);
    expect(loaded.items.every((row) => MEDICATION_EVENTS.has(row.eventId))).toBe(true);
  });
});

describe("[F0-29] Task log Tag select", () => {
  it("[F0-29][AC-07] lists All tags and the client's tags; choosing one puts it in the URL on page 1", async () => {
    const user = userEvent.setup();
    await renderLog({
      tagOptions: ["Doctors", "Medication"],
      params: { q: "", status: "done", page: 3 },
    });
    const select = screen.getByLabelText("Tag");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All tags", "Doctors", "Medication"]);
    await user.selectOptions(select, "Doctors");
    expect(replace).toHaveBeenCalledWith("/family/client-margaret/tasks?status=done&tag=Doctors", {
      scroll: false,
    });
  });

  it("[F0-29][AC-07] All tags takes the tag out of the URL", async () => {
    const user = userEvent.setup();
    await renderLog({ tagOptions: ["Doctors"], params: { q: "", tag: "Doctors", page: 1 } });
    await user.selectOptions(screen.getByLabelText("Tag"), "All tags");
    expect(replace).toHaveBeenCalledWith("/family/client-margaret/tasks", { scroll: false });
  });

  it("[F0-29][AC-07] a carer's log keeps the carer's path", async () => {
    const user = userEvent.setup();
    await renderLog({ tagOptions: ["Doctors"], basePath: "/carer/patients/client-margaret" });
    await user.selectOptions(screen.getByLabelText("Tag"), "Doctors");
    expect(replace).toHaveBeenCalledWith("/carer/patients/client-margaret/tasks?tag=Doctors", {
      scroll: false,
    });
  });

  it("[F0-29][AC-09] a tag nobody uses shows No tasks found", () => {
    render(
      <TaskLogView
        clientId={ID}
        items={[]}
        total={0}
        pageSize={20}
        params={{ q: "", tag: "Nobody", page: 1 }}
        tagOptions={[]}
      />,
    );
    expect(screen.getByText("No tasks found")).toBeInTheDocument();
    expect(screen.getByLabelText("Tag")).toHaveValue("Nobody");
  });

  it("[F0-29][AC-15] a client with no tags has no Tag select", async () => {
    await renderLog({ tagOptions: [] });
    expect(screen.queryByLabelText("Tag")).not.toBeInTheDocument();
  });
});

describe("[F0-29] tags under each task", () => {
  it("[F0-29][AC-08] shows the event's tags under the task title", async () => {
    const { items } = await getTaskLog(ID, { page: 1 });
    const morning = items.find((row) => row.eventId === "event-margaret-morning-meds")!;
    await renderLog({
      tagOptions: ["Medication"],
      tagsByEvent: { "event-margaret-morning-meds": ["Medication"] },
    });
    const link = screen.getAllByRole("link", { name: new RegExp(morning.title) })[0]!;
    const row = link.closest("tr")!;
    expect(within(row).getByRole("list", { name: "Tags" })).toHaveTextContent("Medication");
  });

  it("[F0-29][AC-16] the log with tags is axe clean", async () => {
    const { container } = await renderLog({
      tagOptions: ["Medication"],
      tagsByEvent: { "event-margaret-morning-meds": ["Medication"] },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
