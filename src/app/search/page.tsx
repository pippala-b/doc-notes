"use client";

import { useEffect, useState } from "react";
import NoteList from "@/components/NoteList";
import { api } from "@/lib/api";
import type { NoteSummary } from "@/lib/types";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NoteSummary[] | null>(null);

  // Search as you type, debounced; ignore responses that arrive out of order.
  useEffect(() => {
    const term = q.trim();
    let stale = false;
    const timer = setTimeout(() => {
      if (term.length < 2) return setResults(null);
      api<{ notes: NoteSummary[] }>(`/api/notes?q=${encodeURIComponent(term)}`)
        .then((r) => !stale && setResults(r.notes))
        .catch(() => !stale && setResults([]));
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Search</h1>
      <input
        autoFocus
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Search your notes — e.g. splenectomy vaccines, "charcot triad"'
        className="rounded-lg border border-line bg-surface px-3 py-2.5"
      />
      {results === null ? (
        <p className="text-sm text-ink-2">Searches titles, summaries, high-yield facts, note text, and your original notes.</p>
      ) : results.length ? (
        <NoteList notes={results} />
      ) : (
        <p className="text-sm text-ink-2">No notes match “{q.trim()}”.</p>
      )}
    </div>
  );
}
