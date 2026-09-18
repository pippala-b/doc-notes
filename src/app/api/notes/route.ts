import { pool, query, ready } from "@/lib/db";
import { SUMMARY_COLUMNS } from "@/lib/noteSql";
import { CreateNoteSchema, type NoteSummary } from "@/lib/types";

// ?topicId= filter · ?due=1 review queue · ?q= full-text search (ranked, with snippet)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();

  if (q) {
    const rows = await query<NoteSummary>(
      `SELECT ${SUMMARY_COLUMNS},
              ts_headline('english',
                coalesce(enhanced->>'summary', '') || ' … ' || coalesce(enhanced->>'enhancedMarkdown', ''),
                websearch_to_tsquery('english', $1),
                'StartSel=[[, StopSel=]], MaxWords=28, MinWords=12, MaxFragments=2, FragmentDelimiter= … '
              ) AS "snippet"
         FROM notes
        WHERE search @@ websearch_to_tsquery('english', $1)
           OR enhanced->>'title' ILIKE '%' || $1 || '%'
        ORDER BY ts_rank(search, websearch_to_tsquery('english', $1)) DESC, created_at DESC
        LIMIT 50`,
      [q],
    );
    return Response.json({ notes: rows });
  }

  const due = params.get("due") === "1";
  const rows = await query<NoteSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM notes
      WHERE ($1::text IS NULL OR topic_id = $1)
        AND (NOT $2 OR due_at <= now())
      ORDER BY ${due ? "due_at ASC" : "created_at DESC"}`,
    [params.get("topicId"), due],
  );
  return Response.json({ notes: rows });
}

export async function POST(request: Request) {
  const parsed = CreateNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid note" }, { status: 400 });
  }
  const { sourceText, sourceUrl, topicId, enhanced, aiEnhanced, images } = parsed.data;
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
      `INSERT INTO notes (source_kind, source_text, source_url, topic_id, enhanced, ai_enhanced)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::int AS id`,
      [sourceKind, sourceText ?? null, sourceUrl ?? null, topicId, JSON.stringify(enhanced), aiEnhanced],
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
