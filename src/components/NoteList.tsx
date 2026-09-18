import Link from "next/link";
import { findTopic } from "@/lib/topics";
import type { NoteSummary } from "@/lib/types";

const CONFIDENCE = { 1: "Shaky", 2: "Okay", 3: "Solid" } as const;

export default function NoteList({ notes, showTopic = true }: { notes: NoteSummary[]; showTopic?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((n) => (
        <li key={n.id}>
          <Link href={`/notes/${n.id}`} className="card block p-3 hover:border-accent">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{n.title}</span>
              <span className="shrink-0 text-xs text-ink-2">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </span>
            <span className="mt-0.5 line-clamp-2 text-sm text-ink-2">{n.summary}</span>
            <span className="mt-1 flex gap-2 text-xs text-ink-2">
              {showTopic && <span>{findTopic(n.topicId)?.name ?? "Unfiled"}</span>}
              <span>· {n.sourceKind}</span>
              {n.confidence && <span>· {CONFIDENCE[n.confidence]}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
