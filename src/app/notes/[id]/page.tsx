"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfidenceDot, CONFIDENCE, dueLabel } from "@/components/Confidence";
import { ChevronLeftIcon } from "@/components/icons";
import NoteEditor, { type NoteEdits } from "@/components/NoteEditor";
import NoteView from "@/components/NoteView";
import PinnedImage from "@/components/PinnedImage";
import RatingBar from "@/components/RatingBar";
import { api } from "@/lib/api";
import { nextIntervalDays } from "@/lib/review";
import { categoryOf, findTopic } from "@/lib/topics";
import type { NoteDetail, Pin } from "@/lib/types";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [now] = useState(() => Date.now());
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const load = useCallback(
    () =>
      api<{ note: NoteDetail }>(`/api/notes/${id}`)
        .then((r) => setNote(r.note))
        .catch((e) => setError(e.message)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error && !note) return <p className="card mx-auto max-w-2xl p-4 text-sm">{error}</p>;
  if (!note) return <p className="mx-auto max-w-2xl text-sm text-ink-2">Loading…</p>;

  function updatePins(imageId: string, pins: Pin[]) {
    setNote((n) => n && { ...n, images: n.images.map((im) => (im.id === imageId ? { ...im, pins } : im)) });
    // Debounce so typing a pin note doesn't write on every keystroke.
    clearTimeout(saveTimers.current.get(imageId));
    saveTimers.current.set(
      imageId,
      setTimeout(() => {
        api(`/api/images/${imageId}`, { method: "PUT", body: JSON.stringify({ pins }) }).catch((e) =>
          setError(e.message),
        );
      }, 500),
    );
  }

  async function rate(confidence: 1 | 2 | 3) {
    setNote((n) => {
      if (!n) return n;
      const intervalDays = nextIntervalDays(n.intervalDays, confidence);
      return {
        ...n,
        confidence,
        intervalDays,
        reviewedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + intervalDays * 86_400_000).toISOString(),
      };
    });
    await api(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify({ confidence }) }).catch((e) =>
      setError(e.message),
    );
  }

  async function saveEdits(edits: NoteEdits, topicId: string) {
    try {
      await api(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify({ edits, topicId }) });
      await load();
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function enhance() {
    setEnhancing(true);
    setError(null);
    try {
      await api(`/api/notes/${id}/enhance`, { method: "POST" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnhancing(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this note and its photos?")) return;
    await api(`/api/notes/${id}`, { method: "DELETE" });
    router.push("/");
  }

  const topic = findTopic(note.topicId);
  const category = topic && categoryOf(topic.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pb-8 md:pb-28">
      <header className="flex flex-col gap-3">
        <div className="-mt-4 flex items-center justify-between md:-mt-2">
          <Link href="/topics" className="-ml-2 flex min-h-11 items-center gap-0.5 px-1 text-[0.95rem] font-medium">
            <ChevronLeftIcon size={20} strokeWidth={2} />
            {category?.name ?? "Study tree"}
          </Link>
          <button
            type="button"
            aria-pressed={editing}
            onClick={() => setEditing(!editing)}
            className="min-h-11 rounded-full border border-line-strong px-4 text-sm font-medium"
          >
            {editing ? "Close editor" : "Edit"}
          </button>
        </div>
        <p className="eyebrow font-normal tracking-[0.06em]">
          {topic ? `${category?.name} › ${topic.name}` : "Unfiled"}
        </p>
        <h1 className="font-serif text-[2.1rem] leading-[1.12] font-medium tracking-tight">{note.title}</h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[0.8rem] text-ink-2">
          <span>{new Date(note.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
          <span aria-hidden="true">·</span>
          <span>from {note.sourceKind === "mixed" ? "mixed sources" : `a ${note.sourceKind}`}</span>
          {note.sourceUrl && (
            <>
              <span aria-hidden="true">·</span>
              <a href={note.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-accent">
                source
              </a>
            </>
          )}
          {note.confidence && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-track px-2.5 py-1 font-medium text-ink">
              <ConfidenceDot value={note.confidence} showLabel={false} />
              {CONFIDENCE[note.confidence].label} · {dueLabel(note.dueAt, now)}
            </span>
          )}
        </div>
      </header>

      {!note.aiEnhanced && (
        <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="font-semibold">Saved as-is</h2>
            <p className="text-sm text-ink-2">Build the study note to add high-yield points, pitfalls and a self-test.</p>
          </div>
          <button type="button" onClick={enhance} disabled={enhancing} className="btn btn-primary">
            {enhancing ? "Building… (up to a minute)" : "Build study note"}
          </button>
        </section>
      )}

      {error && <p className="card border-shaky p-3 text-sm">{error}</p>}

      {editing ? (
        <NoteEditor note={note.enhanced} topicId={note.topicId} onSave={saveEdits} onCancel={() => setEditing(false)} />
      ) : (
        <NoteView note={note.enhanced} />
      )}

      {note.images.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="eyebrow">Source photos</h2>
          {note.images.map((im) => (
            <PinnedImage
              key={im.id}
              src={`/api/images/${im.id}`}
              pins={im.pins}
              onChange={(pins) => updatePins(im.id, pins)}
            />
          ))}
        </section>
      )}

      {note.sourceText && (
        <details className="group border-y border-line">
          <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between text-[0.95rem] font-medium [&::-webkit-details-marker]:hidden">
            Original capture
            <span className="text-ink-2 group-open:hidden">Show</span>
            <span className="hidden text-ink-2 group-open:inline">Hide</span>
          </summary>
          <pre className="pb-4 font-sans text-sm leading-normal whitespace-pre-wrap text-ink-2">{note.sourceText}</pre>
        </details>
      )}

      <button type="button" onClick={remove} className="min-h-11 self-start text-sm text-ink-2 underline underline-offset-4">
        Delete note
      </button>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:left-58">
        <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
          <div className="text-center text-sm font-medium">How well do you know this?</div>
          <RatingBar current={note.confidence} intervalDays={note.intervalDays} onRate={rate} />
        </div>
      </div>
    </div>
  );
}
