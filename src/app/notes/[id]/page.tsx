"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NoteView from "@/components/NoteView";
import PinnedImage from "@/components/PinnedImage";
import { api } from "@/lib/api";
import { categoryOf, findTopic } from "@/lib/topics";
import type { NoteDetail, Pin } from "@/lib/types";

const CONFIDENCE = [
  { value: 1, label: "Shaky" },
  { value: 2, label: "Okay" },
  { value: 3, label: "Solid" },
] as const;

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    api<{ note: NoteDetail }>(`/api/notes/${id}`)
      .then((r) => setNote(r.note))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="card p-4 text-sm">{error}</p>;
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
    await api(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify({ confidence, reviewed: true }) });
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

      <NoteView note={note.enhanced} />

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
        <div className="flex gap-2">
          {CONFIDENCE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => rate(c.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                note.confidence === c.value ? "border-accent font-semibold text-accent" : "border-line"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <button type="button" onClick={remove} className="self-start text-sm text-ink-2 underline">
        Delete note
      </button>
    </div>
  );
}
