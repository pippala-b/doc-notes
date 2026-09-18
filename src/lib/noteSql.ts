// Column list shared by the note list and detail queries (camelCase for the client).
export const SUMMARY_COLUMNS = `
  id::int              AS "id",
  created_at           AS "createdAt",
  topic_id             AS "topicId",
  source_kind          AS "sourceKind",
  enhanced->>'title'   AS "title",
  enhanced->>'summary' AS "summary",
  confidence           AS "confidence",
  reviewed_at          AS "reviewedAt",
  due_at               AS "dueAt",
  ai_enhanced          AS "aiEnhanced"`;
