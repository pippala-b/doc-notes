export const CONFIDENCE = {
  1: { label: "Shaky", dot: "bg-shaky", border: "border-shaky" },
  2: { label: "Okay", dot: "bg-okay", border: "border-okay" },
  3: { label: "Solid", dot: "bg-solid", border: "border-solid" },
} as const;

export type ConfidenceValue = keyof typeof CONFIDENCE;

export function ConfidenceDot({ value, showLabel = true }: { value: ConfidenceValue; showLabel?: boolean }) {
  const c = CONFIDENCE[value];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden="true" />
      <span className={showLabel ? undefined : "sr-only"}>{c.label}</span>
    </span>
  );
}

// "due in 3 days" / "due today" / "2 days overdue"
export function dueLabel(dueAt: string, now: number): string {
  const days = Math.round((new Date(dueAt).getTime() - now) / 86_400_000);
  if (days > 1) return `due in ${days} days`;
  if (days === 1) return "due tomorrow";
  if (days === 0) return "due today";
  return days === -1 ? "1 day overdue" : `${-days} days overdue`;
}
