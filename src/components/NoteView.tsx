"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { EnhancedNote } from "@/lib/schema";
import BarList from "./BarList";
import { AlertIcon, CloseIcon } from "./icons";
import Mermaid from "./Mermaid";

function Section({
  id,
  title,
  tone = "text-ink-2",
  children,
}: {
  id: string;
  title: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3.5">
      <h2 className={`eyebrow ${tone}`}>{title}</h2>
      {children}
    </section>
  );
}

function Quiz({ items }: { items: EnhancedNote["quiz"] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <ul className="flex flex-col gap-3">
      {items.map((q, i) => (
        <li key={i}>
          <button
            type="button"
            aria-expanded={open.has(i)}
            onClick={() =>
              setOpen((prev) => {
                const next = new Set(prev);
                if (!next.delete(i)) next.add(i);
                return next;
              })
            }
            className="card flex w-full flex-col gap-2.5 p-4 text-left"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-serif text-lg leading-snug font-medium">{q.question}</span>
              {!open.has(i) && <span className="shrink-0 pt-1 text-[0.8rem] font-medium text-ink-2">Reveal</span>}
            </span>
            {open.has(i) && <span className="border-t border-line pt-2.5 text-[0.95rem] leading-normal">{q.answer}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function NoteView({ note }: { note: EnhancedNote }) {
  const hasChart = !!note.chart && note.chart.data.length > 0;
  const sections = [
    { id: "high-yield", label: "High yield", show: note.highYield.length > 0 },
    { id: "note", label: "Note", show: true },
    { id: "algorithm", label: "Algorithm", show: !!note.mermaid.trim() },
    { id: "chart", label: "Chart", show: hasChart },
    { id: "pitfalls", label: "Pitfalls", show: note.pitfalls.length > 0 },
    { id: "mnemonics", label: "Mnemonics", show: note.mnemonics.length > 0 },
    { id: "self-test", label: "Self-test", show: note.quiz.length > 0 },
  ].filter((s) => s.show);

  return (
    <div className="flex flex-col gap-8">
      <p className="font-serif text-xl leading-normal">{note.summary}</p>

      {sections.length > 2 && (
        <nav aria-label="Sections" className="-mx-5 -my-2 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex min-h-11 shrink-0 items-center rounded-full border border-line-strong px-3.5 text-sm font-medium"
            >
              {s.label}
            </a>
          ))}
        </nav>
      )}

      {note.highYield.length > 0 && (
        <section id="high-yield" className="card flex scroll-mt-6 flex-col gap-3.5 p-5">
          <h2 className="eyebrow text-accent">High yield</h2>
          <ol className="flex flex-col gap-3.5">
            {note.highYield.map((h, i) => (
              <li key={i} className="flex gap-3 leading-normal">
                <span className="w-5 shrink-0 font-mono text-[0.8rem] leading-[1.85] text-ink-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Section id="note" title="Note">
        <div className="prose-note">
          <Markdown remarkPlugins={[remarkGfm]}>{note.enhancedMarkdown}</Markdown>
        </div>
      </Section>

      {note.mermaid.trim() && (
        <Section id="algorithm" title="Algorithm">
          <div className="card p-4">
            <Mermaid chart={note.mermaid} />
          </div>
        </Section>
      )}

      {hasChart && note.chart && (
        <Section id="chart" title={note.chart.title}>
          <BarList data={note.chart.data} unit={note.chart.unit} />
        </Section>
      )}

      {note.pitfalls.length > 0 && (
        <Section id="pitfalls" title="Pitfalls" tone="text-shaky">
          <ul className="flex flex-col gap-3.5">
            {note.pitfalls.map((p, i) => (
              <li key={i} className="flex gap-3 leading-normal">
                <CloseIcon size={18} strokeWidth={2.25} className="mt-[3px] shrink-0 text-shaky" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {note.mnemonics.length > 0 && (
        <Section id="mnemonics" title="Mnemonics">
          <ul className="flex flex-col gap-2 font-serif text-lg leading-normal">
            {note.mnemonics.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>
      )}

      {note.quiz.length > 0 && (
        <Section id="self-test" title={`Self-test · ${note.quiz.length} question${note.quiz.length === 1 ? "" : "s"}`}>
          <Quiz items={note.quiz} />
        </Section>
      )}

      {note.uncertain.length > 0 && (
        <section
          className="flex gap-3 rounded-[14px] p-4 text-sm leading-normal"
          style={{ background: "var(--warn-bg)", color: "var(--warn-text)" }}
        >
          <AlertIcon size={20} strokeWidth={2} className="mt-px shrink-0" />
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">Verify against a primary source</h2>
            <ul className={note.uncertain.length > 1 ? "list-disc pl-4" : undefined}>
              {note.uncertain.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
