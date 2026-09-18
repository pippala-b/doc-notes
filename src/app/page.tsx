"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BarList from "@/components/BarList";
import NoteList from "@/components/NoteList";
import { api } from "@/lib/api";
import { ALL_TOPICS, CATEGORIES, findTopic } from "@/lib/topics";
import type { NoteSummary } from "@/lib/types";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs tracking-wide text-ink-2 uppercase">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ notes: NoteSummary[] }>("/api/notes"),
      api<{ notes: NoteSummary[] }>("/api/notes?due=1"), // "due" is decided by the database clock
    ])
      .then(([all, due]) => {
        setNotes(all.notes);
        setDueCount(due.notes.length);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="card p-4 text-sm">Could not load notes: {error}</p>;
  if (!notes) return <p className="text-sm text-ink-2">Loading…</p>;

  const covered = new Set(notes.map((n) => n.topicId).filter((id) => findTopic(id)));
  const coverage = CATEGORIES.map((c) => {
    const done = c.topics.filter((t) => covered.has(t.id)).length;
    return {
      label: c.name,
      value: Math.round((done / c.topics.length) * 100),
      detail: `${done} of ${c.topics.length} topics have at least one note`,
    };
  }).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ABSITE Dashboard</h1>
        <Link href="/capture" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white dark:text-black">
          + Capture
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Notes" value={String(notes.length)} />
        <Stat label="Topics covered" value={`${covered.size}`} sub={`of ${ALL_TOPICS.length}`} />
        <Link href="/review">
          <Stat label="Due for review" value={String(dueCount)} sub="tap to start" />
        </Link>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Topic coverage by category</h2>
        <BarList data={coverage} unit="%" max={100} />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Recent notes</h2>
        {notes.length ? (
          <NoteList notes={notes.slice(0, 8)} />
        ) : (
          <p className="card p-4 text-sm text-ink-2">
            No notes yet. Capture a photo, a link, or typed notes to build your study tree.
          </p>
        )}
      </section>
    </div>
  );
}
