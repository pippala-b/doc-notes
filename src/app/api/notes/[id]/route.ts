import { query } from "@/lib/db";
import { UpdateNoteSchema, type NoteDetail, type NoteImageMeta } from "@/lib/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Bad id" }, { status: 400 });

  const [note] = await query<Omit<NoteDetail, "images">>(
    `SELECT id::int AS "id", created_at AS "createdAt", topic_id AS "topicId",
            source_kind AS "sourceKind", enhanced->>'title' AS "title",
            enhanced->>'summary' AS "summary", confidence AS "confidence",
            reviewed_at AS "reviewedAt", source_text AS "sourceText",
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
  const { topicId, confidence, reviewed } = parsed.data;
  await query(
    `UPDATE notes SET
        topic_id    = COALESCE($2, topic_id),
        confidence  = COALESCE($3, confidence),
        reviewed_at = CASE WHEN $4 THEN now() ELSE reviewed_at END,
        updated_at  = now()
      WHERE id = $1`,
    [id, topicId ?? null, confidence ?? null, reviewed ?? false],
  );
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Bad id" }, { status: 400 });
  await query(`DELETE FROM notes WHERE id = $1`, [id]);
  return Response.json({ ok: true });
}
