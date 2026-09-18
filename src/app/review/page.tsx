"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NoteView from "@/components/NoteView";
import RatingBar from "@/components/RatingBar";
import { api } from "@/lib/api";
import { findTopic } from "@/lib/topics";
import type { NoteDetail, NoteSummary } from "@/lib/types";

// Review session: work through every note that is due, oldest first. Each card
// starts as recall prompts (self-test questions); reveal the note, then rate it
// to schedule the next review.
export default function Review() {
  const [queue, setQueue] = useState<NoteSummary[] | null>(null);
  const [done, setDone] = useState(0);
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    api<{ notes: NoteSummary[] }>("/api/notes?due=1").then((r) => setQueue(r.notes)).catch(() => setQueue([]));
  }, []);

  const currentId = queue?.[0]?.id;
  useEffect(() => {
    if (!currentId) return;
    let stale = false;
    api<{ note: NoteDetail }>(`/api/notes/${currentId}`).then((r) => {
      if (stale) return;
      setNote(r.note);
      setRevealed(r.note.enhanced.quiz.length === 0); // nothing to recall against: show the note
    });
    return () => {
      stale = true;
    };
  }, [currentId]);

  async function rate(confidence: 1 | 2 | 3) {
    if (!currentId) return;
    await api(`/api/notes/${currentId}`, { method: "PATCH", body: JSON.stringify({ confidence }) });
    setNote(null);
    setDone((d) => d + 1);
    setQueue((q) => q && q.slice(1));
  }

  if (!queue) return <p className="text-sm text-ink-2">Loading…</p>;

  if (!queue.length) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Review</h1>
        <p className="card p-4 text-sm text-ink-2">
          {done
            ? `Session complete — ${done} note${done === 1 ? "" : "s"} reviewed. Nothing else is due.`
            : "Nothing is due. New notes are due right away; rated notes come back on a widening schedule."}
        </p>
        <Link href="/" className="text-sm text-accent underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const total = done + queue.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Review</h1>
        <span className="text-sm text-ink-2 tabular-nums">
          {done + 1} of {total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-track">
        <div className="h-full rounded-full bg-series" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {!note ? (
        <p className="text-sm text-ink-2">Loading…</p>
      ) : (
        <>
          <header>
            <p className="text-sm text-ink-2">{findTopic(note.topicId)?.name ?? "Unfiled"}</p>
            <h2 className="text-xl font-semibold">{note.title}</h2>
          </header>

          {!revealed ? (
            <section className="card flex flex-col gap-3 p-4">
              <p className="text-sm text-ink-2">Answer from memory, then reveal the note.</p>
              <ol className="list-decimal pl-5 text-[0.95rem] leading-relaxed">
                {note.enhanced.quiz.map((q, i) => (
                  <li key={i}>{q.question}</li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="rounded-lg bg-accent px-4 py-3 font-medium text-white dark:text-black"
              >
                Reveal note
              </button>
            </section>
          ) : (
            <>
              <NoteView note={note.enhanced} />
              <section className="card sticky bottom-20 p-4 sm:bottom-4">
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-ink-2 uppercase">How well did you know it?</h2>
                <RatingBar current={null} onRate={rate} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
