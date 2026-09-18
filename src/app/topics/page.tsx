"use client";

import { useEffect, useMemo, useState } from "react";
import NoteList from "@/components/NoteList";
import { api } from "@/lib/api";
import { CATEGORIES, findTopic } from "@/lib/topics";
import type { NoteSummary } from "@/lib/types";

export default function StudyTree() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [filter, setFilter] = useState("");
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Study Tree</h1>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter topics…"
        className="rounded-lg border border-line bg-surface px-3 py-2"
      />

      {(["Clinical Management", "Applied Science"] as const).map((group) => (
        <section key={group} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-ink-2 uppercase">{group}</h2>
          {CATEGORIES.filter((c) => c.group === group).map((c) => {
            const topics = c.topics.filter(
              (t) => !q || t.name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
            );
            if (!topics.length) return null;
            const count = c.topics.reduce((s, t) => s + (byTopic.get(t.id)?.length ?? 0), 0);
            return (
              <details key={c.id} className="card" open={!!q}>
                <summary className="flex cursor-pointer items-center justify-between p-3 font-medium">
                  {c.name}
                  <span className="text-sm font-normal text-ink-2 tabular-nums">
                    {count} note{count === 1 ? "" : "s"}
                  </span>
                </summary>
                <ul className="border-t border-line">
                  {topics.map((t) => {
                    const list = byTopic.get(t.id) ?? [];
                    const open = openTopic === t.id;
                    return (
                      <li key={t.id} className="border-b border-line last:border-b-0">
                        <button
                          type="button"
                          disabled={!list.length}
                          onClick={() => setOpenTopic(open ? null : t.id)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm disabled:text-ink-2"
                        >
                          <span>{t.name}</span>
                          <span className="tabular-nums text-ink-2">{list.length || "—"}</span>
                        </button>
                        {open && (
                          <div className="px-3 pb-3">
                            <NoteList notes={list} showTopic={false} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </section>
      ))}

      {unfiled.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-ink-2 uppercase">Unfiled</h2>
          <NoteList notes={unfiled} showTopic={false} />
        </section>
      )}
    </div>
  );
}
