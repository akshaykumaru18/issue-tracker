"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IssueFilters } from "@/components/issues/IssueFilters";
import { IssueForm } from "@/components/issues/IssueForm";
import { IssueList } from "@/components/issues/IssueList";
import { Button } from "@/components/ui/Button";
import { IssueNotFoundError, IssueValidationError } from "@/lib/issues/errors";
import { countByStatus, queryIssues } from "@/lib/issues/queries";
import {
  createBrowserIssueRepository,
  type IssueRepository,
} from "@/lib/issues/repository";
import type { FieldErrors, Issue, IssueDraft, IssueListQuery } from "@/lib/issues/types";
import { validateIssueDraft } from "@/lib/issues/validation";

type EditorMode = "idle" | "create" | "edit";

const EMPTY_DRAFT: IssueDraft = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
};

type IssueBoardProps = {
  repository?: IssueRepository;
};

function toDraft(issue: Issue): IssueDraft {
  return {
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
  };
}

export function IssueBoard({ repository }: IssueBoardProps) {
  const browserRepository = useRef<IssueRepository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState<IssueListQuery>({ status: "all", search: "" });
  const [mode, setMode] = useState<EditorMode>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IssueDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditorOnMobile, setShowEditorOnMobile] = useState(false);
  const savingRef = useRef(false);

  function getRepository(): IssueRepository {
    if (repository) return repository;
    if (!browserRepository.current) {
      browserRepository.current = createBrowserIssueRepository();
    }
    return browserRepository.current;
  }

  useEffect(() => {
    let active = true;
    const repo =
      repository ??
      (browserRepository.current ??= createBrowserIssueRepository());

    repo
      .list()
      .then((next) => {
        if (!active) return;
        setIssues(next);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setBanner("Issues could not be loaded from this browser.");
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [repository]);

  const visibleIssues = useMemo(
    () => queryIssues(issues, query),
    [issues, query],
  );
  const counts = useMemo(() => countByStatus(issues), [issues]);
  const selected = issues.find((issue) => issue.id === selectedId) ?? null;

  function resetEditor() {
    setMode("idle");
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setConfirmDelete(false);
    setShowEditorOnMobile(false);
  }

  function startCreate() {
    setMode("create");
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setBanner(null);
    setConfirmDelete(false);
    setShowEditorOnMobile(true);
  }

  function openIssue(issue: Issue) {
    setMode("edit");
    setSelectedId(issue.id);
    setDraft(toDraft(issue));
    setErrors({});
    setBanner(null);
    setConfirmDelete(false);
    setShowEditorOnMobile(true);
  }

  async function reloadIssues() {
    const next = await getRepository().list();
    setIssues(next);
    return next;
  }

  async function handleSubmit() {
    if (savingRef.current) return;

    const result = validateIssueDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setBanner(null);
    try {
      const repo = getRepository();
      if (mode === "create") {
        const created = await repo.create(result.value);
        await reloadIssues();
        setSelectedId(created.id);
        setMode("edit");
        setDraft(toDraft(created));
        setErrors({});
        return;
      }

      if (mode === "edit" && selectedId) {
        const updated = await repo.update(selectedId, result.value);
        await reloadIssues();
        setDraft(toDraft(updated));
        setErrors({});
      }
    } catch (error) {
      if (error instanceof IssueValidationError) {
        setErrors(error.errors);
        return;
      }
      if (error instanceof IssueNotFoundError) {
        setBanner("That issue is no longer available.");
        resetEditor();
        await reloadIssues().catch(() => setIssues([]));
        return;
      }
      setBanner("The issue could not be saved. Check browser storage and try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!selectedId || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setBanner(null);
    try {
      await getRepository().remove(selectedId);
      await reloadIssues();
      resetEditor();
    } catch (error) {
      if (error instanceof IssueNotFoundError) {
        setBanner("That issue is no longer available.");
        resetEditor();
        await reloadIssues().catch(() => setIssues([]));
        return;
      }
      setBanner("The issue could not be deleted.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const editorOpen = mode === "create" || (mode === "edit" && selected !== null);

  return (
    <div className="app-shell flex flex-1 flex-col">
      <header className="app-header">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="body2">Saved in this browser</p>
            <h1 className="heading1">Issue tracker</h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/login" className="btn btn-ghost w-full no-underline sm:w-auto">
              Sign in
            </Link>
            <Button className="w-full sm:w-auto" onClick={startCreate}>
              New issue
            </Button>
          </div>
        </div>
      </header>

      {banner ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <p className="alert" role="alert">
            {banner}
          </p>
        </div>
      ) : null}

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section
          className={showEditorOnMobile ? "hidden lg:flex lg:flex-col lg:gap-4" : "flex flex-col gap-4"}
          aria-label="Issues"
        >
          {ready ? (
            <IssueFilters query={query} counts={counts} onChange={setQuery} />
          ) : null}
          <IssueList
            issues={visibleIssues}
            selectedId={selectedId}
            ready={ready}
            totalCount={issues.length}
            onSelect={openIssue}
          />
        </section>

        <section
          className={showEditorOnMobile ? "block" : "hidden lg:block"}
          aria-label="Issue editor"
        >
          {showEditorOnMobile ? (
            <Button
              variant="ghost"
              className="mb-4 w-full lg:hidden"
              onClick={() => setShowEditorOnMobile(false)}
            >
              Back to list
            </Button>
          ) : null}

          {editorOpen ? (
            <IssueForm
              mode={mode === "create" ? "create" : "edit"}
              draft={draft}
              errors={errors}
              saving={saving}
              confirmDelete={confirmDelete}
              updatedAt={mode === "edit" ? selected?.updatedAt : undefined}
              onChange={(patch) => {
                setDraft((current) => ({ ...current, ...patch }));
                setErrors((current) => {
                  const next = { ...current };
                  for (const key of Object.keys(patch) as Array<keyof IssueDraft>) {
                    delete next[key];
                  }
                  return next;
                });
              }}
              onSubmit={() => {
                void handleSubmit();
              }}
              onRequestDelete={() => setConfirmDelete(true)}
              onCancelDelete={() => setConfirmDelete(false)}
              onConfirmDelete={() => {
                void handleConfirmDelete();
              }}
            />
          ) : (
            <div className="card">
              <h2 className="heading2">No issue selected</h2>
              <p className="body1 mt-2">
                Choose an issue from the list, or create a new one.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
