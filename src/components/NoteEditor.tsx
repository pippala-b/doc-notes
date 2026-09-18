"use client";

import { useState } from "react";
import type { EnhancedNote } from "@/lib/schema";
import TopicSelect from "./TopicSelect";

export type NoteEdits = Pick<EnhancedNote, "title" | "summary" | "enhancedMarkdown" | "highYield" | "pitfalls">;

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export default function NoteEditor({
  note,
  topicId,
  onSave,
  onCancel,
}: {
  note: EnhancedNote;
  topicId: string;
  onSave: (edits: NoteEdits, topicId: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [topic, setTopic] = useState(topicId);
  const [summary, setSummary] = useState(note.summary);
  const [markdown, setMarkdown] = useState(note.enhancedMarkdown);
  const [highYield, setHighYield] = useState(note.highYield.join("\n"));
  const [pitfalls, setPitfalls] = useState(note.pitfalls.join("\n"));
  const [saving, setSaving] = useState(false);

  const field = "mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink";
  return (
    <form
      className="card flex flex-col gap-3 p-4 text-sm text-ink-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(
          {
            title: title.trim() || note.title,
            summary,
            enhancedMarkdown: markdown,
            highYield: lines(highYield),
            pitfalls: lines(pitfalls),
          },
          topic,
        );
        setSaving(false);
      }}
    >
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
      </label>
      <label>
        Filed under
        <TopicSelect value={topic} onChange={setTopic} />
      </label>
      <label>
        Summary
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={field} />
      </label>
      <label>
        Note (markdown)
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={16}
          className={`${field} font-mono text-[0.85rem]`}
        />
      </label>
      <label>
        High yield (one per line)
        <textarea value={highYield} onChange={(e) => setHighYield(e.target.value)} rows={5} className={field} />
      </label>
      <label>
        Pitfalls (one per line)
        <textarea value={pitfalls} onChange={(e) => setPitfalls(e.target.value)} rows={3} className={field} />
      </label>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-line px-4 py-2.5 text-ink">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-50 dark:text-black"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
