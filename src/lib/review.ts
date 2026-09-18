// Spaced review, SM-2-lite: the gap to the next review grows with each good
// rating and collapses to a day when the note feels shaky.
export function nextIntervalDays(current: number, confidence: 1 | 2 | 3): number {
  if (confidence === 1) return 1;
  if (confidence === 2) return Math.max(2, Math.round(current * 1.5));
  return Math.max(4, Math.round(current * 2.5));
}
