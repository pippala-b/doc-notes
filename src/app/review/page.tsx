"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONFIDENCE, type ConfidenceValue } from "@/components/Confidence";
import { CloseIcon } from "@/components/icons";
import RatingBar from "@/components/RatingBar";
import { api } from "@/lib/api";
import { categoryOf, findTopic } from "@/lib/topics";
import type { NoteDetail, NoteSummary } from "@/lib/types";

// What to ask for a note: one of its self-test questions (rotating by day so
// repeat reviews don't always ask the same one), else recall of its key points.
function promptFor(note: NoteDetail, day: number) {
  const { quiz, highYield, summary } = note.enhanced;
  if (quiz.length) {
    const q = quiz[(note.id + day) % quiz.length];
    return { question: q.question, answer: [q.answer] };
  }
  return {
    question: `What are the key points of “${note.title}”?`,
    answer: highYield.length ? highYield : [summary],
  };
}

export default function Review() {
  const [queue, setQueue] = useState<NoteSummary[] | null>(null);
  const [index, setIndex] = useState(0);
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [tally, setTally] = useState<Record<ConfidenceValue, number>>({ 1: 0, 2: 0, 3: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [day] = useState(() => new Date().getDate());

  useEffect(() => {
    api<{ notes: NoteSummary[] }>("/api/notes?due=1")
      .then((r) => setQueue(r.notes))
      .catch((e) => setError(e.message));
  }, []);

  const current = queue?.[index];
  const currentId = current?.id;

  useEffect(() => {
    if (currentId === undefined) return;
    let cancelled = false;
    api<{ note: NoteDetail }>(`/api/notes/${currentId}`)
      .then((r) => !cancelled && setDetail(r.note))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  async function rate(confidence: ConfidenceValue) {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/notes/${current.id}`, { method: "PATCH", body: JSON.stringify({ confidence }) });
      setTally((t) => ({ ...t, [confidence]: t[confidence] + 1 }));
      setIndex((i) => i + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!queue) {
    return <p className="mx-auto max-w-xl text-sm text-ink-2">{error ? `Could not load the review queue: ${error}` : "Loading…"}</p>;
  }

  if (!current) {
    const reviewed = tally[1] + tally[2] + tally[3];
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 pt-6">
        <header className="flex flex-col gap-2">
          <div className="eyebrow">Review</div>
          <h1 className="display">{reviewed ? "Session done" : "All caught up"}</h1>
          <p className="text-[0.95rem] text-ink-2">
            {reviewed
              ? `You reviewed ${reviewed} note${reviewed === 1 ? "" : "s"}. They come back when they are due.`
              : "Nothing is due right now. Rate notes as you read them and they show up here on schedule."}
          </p>
        </header>
        {reviewed > 0 && (
          <dl className="grid grid-cols-3 gap-4">
            {([1, 2, 3] as const).map((c) => (
              <div key={c} className="border-t border-ink pt-3">
                <dd className="font-serif text-[2rem] leading-tight font-medium tabular-nums">{tally[c]}</dd>
                <dt className="text-[0.8rem] text-ink-2">{CONFIDENCE[c].label.toLowerCase()}</dt>
              </div>
            ))}
          </dl>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="btn btn-primary flex-1">
            Back to Today
          </Link>
          <Link href="/capture" className="btn btn-outline flex-1">
            Capture a note
          </Link>
        </div>
      </div>
    );
  }

  const note = detail?.id === current.id ? detail : null;
  const revealed = revealedId === current.id;
  const topic = findTopic(current.topicId);
  const prompt = note && promptFor(note, day);

  return (
    <div className="mx-auto -mt-2 -mb-24 flex min-h-[calc(100dvh-3.75rem)] max-w-xl flex-col gap-6 md:mb-0 md:min-h-[calc(100dvh-6rem)]">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="End review" className="-ml-2.5 flex h-11 w-11 items-center justify-center">
            <CloseIcon strokeWidth={2} />
          </Link>
          <div className="font-mono text-[0.8rem] text-ink-2">
            {index + 1} of {queue.length}
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Session progress"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={index}
          className="flex gap-1"
        >
          {queue.map((n, i) => (
            <span key={n.id} className={`h-1 flex-1 rounded-sm ${i < index ? "bg-accent" : i === index ? "bg-ink" : "bg-cell"}`} />
          ))}
        </div>
      </header>

      <article className="card flex flex-1 flex-col gap-4 rounded-[20px] px-5.5 py-6">
        <div className="eyebrow font-normal tracking-[0.06em]">
          {topic ? `${categoryOf(topic.id)?.name} › ${topic.name}` : "Unfiled"}
        </div>
        {prompt ? (
          <h1 className="font-serif text-[1.6rem] leading-tight font-medium">{prompt.question}</h1>
        ) : (
          <p className="text-sm text-ink-2">Loading…</p>
        )}

        {prompt && revealed && (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <div className="eyebrow font-normal tracking-[0.06em]">Answer</div>
            {prompt.answer.length === 1 ? (
              <p className="font-serif text-[1.2rem] leading-normal">{prompt.answer[0]}</p>
            ) : (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 font-serif text-[1.15rem] leading-normal">
                {prompt.answer.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            <Link href={`/notes/${current.id}`} className="flex min-h-11 items-center self-start text-sm font-medium text-accent">
              Open the full note
            </Link>
          </div>
        )}

        {prompt && !revealed && (
          <p className="mt-auto text-sm leading-normal text-ink-2">
            Say the answer out loud before you reveal it. Recall beats re-reading.
          </p>
        )}
      </article>

      {error && <p className="card border-shaky p-3 text-sm">{error}</p>}

      {revealed ? (
        <div className="flex flex-col gap-2.5">
          <div className="text-center text-sm font-medium">How well did you know it?</div>
          <RatingBar current={null} intervalDays={current.intervalDays} onRate={rate} disabled={saving} />
        </div>
      ) : (
        <button type="button" disabled={!prompt} onClick={() => setRevealedId(current.id)} className="btn btn-primary min-h-14">
          Show answer
        </button>
      )}
    </div>
  );
}
