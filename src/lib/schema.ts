import { z } from "zod";

// Structured result the model returns for every capture. Shared by the API
// route (output format) and the client (rendering + storage).
export const EnhancedNoteSchema = z.object({
  title: z.string().describe("Short, specific note title (max ~70 chars)"),
  topicId: z
    .string()
    .describe("Best-matching leaf topic id from the catalog, or 'unfiled'"),
  relatedTopicIds: z
    .array(z.string())
    .describe("0-3 other leaf topic ids this note also touches"),
  summary: z.string().describe("2-3 sentence plain-text summary"),
  enhancedMarkdown: z
    .string()
    .describe(
      "The full study note in GitHub-flavored markdown: cleaned-up source content, then clarifications and missing context. Use headings, tables, and bold for testable facts.",
    ),
  highYield: z
    .array(z.string())
    .describe("3-8 one-line, exam-style high-yield facts"),
  pitfalls: z
    .array(z.string())
    .describe("0-4 classic traps, exceptions, or commonly confused points"),
  mnemonics: z.array(z.string()).describe("0-3 mnemonics, only if genuinely useful"),
  quiz: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .describe("3-5 short-answer self-test questions"),
  mermaid: z
    .string()
    .describe(
      "A Mermaid 'flowchart TD' for a workup/management algorithm when the content has one; otherwise an empty string. Quote node labels containing punctuation.",
    ),
  chart: z
    .object({
      title: z.string(),
      unit: z.string(),
      data: z.array(z.object({ label: z.string(), value: z.number() })),
    })
    .nullable()
    .describe(
      "A small bar chart when the content has comparable numbers (rates, thresholds, scores); otherwise null",
    ),
  uncertain: z
    .array(z.string())
    .describe(
      "Anything illegible in the source, or facts you added that the learner should verify against a primary reference",
    ),
});

export type EnhancedNote = z.infer<typeof EnhancedNoteSchema>;

export const EnhanceRequestSchema = z.object({
  text: z.string().max(60_000).optional(),
  url: z.string().url().optional(),
  images: z
    .array(
      z.object({
        mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
        data: z.string(), // base64, no data: prefix
      }),
    )
    .max(6)
    .optional(),
});

export type EnhanceRequest = z.infer<typeof EnhanceRequestSchema>;
