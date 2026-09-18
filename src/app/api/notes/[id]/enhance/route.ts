import { query } from "@/lib/db";
import { EnhanceError, enhanceCapture } from "@/lib/enhance";
import type { EnhancedNote, EnhanceRequest } from "@/lib/schema";
import { findTopic } from "@/lib/topics";

export const maxDuration = 300;

// "Enhance later": run the AI pass over a note that was saved as-is, using its
// stored text, link, and photos.
export async function POST(_request: Request, ctx: RouteContext<"/api/notes/[id]/enhance">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Bad id" }, { status: 400 });

  const [note] = await query<{
    topic_id: string;
    source_url: string | null;
    source_text: string | null;
    ai_enhanced: boolean;
    enhanced: EnhancedNote;
  }>(`SELECT topic_id, source_url, source_text, ai_enhanced, enhanced FROM notes WHERE id = $1`, [id]);
  if (!note) return Response.json({ error: "Not found" }, { status: 404 });

  const images = await query<{ media_type: string; data: Buffer }>(
    `SELECT media_type, data FROM note_images WHERE note_id = $1 ORDER BY position`,
    [id],
  );

  // A hand-written note's body may have been edited since capture; that is the source of truth.
  const text = note.ai_enhanced ? note.source_text : note.enhanced.enhancedMarkdown;
  try {
    const enhanced = await enhanceCapture({
      text: text ?? undefined,
      url: note.source_url ?? undefined,
      images: images.map((im) => ({
        mediaType: im.media_type as NonNullable<EnhanceRequest["images"]>[number]["mediaType"],
        data: im.data.toString("base64"),
      })),
    });
    // Keep the resident's own filing unless the note was unfiled.
    const topicId = findTopic(note.topic_id) ? note.topic_id : enhanced.topicId;
    await query(
      `UPDATE notes SET enhanced = $2, topic_id = $3, ai_enhanced = true,
                        source_text = COALESCE(source_text, $4), updated_at = now()
        WHERE id = $1`,
      [id, JSON.stringify({ ...enhanced, topicId }), topicId, text],
    );
    return Response.json({ ok: true });
  } catch (err) {
    const e = err as EnhanceError;
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
