import { query } from "@/lib/db";

// Deployment self-check (behind the sign-in gate): says whether the database is
// configured and reachable, with the driver's error text when it is not. Never
// returns the connection string.
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ database: "DATABASE_URL is not set for this environment" }, { status: 500 });
  }
  try {
    const [row] = await query<{ notes: number }>(`SELECT count(*)::int AS notes FROM notes`);
    return Response.json({ database: "ok", notes: row.notes, anthropicKeySet: !!process.env.ANTHROPIC_API_KEY });
  } catch (err) {
    const e = err as Error & { code?: string };
    return Response.json({ database: "error", code: e.code ?? null, message: e.message }, { status: 500 });
  }
}
