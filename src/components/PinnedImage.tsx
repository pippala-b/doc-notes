"use client";

import { useState } from "react";
import type { Pin } from "@/lib/types";

// Interactive image note: tap anywhere on the photo to drop a numbered pin and
// attach a note to that spot. Pin positions are stored as 0..1 fractions so they
// survive any display size.
export default function PinnedImage({
  src,
  pins,
  onChange,
}: {
  src: string;
  pins: Pin[];
  onChange?: (pins: Pin[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const editable = !!onChange;
  const current = pins.find((p) => p.id === selected);

  function addPin(e: React.MouseEvent<HTMLDivElement>) {
    if (!editable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pin: Pin = {
      id: crypto.randomUUID(),
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      text: "",
    };
    onChange([...pins, pin]);
    setSelected(pin.id);
  }

  return (
    <div>
      <div className="relative cursor-crosshair overflow-hidden rounded-lg border border-line" onClick={addPin}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Captured source" className="block w-full select-none" draggable={false} />
        {pins.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Pin ${i + 1}: ${p.text || "empty"}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(p.id === selected ? null : p.id);
            }}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow ${
              p.id === selected ? "bg-accent ring-2 ring-accent/40" : "bg-black/70"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {current ? (
        <div className="mt-2 flex items-start gap-2">
          <textarea
            autoFocus
            readOnly={!editable}
            value={current.text}
            placeholder="Note for this spot…"
            onChange={(e) =>
              onChange?.(pins.map((p) => (p.id === current.id ? { ...p, text: e.target.value } : p)))
            }
            className="min-h-16 flex-1 rounded-lg border border-line bg-surface p-2 text-sm"
          />
          {editable && (
            <button
              type="button"
              onClick={() => {
                onChange(pins.filter((p) => p.id !== current.id));
                setSelected(null);
              }}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        editable && <p className="mt-1 text-xs text-ink-2">Tap the image to pin a note to a spot.</p>
      )}

      {pins.some((p) => p.text) && (
        <ol className="mt-2 list-decimal pl-5 text-sm text-ink-2">
          {pins.map((p) => (
            <li key={p.id}>{p.text || "—"}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
