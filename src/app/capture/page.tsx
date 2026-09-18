"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import NoteView from "@/components/NoteView";
import { api } from "@/lib/api";
import { prepareImage } from "@/lib/image";
import type { EnhancedNote } from "@/lib/schema";
import { CATEGORIES, UNFILED_TOPIC_ID, findTopic } from "@/lib/topics";

type Prepared = Awaited<ReturnType<typeof prepareImage>>;

export default function Capture() {
  const router = useRouter();
  const [images, setImages] = useState<Prepared[]>([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"enhance" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EnhancedNote | null>(null);
  const [topicId, setTopicId] = useState(UNFILED_TOPIC_ID);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const prepared = await Promise.all([...files].slice(0, 6 - images.length).map((f) => prepareImage(f)));
    setImages((prev) => [...prev, ...prepared]);
  }

  async function enhance() {
    setBusy("enhance");
    setError(null);
    try {
      const { note } = await api<{ note: EnhancedNote }>("/api/enhance", {
        method: "POST",
        body: JSON.stringify({
          text: text || undefined,
          url: url || undefined,
          images: images.map(({ mediaType, data }) => ({ mediaType, data })),
        }),
      });
      setDraft(note);
      setTopicId(findTopic(note.topicId) ? note.topicId : UNFILED_TOPIC_ID);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!draft) return;
    setBusy("save");
    setError(null);
    try {
      const { id } = await api<{ id: number }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          sourceText: text || undefined,
          sourceUrl: url || undefined,
          topicId,
          enhanced: { ...draft, topicId },
          images: images.map(({ mediaType, data }) => ({ mediaType, data })),
        }),
      });
      router.push(`/notes/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  const hasInput = images.length > 0 || url.trim() || text.trim();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Capture</h1>

      {!draft && (
        <>
          <section className="card flex flex-col gap-3 p-4">
            <label className="text-sm font-medium">Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => addFiles(e.target.files)}
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-track file:px-3 file:py-2"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    title="Remove"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt="" className="h-20 w-20 rounded-lg border border-line object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-black/70 px-1.5 text-xs text-white">×</span>
                  </button>
                ))}
              </div>
            )}

            <label className="mt-2 text-sm font-medium">Link</label>
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-lg border border-line bg-transparent px-3 py-2"
            />

            <label className="mt-2 text-sm font-medium">Notes</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pearls from conference, the OR, rounds…"
              rows={6}
              className="rounded-lg border border-line bg-transparent px-3 py-2"
            />
            <p className="text-xs text-ink-2">
              Study content only — leave out patient names, MRNs, and dates. Captures are sent to the Claude API for enhancement.
            </p>
          </section>

          <button
            type="button"
            disabled={!hasInput || busy !== null}
            onClick={enhance}
            className="rounded-lg bg-accent px-4 py-3 font-medium text-white disabled:opacity-50 dark:text-black"
          >
            {busy === "enhance" ? "Building study note… (can take a minute)" : "Enhance with AI"}
          </button>
        </>
      )}

      {error && <p className="card border-red-400 p-3 text-sm">{error}</p>}

      {draft && (
        <>
          <section className="card flex flex-col gap-2 p-4">
            <h2 className="text-xl font-semibold">{draft.title}</h2>
            <label className="text-sm text-ink-2">
              Filed under
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
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
            </label>
          </section>

          <NoteView note={draft} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={busy !== null}
              className="flex-1 rounded-lg border border-line px-4 py-3"
            >
              Back to edit
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy !== null}
              className="flex-1 rounded-lg bg-accent px-4 py-3 font-medium text-white disabled:opacity-50 dark:text-black"
            >
              {busy === "save" ? "Saving…" : "Save note"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
