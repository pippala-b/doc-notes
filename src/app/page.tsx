"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverageCells, coverageByCategory, type CategoryCoverage } from "@/components/Coverage";
import { ArrowRightIcon } from "@/components/icons";
import NoteList from "@/components/NoteList";
import { api } from "@/lib/api";
import { ALL_TOPICS } from "@/lib/topics";
import type { NoteSummary } from "@/lib/types";

const GROUPS = ["Clinical Management", "Applied Science"] as const;

function ReviewHero({ due }: { due: NoteSummary[] }) {
  if (!due.length) {
    return (
      <section aria-label="Due for review" className="card flex flex-col gap-1 p-6">
        <div className="eyebrow">Due for review</div>
        <p className="font-serif text-3xl font-medium">All caught up</p>
        <p className="text-sm text-ink-2">Nothing is due. Rate notes as you read them and they come back here on schedule.</p>
      </section>
    );
  }
  const count = (c: 1 | 2 | 3) => due.filter((n) => n.confidence === c).length;
  const unrated = due.filter((n) => !n.confidence).length;
  const breakdown = [
    [count(1), "shaky"],
    [count(2), "okay"],
    [count(3), "solid"],
    [unrated, "new"],
  ]
    .filter(([n]) => n)
    .map(([n, label]) => `${n} ${label}`);
  const noun = due.length === 1 ? "note" : "notes";
  return (
    <section
      aria-label="Due for review"
      className="flex flex-col gap-5 rounded-[20px] bg-accent p-6 text-on-accent lg:flex-row lg:items-center lg:gap-7 lg:px-7"
    >
      <div className="flex flex-1 items-end justify-between gap-3 lg:items-center lg:justify-start lg:gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="font-mono text-xs tracking-[0.08em] uppercase opacity-85 lg:hidden">Due for review</div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-7xl leading-[0.9] font-medium tabular-nums">{due.length}</span>
            <span className="opacity-90 lg:hidden">{noun}</span>
          </div>
        </div>
        <div className="text-right text-[0.8rem] leading-snug lg:text-left lg:text-sm">
          <div className="hidden text-lg font-semibold lg:block">{noun} due for review</div>
          <div className="opacity-90 lg:hidden">
            {breakdown.map((b) => (
              <div key={b}>{b}</div>
            ))}
          </div>
          <div className="hidden opacity-90 lg:block">{breakdown.join(" · ")}</div>
        </div>
      </div>
      <Link href="/review" className="btn bg-on-accent text-accent lg:px-6">
        Start review
        <ArrowRightIcon size={18} strokeWidth={2} />
      </Link>
    </section>
  );
}

function CoverageRow({ c, compact = false }: { c: CategoryCoverage; compact?: boolean }) {
  const label = `${c.done} of ${c.cells.length} topics covered`;
  return (
    <Link
      href="/topics"
      className={`flex items-center gap-3 ${compact ? "min-h-6 text-[0.8rem]" : "min-h-12 border-t border-line text-[0.95rem]"}`}
    >
      <span className="min-w-0 flex-1 truncate">{c.category.name}</span>
      <span className={compact ? "w-31" : undefined}>
        <CoverageCells cells={c.cells} label={label} />
      </span>
      {!compact && (
        <span className="w-12 text-right font-mono text-xs text-ink-2">
          {c.done} of {c.cells.length}
        </span>
      )}
    </Link>
  );
}

export default function Today() {
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    api<{ notes: NoteSummary[] }>("/api/notes")
      .then((r) => setNotes(r.notes))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="card p-4 text-sm">Could not load notes: {error}</p>;
  if (!notes) return <p className="text-sm text-ink-2">Loading…</p>;

  const countByTopic = new Map<string, number>();
  for (const n of notes) countByTopic.set(n.topicId, (countByTopic.get(n.topicId) ?? 0) + 1);
  const coverage = coverageByCategory(countByTopic);
  const covered = coverage.reduce((s, c) => s + c.done, 0);
  const due = notes.filter((n) => new Date(n.dueAt).getTime() <= now);
  // Least-covered first; among ties, the bigger category is the bigger gap.
  const thinnest = [...coverage]
    .sort((a, b) => a.done / a.cells.length - b.done / b.cells.length || b.cells.length - a.cells.length)
    .slice(0, 5);

  return (
    <div className="flex gap-12">
      <div className="flex min-w-0 flex-1 flex-col gap-7 lg:gap-8">
        <header className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <div className="eyebrow font-normal">
              {new Date(now).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <h1 className="display lg:text-5xl">Today</h1>
          </div>
          <div className="pb-1 font-mono text-xs text-ink-2 md:hidden">Doc Notes · ABSITE</div>
        </header>

        <ReviewHero due={due} />

        <section aria-label="Totals" className="grid grid-cols-2 gap-4 lg:hidden">
          <div className="border-t border-ink pt-3">
            <div className="font-serif text-[2rem] leading-tight font-medium tabular-nums">{notes.length}</div>
            <div className="text-[0.8rem] text-ink-2">notes captured</div>
          </div>
          <div className="border-t border-ink pt-3">
            <div className="font-serif text-[2rem] leading-tight font-medium tabular-nums">
              {covered}
              <span className="text-lg text-ink-2"> / {ALL_TOPICS.length}</span>
            </div>
            <div className="text-[0.8rem] text-ink-2">topics with a note</div>
          </div>
        </section>

        <section className="lg:hidden">
          <div className="flex items-baseline justify-between">
            <h2 className="heading">Thinnest coverage</h2>
            <Link href="/topics" className="flex min-h-11 items-center text-sm font-medium text-accent">
              Study tree
            </Link>
          </div>
          <div className="border-b border-line">
            {thinnest.map((c) => (
              <CoverageRow key={c.category.id} c={c} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="heading mb-3">Recent notes</h2>
          {notes.length ? (
            <NoteList notes={notes.slice(0, 8)} />
          ) : (
            <p className="card p-5 text-sm text-ink-2">
              No notes yet. Capture a photo, a link, or typed notes to start your study tree.
            </p>
          )}
        </section>
      </div>

      <aside aria-label="Coverage map" className="hidden w-96 shrink-0 flex-col gap-3.5 pt-5 lg:flex">
        <div>
          <h2 className="heading">Coverage map</h2>
          <p className="text-sm text-ink-2">
            {covered} of {ALL_TOPICS.length} topics have a note. Each square is a topic.
          </p>
        </div>
        {GROUPS.map((group) => (
          <div key={group}>
            <h3 className="eyebrow border-b border-line py-1.5 text-[0.7rem]">{group}</h3>
            {coverage
              .filter((c) => c.category.group === group)
              .map((c) => (
                <CoverageRow key={c.category.id} c={c} compact />
              ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
