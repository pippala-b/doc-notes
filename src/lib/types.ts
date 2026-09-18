import { z } from "zod";
import { EnhancedNoteSchema, type EnhancedNote } from "./schema";

export const PinSchema = z.object({
  id: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  text: z.string().max(2000),
});
export type Pin = z.infer<typeof PinSchema>;

export type NoteImageMeta = { id: string; mediaType: string; pins: Pin[] };

export type NoteSummary = {
  id: number;
  createdAt: string;
  topicId: string;
  sourceKind: "photo" | "link" | "text" | "mixed";
  title: string;
  summary: string;
  confidence: 1 | 2 | 3 | null;
  reviewedAt: string | null;
};

export type NoteDetail = NoteSummary & {
  sourceText: string | null;
  sourceUrl: string | null;
  enhanced: EnhancedNote;
  images: NoteImageMeta[];
};

const ImageUpload = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  data: z.string(), // base64
});

export const CreateNoteSchema = z.object({
  sourceText: z.string().max(60_000).optional(),
  sourceUrl: z.string().url().optional(),
  topicId: z.string(),
  enhanced: EnhancedNoteSchema,
  images: z.array(ImageUpload).max(6).default([]),
});

export const UpdateNoteSchema = z.object({
  topicId: z.string().optional(),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  reviewed: z.boolean().optional(),
});
