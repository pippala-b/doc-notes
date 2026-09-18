"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { EnhancedNote } from "@/lib/schema";
import BarList from "./BarList";
import Mermaid from "./Mermaid";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-ink-2 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Quiz({ items }: { items: EnhancedNote["quiz"] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <ul className="flex flex-col gap-2">
      {items.map((q, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() =>
              setOpen((prev) => {
                const next = new Set(prev);
                if (!next.delete(i)) next.add(i);
                return next;
              })
            }
            className="w-full rounded-lg border border-line p-3 text-left text-sm"
          >
            <span className="font-medium">{q.question}</span>
            <span className="mt-1 block text-ink-2">{open.has(i) ? q.answer : "Tap to reveal"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function NoteView({ note }: { note: EnhancedNote }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-2">{note.summary}</p>

      {note.highYield.length > 0 && (
        <Section title="High yield">
          <ul className="list-disc pl-5 text-sm leading-relaxed">
            {note.highYield.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Note">
        <div className="prose-note text-[0.95rem]">
          <Markdown remarkPlugins={[remarkGfm]}>{note.enhancedMarkdown}</Markdown>
        </div>
      </Section>

      {note.mermaid.trim() && (
        <Section title="Algorithm">
          <Mermaid chart={note.mermaid} />
        </Section>
      )}

      {note.chart && note.chart.data.length > 0 && (
        <Section title={note.chart.title}>
          <BarList data={note.chart.data} unit={note.chart.unit} />
        </Section>
      )}

      {note.pitfalls.length > 0 && (
        <Section title="Pitfalls">
          <ul className="list-disc pl-5 text-sm leading-relaxed">
            {note.pitfalls.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Section>
      )}

      {note.mnemonics.length > 0 && (
        <Section title="Mnemonics">
          <ul className="list-disc pl-5 text-sm leading-relaxed">
            {note.mnemonics.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>
      )}

      {note.quiz.length > 0 && (
        <Section title="Self-test">
          <Quiz items={note.quiz} />
        </Section>
      )}

      {note.uncertain.length > 0 && (
        <section className="rounded-xl p-4 text-sm" style={{ background: "var(--warn-bg)", color: "var(--warn-text)" }}>
          <h2 className="mb-1 font-semibold">⚠ Verify against a primary source</h2>
          <ul className="list-disc pl-5">
            {note.uncertain.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
