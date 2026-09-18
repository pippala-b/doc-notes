"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";
import NoteList from "@/components/NoteList";
import { api } from "@/lib/api";
import type { NoteSummary } from "@/lib/types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ q: string; notes: NoteSummary[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    let cancelled = false;
    // Debounce so each keystroke doesn't hit the database.
    const timer = setTimeout(() => {
      api<{ notes: NoteSummary[] }>(`/api/notes?q=${encodeURIComponent(q)}`)
        .then((r) => {
          if (cancelled) return;
          setResult({ q, notes: r.notes });
          setError(null);
        })
        .catch((e) => !cancelled && setError(e.message));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  const notes = result && result.q === q ? result.notes : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="display">Search</h1>
      <div className="relative">
        <label htmlFor="search-q" className="sr-only">
          Search your notes
        </label>
        <SearchIcon size={18} strokeWidth={2} className="pointer-events-none absolute top-[15px] left-3.5 text-ink-2" />
        <input
          id="search-q"
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="splenectomy vaccines, &quot;charcot triad&quot;"
          className="field pl-10.5"
        />
      </div>

      {error && <p className="card border-shaky p-3 text-sm">Search failed: {error}</p>}

      {q.length < 2 ? (
        <p className="text-sm text-ink-2">Searches titles, summaries, high-yield facts, note text, and your original notes.</p>
      ) : !notes ? (
        !error && <p className="text-sm text-ink-2">Searching…</p>
      ) : notes.length ? (
        <>
          <p className="eyebrow">
            {notes.length} result{notes.length === 1 ? "" : "s"}
          </p>
          <NoteList notes={notes} />
        </>
      ) : (
        <p className="text-sm text-ink-2">No notes match “{q}”. Try a different term, or browse the study tree.</p>
      )}
    </div>
  );
}
