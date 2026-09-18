import { z } from "zod";
import { query } from "@/lib/db";
import { PinSchema } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Bad id", { status: 400 });
  const [row] = await query<{ media_type: string; data: Buffer }>(
    `SELECT media_type, data FROM note_images WHERE id = $1`,
    [id],
  );
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.media_type,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

// Replace the pin set for an image (interactive image notes).
export async function PUT(request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  const parsed = z.object({ pins: z.array(PinSchema).max(100) }).safeParse(await request.json());
  if (!UUID.test(id) || !parsed.success) {
    return Response.json({ error: "Invalid pins" }, { status: 400 });
  }
  await query(`UPDATE note_images SET pins = $2 WHERE id = $1`, [
    id,
    JSON.stringify(parsed.data.pins),
  ]);
  return Response.json({ ok: true });
}
