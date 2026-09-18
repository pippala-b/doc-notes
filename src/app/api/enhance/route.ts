import { EnhanceError, enhanceCapture } from "@/lib/enhance";
import { EnhanceRequestSchema } from "@/lib/schema";

export const maxDuration = 300;

export async function POST(request: Request) {
  const parsed = EnhanceRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return Response.json({ note: await enhanceCapture(parsed.data) });
  } catch (err) {
    const e = err as EnhanceError;
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
