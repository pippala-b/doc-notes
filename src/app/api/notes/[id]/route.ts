import { query } from "@/lib/db";
import { SUMMARY_COLUMNS } from "@/lib/noteSql";
import { nextIntervalDays } from "@/lib/review";
import { UpdateNoteSchema, type NoteDetail, type NoteImageMeta } from "@/lib/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Bad id" }, { status: 400 });

  const [note] = await query<Omit<NoteDetail, "images">>(
    `SELECT ${SUMMARY_COLUMNS}, source_text AS "sourceText",
            source_url AS "sourceUrl", enhanced AS "enhanced"
       FROM notes WHERE id = $1`,
    [id],
  );
  if (!note) return Response.json({ error: "Not found" }, { status: 404 });

  const images = await query<NoteImageMeta>(
    `SELECT id, media_type AS "mediaType", pins FROM note_images
      WHERE note_id = $1 ORDER BY position`,
    [id],
  );
  return Response.json({ note: { ...note, images } });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const id = Number((await ctx.params).id);
  const parsed = UpdateNoteSchema.safeParse(await request.json());
  if (!Number.isInteger(id) || !parsed.success) {
    return Response.json({ error: "Invalid update" }, { status: 400 });
  }
  const { topicId, confidence, edits } = parsed.data;

  if (topicId || edits) {
    // Keep the topic id inside the note JSON in step with the column.
    const patch = { ...edits, ...(topicId ? { topicId } : {}) };
    await query(
      `UPDATE notes SET topic_id = COALESCE($2, topic_id),
                        enhanced = enhanced || $3::jsonb,
                        updated_at = now()
        WHERE id = $1`,
      [id, topicId ?? null, JSON.stringify(patch)],
    );
  }

  if (confidence) {
    const [row] = await query<{ interval_days: number }>(
      `SELECT interval_days FROM notes WHERE id = $1`,
      [id],
    );
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    const days = nextIntervalDays(row.interval_days, confidence);
    await query(
      `UPDATE notes SET confidence = $2, interval_days = $3,
                        due_at = now() + make_interval(days => $3),
                        reviewed_at = now(), review_count = review_count + 1
        WHERE id = $1`,
      [id, confidence, days],
    );
    return Response.json({ ok: true, nextReviewInDays: days });
  }
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Bad id" }, { status: 400 });
  await query(`DELETE FROM notes WHERE id = $1`, [id]);
  return Response.json({ ok: true });
}
