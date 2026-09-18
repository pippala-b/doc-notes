import { CATEGORIES, UNFILED_TOPIC_ID } from "@/lib/topics";

export default function TopicSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
    >
      <option value={UNFILED_TOPIC_ID}>Unfiled</option>
      {CATEGORIES.map((c) => (
        <optgroup key={c.id} label={c.name}>
          {c.topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
