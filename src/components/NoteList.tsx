import Link from "next/link";
import { findTopic } from "@/lib/topics";
import type { NoteSummary } from "@/lib/types";
import { ConfidenceDot } from "./Confidence";

export default function NoteList({ notes, showTopic = true }: { notes: NoteSummary[]; showTopic?: boolean }) {
  return (
    <ul className="flex flex-col border-b border-line">
      {notes.map((n) => (
        <li key={n.id}>
          <Link href={`/notes/${n.id}`} className="group flex flex-col gap-1.5 border-t border-line py-3.5">
            <span className="font-serif text-[1.2rem] leading-tight font-medium group-hover:text-accent">{n.title}</span>
            <span className="line-clamp-2 text-sm leading-normal text-ink-2">
              {n.snippet
                ? n.snippet.split(/\[\[|\]\]/).map((part, i) =>
                    i % 2 ? <mark key={i} className="rounded bg-track px-0.5 font-medium text-ink">{part}</mark> : part,
                  )
                : n.summary}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-2">
              {showTopic && (
                <>
                  <span>{findTopic(n.topicId)?.categoryName ?? "Unfiled"}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{n.sourceKind}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {new Date(n.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </span>
              {n.confidence && (
                <>
                  <span aria-hidden="true">·</span>
                  <ConfidenceDot value={n.confidence} />
                </>
              )}
              {!n.aiEnhanced && <span className="rounded-full border border-ink-2 px-2 py-px">not enhanced</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
