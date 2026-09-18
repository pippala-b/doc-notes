import { nextIntervalDays } from "@/lib/review";
import { CONFIDENCE, type ConfidenceValue } from "./Confidence";

const VALUES: ConfidenceValue[] = [1, 2, 3];

// Rating a note schedules its next review (see src/lib/review.ts), so each
// button says when the note comes back.
export default function RatingBar({
  current,
  intervalDays,
  onRate,
  disabled,
}: {
  current: ConfidenceValue | null;
  intervalDays: number;
  onRate: (confidence: ConfidenceValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {VALUES.map((value) => {
        const days = nextIntervalDays(intervalDays, value);
        const selected = current === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onRate(value)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-[0.95rem] disabled:opacity-50 ${
              selected ? "border-2 border-ink bg-background font-semibold" : `border-[1.5px] font-medium ${CONFIDENCE[value].border}`
            }`}
          >
            {CONFIDENCE[value].label}
            <span className="text-xs font-normal text-ink-2">{days === 1 ? "tomorrow" : `in ${days} days`}</span>
          </button>
        );
      })}
    </div>
  );
}
