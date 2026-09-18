"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import NoteEditor, { type NoteEdits } from "@/components/NoteEditor";
import NoteView from "@/components/NoteView";
import PinnedImage from "@/components/PinnedImage";
import RatingBar from "@/components/RatingBar";
import { api } from "@/lib/api";
import { categoryOf, findTopic } from "@/lib/topics";
import type { NoteDetail, Pin } from "@/lib/types";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [nextReview, setNextReview] = useState<number | null>(null);
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

  if (!note && error) return <p className="card p-4 text-sm">{error}</p>;
  if (!note) return <p className="text-sm text-ink-2">Loading…</p>;

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
    setNote((n) => n && { ...n, confidence, reviewedAt: new Date().toISOString() });
    const r = await api<{ nextReviewInDays: number }>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ confidence }),
    });
    setNextReview(r.nextReviewInDays);
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

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm text-ink-2">
          {topic ? `${categoryOf(topic.id)?.name} › ${topic.name}` : "Unfiled"}
        </p>
        <h1 className="text-2xl font-semibold">{note.title}</h1>
        <p className="text-xs text-ink-2">
          {new Date(note.createdAt).toLocaleString()}
          {note.sourceUrl && (
            <>
              {" · "}
              <a href={note.sourceUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                source
              </a>
            </>
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
          {editing ? "Close editor" : "Edit"}
        </button>
        {!note.aiEnhanced && (
          <button
            type="button"
            onClick={enhance}
            disabled={enhancing}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:text-black"
          >
            {enhancing ? "Enhancing… (can take a minute)" : "Enhance with AI"}
          </button>
        )}
      </div>

      {error && <p className="card border-red-400 p-3 text-sm">{error}</p>}

      {editing ? (
        <NoteEditor note={note.enhanced} topicId={note.topicId} onSave={saveEdits} onCancel={() => setEditing(false)} />
      ) : (
        <NoteView note={note.enhanced} />
      )}

      {note.images.length > 0 && (
        <section className="card flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-ink-2 uppercase">Source photos</h2>
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
        <details className="card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Original notes</summary>
          <pre className="mt-2 font-sans whitespace-pre-wrap text-ink-2">{note.sourceText}</pre>
        </details>
      )}

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-ink-2 uppercase">How well do you know this?</h2>
        <RatingBar current={note.confidence} onRate={rate} />
        {nextReview !== null && (
          <p className="mt-2 text-xs text-ink-2">
            Next review in {nextReview} day{nextReview === 1 ? "" : "s"}.
          </p>
        )}
      </section>

      <button type="button" onClick={remove} className="self-start text-sm text-ink-2 underline">
        Delete note
      </button>
    </div>
  );
}
