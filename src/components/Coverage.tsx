import { CATEGORIES, type Category } from "@/lib/topics";

export type CategoryCoverage = { category: Category; cells: boolean[]; done: number; notes: number };

// One entry per category: which of its topics have at least one note.
export function coverageByCategory(noteCountByTopic: Map<string, number>): CategoryCoverage[] {
  return CATEGORIES.map((category) => {
    const counts = category.topics.map((t) => noteCountByTopic.get(t.id) ?? 0);
    return {
      category,
      cells: counts.map((n) => n > 0),
      done: counts.filter((n) => n > 0).length,
      notes: counts.reduce((a, b) => a + b, 0),
    };
  });
}

// A row of squares, one per topic, filled when the topic has a note.
export function CoverageCells({ cells, label }: { cells: boolean[]; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex shrink-0 gap-[3px]">
      {cells.map((on, i) => (
        <span key={i} className={`h-3 w-3 rounded-[3px] ${on ? "bg-accent" : "bg-cell"}`} />
      ))}
    </span>
  );
}
