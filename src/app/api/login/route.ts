import { cookies } from "next/headers";
import { GATE_COOKIE, gateToken, safeEqual } from "@/lib/gate";

export async function POST(request: Request) {
  const expected = process.env.APP_PASSWORD;
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const given = typeof body?.password === "string" ? body.password : "";

  if (!expected || !safeEqual(gateToken(given), gateToken(expected))) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  (await cookies()).set(GATE_COOKIE, gateToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}
