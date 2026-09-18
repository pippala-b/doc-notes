import { CATEGORIES, UNFILED_TOPIC_ID } from "@/lib/topics";

export default function TopicSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
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
