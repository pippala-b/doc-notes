"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CameraIcon, CloseIcon, LockIcon } from "@/components/icons";
import NoteView from "@/components/NoteView";
import { api } from "@/lib/api";
import { prepareImage } from "@/lib/image";
import TopicSelect from "@/components/TopicSelect";
import { manualNote, type EnhancedNote } from "@/lib/schema";
import { UNFILED_TOPIC_ID, findTopic } from "@/lib/topics";

type Prepared = Awaited<ReturnType<typeof prepareImage>>;

export default function Capture() {
  const router = useRouter();
  const [images, setImages] = useState<Prepared[]>([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
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
      // A topic picked before enhancing wins over the model's choice.
      setTopicId((picked) => (findTopic(picked) ? picked : findTopic(note.topicId) ? note.topicId : UNFILED_TOPIC_ID));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // With a draft: save the AI note. Without: save the capture as-is (can be enhanced later).
  async function save() {
    const enhanced = draft
      ? { ...draft, topicId }
      : manualNote(title.trim() || text.trim().split("\n")[0].slice(0, 70) || "Untitled note", text, topicId);
    setBusy("save");
    setError(null);
    try {
      const { id } = await api<{ id: number }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          sourceText: text || undefined,
          sourceUrl: url || undefined,
          topicId,
          enhanced,
          aiEnhanced: !!draft,
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="display">Capture</h1>
        {!draft && <p className="text-[0.95rem] text-ink-2">A photo, a link, or a few typed lines. Any one is enough.</p>}
      </header>

      {!draft && (
        <>
          <section className="flex flex-col gap-3">
            <label className="flex min-h-33 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-ink-2 bg-surface px-4 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
              <CameraIcon size={28} />
              <span className="font-semibold">Take a photo or choose from library</span>
              <span className="text-[0.8rem] text-ink-2">Slides, whiteboards, textbook pages · up to 6</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={images.length >= 6}
                onChange={(e) => addFiles(e.target.files)}
                className="sr-only"
              />
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt={`Photo ${i + 1}`} className="h-18 w-18 rounded-[10px] object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-ink text-background"
                    >
                      <CloseIcon size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cap-url" className="text-sm font-semibold">
              Link
            </label>
            <input
              id="cap-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste an article or guideline URL"
              className="field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cap-text" className="text-sm font-semibold">
              Notes
            </label>
            <textarea
              id="cap-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pearls from conference, the OR, rounds…"
              rows={5}
              className="field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cap-title" className="text-sm font-semibold">
              Title <span className="font-normal text-ink-2">(optional)</span>
            </label>
            <input
              id="cap-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Used when you save as-is"
              className="field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cap-topic" className="text-sm font-semibold">
              File under
            </label>
            <TopicSelect id="cap-topic" value={topicId} onChange={setTopicId} />
            <p className="text-[0.8rem] text-ink-2">Leave it unfiled and the study note picks a topic for you.</p>
          </div>

          <p className="flex items-start gap-2.5 text-[0.8rem] leading-normal text-ink-2">
            <LockIcon size={18} className="mt-px shrink-0" />
            Study content only. Leave out patient names, MRNs and dates. Captures go to the Claude API to build the note.
          </p>

          {error && <p className="card border-shaky p-3 text-sm">{error}</p>}

          <div className="flex flex-col gap-1">
            <button type="button" disabled={!hasInput || busy !== null} onClick={enhance} className="btn btn-primary min-h-14">
              {busy === "enhance" ? "Building study note… (up to a minute)" : "Build study note"}
            </button>
            <p className="pt-1.5 text-center text-[0.8rem] text-ink-2">You check the draft before it saves.</p>
            <button
              type="button"
              disabled={!hasInput || busy !== null}
              onClick={save}
              className="min-h-12 text-[0.95rem] font-medium underline underline-offset-4 disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : "Save as-is, enhance later"}
            </button>
          </div>
        </>
      )}

      {draft && (
        <>
          <section className="flex flex-col gap-3">
            <p className="eyebrow">Draft · not saved yet</p>
            <h2 className="font-serif text-[2.1rem] leading-[1.12] font-medium tracking-tight">{draft.title}</h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="draft-topic" className="text-sm font-semibold">
                File under
              </label>
              <TopicSelect id="draft-topic" value={topicId} onChange={setTopicId} />
            </div>
          </section>

          <NoteView note={draft} />

          {error && <p className="card border-shaky p-3 text-sm">{error}</p>}

          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] -mx-5 flex gap-3 border-t border-line bg-background px-5 py-3 md:bottom-0">
            <button type="button" onClick={() => setDraft(null)} disabled={busy !== null} className="btn btn-outline flex-1">
              Back to edit
            </button>
            <button type="button" onClick={save} disabled={busy !== null} className="btn btn-primary flex-1">
              {busy === "save" ? "Saving…" : "Save note"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
