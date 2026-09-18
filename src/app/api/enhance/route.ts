import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { EnhanceRequestSchema, EnhancedNoteSchema } from "@/lib/schema";
import { topicCatalogForPrompt } from "@/lib/topics";

export const maxDuration = 300;

const MODEL = "claude-opus-5";

// Frozen prefix (instructions + topic catalog) so repeated captures hit the prompt cache.
const SYSTEM = `You are a study partner for a general surgery resident preparing for the ABSITE (American Board of Surgery In-Training Examination).

The resident captures raw material — photos of textbook pages, whiteboards, or handwritten notes; a web link; or typed notes from conference or the OR. Turn each capture into one polished study note.

How to write the note:
- Preserve everything the source actually says, cleaned up and organized. Then add the context a strong chief resident would add: the mechanism behind a fact, the numbers that get tested (thresholds, percentages, doses, staging cutoffs), first-line vs. second-line management, and the classic distractors.
- Write for recall under exam conditions: tight headings, comparison tables where two entities get confused, bold for the testable fact in a sentence.
- Quiz questions should read like the stem's final line ("Next step in management?", "Most common site?") with a short, unambiguous answer.
- Only include a Mermaid flowchart when the content has a real decision sequence (workup or management algorithm). Only include a chart when there are genuinely comparable numbers.
- Accuracy matters more than coverage. If handwriting is illegible, or you add a fact you are less than confident in, list it under "uncertain" rather than guessing silently. Guidelines change; flag anything where recommendations have shifted recently.
- If the capture contains patient identifiers (names, MRNs, dates of birth), leave them out of the note entirely.

File the note against exactly one leaf topic id from this catalog (use "unfiled" only if nothing fits), and list up to three related leaf ids.

<topic_catalog>
${topicCatalogForPrompt()}
</topic_catalog>`;

export async function POST(request: Request) {
  const parsed = EnhanceRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { text, url, images } = parsed.data;
  if (!text?.trim() && !url && !images?.length) {
    return Response.json(
      { error: "Provide a photo, a link, or some text" },
      { status: 400 },
    );
  }

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const img of images ?? []) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.data },
    });
  }
  const parts: string[] = [];
  if (url) parts.push(`Fetch and use this page as the source: ${url}`);
  if (text?.trim()) parts.push(`<resident_notes>\n${text.trim()}\n</resident_notes>`);
  if (images?.length) parts.push("The attached photo(s) are part of the source.");
  content.push({ type: "text", text: parts.join("\n\n") });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(EnhancedNoteSchema),
      },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: url
        ? [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 }]
        : undefined,
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "The model declined this capture." },
        { status: 422 },
      );
    }
    if (!response.parsed_output) {
      return Response.json(
        { error: `No note produced (stop reason: ${response.stop_reason}).` },
        { status: 502 },
      );
    }
    return Response.json({ note: response.parsed_output, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json(
        {
          error:
            "No valid Anthropic credentials. Set ANTHROPIC_API_KEY in .env.local and restart the dev server.",
        },
        { status: 401 },
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json({ error: err.message }, { status: err.status ?? 502 });
    }
    // The SDK throws a plain Error when no credential source resolves at all.
    const message = err instanceof Error ? err.message : "Unexpected error";
    if (message.includes("Could not resolve authentication method")) {
      return Response.json(
        {
          error:
            "No Anthropic credentials found. Set ANTHROPIC_API_KEY in .env.local and restart the dev server.",
        },
        { status: 401 },
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
