"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConfidenceDot } from "@/components/Confidence";
import { CoverageCells } from "@/components/Coverage";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "@/components/icons";
import NoteList from "@/components/NoteList";
import { api } from "@/lib/api";
import { ALL_TOPICS, CATEGORIES, findTopic } from "@/lib/topics";
import type { NoteSummary } from "@/lib/types";

const GROUPS = ["Clinical Management", "Applied Science"] as const;

// A topic is only as strong as its weakest rated note.
function weakest(notes: NoteSummary[]) {
  const rated = notes.map((n) => n.confidence).filter((c) => c !== null);
  return rated.length ? (Math.min(...rated) as 1 | 2 | 3) : null;
}

export default function StudyTree() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [filter, setFilter] = useState("");
  const [gapsOnly, setGapsOnly] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  useEffect(() => {
    api<{ notes: NoteSummary[] }>("/api/notes").then((r) => setNotes(r.notes)).catch(() => {});
  }, []);

  const byTopic = useMemo(() => {
    const map = new Map<string, NoteSummary[]>();
    for (const n of notes) map.set(n.topicId, [...(map.get(n.topicId) ?? []), n]);
    return map;
  }, [notes]);

  const q = filter.trim().toLowerCase();
  const unfiled = notes.filter((n) => !findTopic(n.topicId));
  const covered = ALL_TOPICS.filter((t) => byTopic.has(t.id)).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="display">Study tree</h1>
        <p className="text-[0.95rem] text-ink-2">
          {covered} of {ALL_TOPICS.length} topics have a note. Each square is a topic.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="tree-filter" className="sr-only">
            Filter topics
          </label>
          <SearchIcon size={18} strokeWidth={2} className="pointer-events-none absolute top-[15px] left-3.5 text-ink-2" />
          <input
            id="tree-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter topics"
            className="field pl-10.5"
          />
        </div>
        <div role="group" aria-label="Show" className="grid grid-cols-2 gap-1 rounded-xl bg-track p-1">
          {[
            { label: "All topics", value: false },
            { label: "Gaps only", value: true },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={gapsOnly === o.value}
              onClick={() => setGapsOnly(o.value)}
              className={`min-h-10 rounded-[9px] text-sm ${gapsOnly === o.value ? "bg-surface font-semibold" : "font-medium"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {GROUPS.map((group) => (
        <section key={group} className="flex flex-col">
          <h2 className="eyebrow pt-2 pb-2.5">{group}</h2>
          {CATEGORIES.filter((c) => c.group === group).map((c) => {
            const topics = c.topics.filter(
              (t) =>
                (!q || t.name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) &&
                (!gapsOnly || !byTopic.has(t.id)),
            );
            if (!topics.length) return null;
            const count = c.topics.reduce((s, t) => s + (byTopic.get(t.id)?.length ?? 0), 0);
            const done = c.topics.filter((t) => byTopic.has(t.id)).length;
            // Filtering is a search: show every match without another tap.
            const open = !!q || gapsOnly || openCategory === c.id;
            return (
              <div key={c.id} className={`border-t ${open ? "border-ink" : "border-line"}`}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenCategory(open ? null : c.id)}
                  className="flex min-h-14 w-full items-center gap-3 text-left"
                >
                  <span className={`min-w-0 flex-1 truncate ${open ? "font-serif text-[1.35rem] font-medium" : "font-medium"}`}>
                    {c.name}
                  </span>
                  {open ? (
                    <span className="shrink-0 font-mono text-xs text-ink-2">
                      {done} of {c.topics.length} · {count} note{count === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <>
                      <CoverageCells
                        cells={c.topics.map((t) => byTopic.has(t.id))}
                        label={`${done} of ${c.topics.length} topics covered`}
                      />
                      <span className="w-6 shrink-0 text-right font-mono text-xs text-ink-2">{count}</span>
                    </>
                  )}
                  <ChevronDownIcon size={18} strokeWidth={2} className={`shrink-0 text-ink-2 ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <ul className="mb-2 ml-0.5 border-l border-line-strong pb-1 pl-3.5">
                    {topics.map((t, i) => {
                      const list = byTopic.get(t.id) ?? [];
                      const topicOpen = openTopic === t.id;
                      const level = weakest(list);
                      return (
                        <li key={t.id} className={i ? "border-t border-line" : undefined}>
                          {list.length ? (
                            <button
                              type="button"
                              aria-expanded={topicOpen}
                              onClick={() => setOpenTopic(topicOpen ? null : t.id)}
                              className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-[0.95rem]"
                            >
                              <span>{t.name}</span>
                              <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-ink-2">
                                {level && <ConfidenceDot value={level} showLabel={false} />}
                                {list.length}
                              </span>
                            </button>
                          ) : (
                            <div className="flex min-h-12 items-center justify-between gap-3 text-[0.95rem] text-ink-2">
                              <span>{t.name}</span>
                              <Link
                                href="/capture"
                                aria-label={`Capture a note for ${t.name}`}
                                className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-ink"
                              >
                                <PlusIcon size={14} strokeWidth={2.5} />
                                Capture
                              </Link>
                            </div>
                          )}
                          {topicOpen && (
                            <div className="pb-3">
                              <NoteList notes={list} showTopic={false} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {unfiled.length > 0 && !gapsOnly && (
        <section>
          <h2 className="eyebrow pt-2 pb-2.5">Unfiled</h2>
          <NoteList notes={unfiled} showTopic={false} />
        </section>
      )}
    </div>
  );
}
