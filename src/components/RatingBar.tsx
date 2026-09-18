const CONFIDENCE = [
  { value: 1, label: "Shaky", hint: "again tomorrow" },
  { value: 2, label: "Okay", hint: "in a few days" },
  { value: 3, label: "Solid", hint: "much later" },
] as const;

// Rating a note schedules its next review (see src/lib/review.ts).
export default function RatingBar({
  current,
  onRate,
}: {
  current: 1 | 2 | 3 | null;
  onRate: (confidence: 1 | 2 | 3) => void;
}) {
  return (
    <div className="flex gap-2">
      {CONFIDENCE.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onRate(c.value)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
            current === c.value ? "border-accent font-semibold text-accent" : "border-line"
          }`}
        >
          {c.label}
          <span className="block text-xs font-normal text-ink-2">{c.hint}</span>
        </button>
      ))}
    </div>
  );
}
