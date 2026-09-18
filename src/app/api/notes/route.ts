import { pool, query, ready } from "@/lib/db";
import { CreateNoteSchema, type NoteSummary } from "@/lib/types";

const SUMMARY_COLUMNS = `
  id::int                        AS "id",
  created_at                     AS "createdAt",
  topic_id                       AS "topicId",
  source_kind                    AS "sourceKind",
  enhanced->>'title'             AS "title",
  enhanced->>'summary'           AS "summary",
  confidence                     AS "confidence",
  reviewed_at                    AS "reviewedAt"`;

export async function GET(request: Request) {
  const topicId = new URL(request.url).searchParams.get("topicId");
  const rows = await query<NoteSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM notes
      WHERE $1::text IS NULL OR topic_id = $1
      ORDER BY created_at DESC`,
    [topicId],
  );
  return Response.json({ notes: rows });
}

export async function POST(request: Request) {
  const parsed = CreateNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid note" }, { status: 400 });
  }
  const { sourceText, sourceUrl, topicId, enhanced, images } = parsed.data;
  const kinds = [images.length > 0, !!sourceUrl, !!sourceText?.trim()];
  const sourceKind =
    kinds.filter(Boolean).length > 1
      ? "mixed"
      : kinds[0]
        ? "photo"
        : kinds[1]
          ? "link"
          : "text";

  await ready();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: number }>(
      `INSERT INTO notes (source_kind, source_text, source_url, topic_id, enhanced)
       VALUES ($1, $2, $3, $4, $5) RETURNING id::int AS id`,
      [sourceKind, sourceText ?? null, sourceUrl ?? null, topicId, JSON.stringify(enhanced)],
    );
    const noteId = inserted.rows[0].id;
    for (const [position, img] of images.entries()) {
      await client.query(
        `INSERT INTO note_images (note_id, position, media_type, data)
         VALUES ($1, $2, $3, $4)`,
        [noteId, position, img.mediaType, Buffer.from(img.data, "base64")],
      );
    }
    await client.query("COMMIT");
    return Response.json({ id: noteId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
