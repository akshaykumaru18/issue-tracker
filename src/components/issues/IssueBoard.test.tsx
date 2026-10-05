/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IssueBoard } from "@/components/issues/IssueBoard";
import { createMemoryIssueRepository } from "@/lib/issues/repository";
import type { Issue } from "@/lib/issues/types";

const sample: Issue = {
  id: "issue-1",
  title: "Login page renders blank",
  description: "White screen after submit.",
  status: "open",
  priority: "high",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-04T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
});

describe("IssueBoard", () => {
  it("creates, searches, updates, and deletes an issue", async () => {
    const repository = createMemoryIssueRepository([sample], {
      now: () => "2026-10-05T12:00:00.000Z",
      createId: () => "created-1",
    });

    render(<IssueBoard repository={repository} />);

    expect(
      await screen.findByRole("button", { name: /Login page renders blank/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "New issue" }));
    fireEvent.click(screen.getByRole("button", { name: "Create issue" }));
    expect(await screen.findByText("Title is required.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Export report" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "CSV download fails" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create issue" }));

    const createdCard = await screen.findByRole("button", { name: /Export report/i });
    expect(createdCard.textContent).toMatch(/Open/);

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "export" },
    });
    expect(screen.queryByRole("button", { name: /Login page renders blank/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Export report/i })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "done" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const updatedCard = await screen.findByRole("button", { name: /Export report/i });
    expect(updatedCard.textContent).toMatch(/Done/);

    fireEvent.click(screen.getByRole("button", { name: "Done (1)" }));
    expect(screen.queryByRole("button", { name: /Login page renders blank/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete issue" }));

    expect(await screen.findByText("No matching issues")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "All (1)" }));
    expect(screen.getByRole("button", { name: /Login page renders blank/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Export report/i })).toBeNull();
    expect(await repository.list()).toEqual([sample]);
  });
});
