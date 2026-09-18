import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateToken, safeEqual } from "@/lib/gate";

// The app has no accounts: without this gate anyone with the URL could read
// and delete notes and spend the Anthropic key. Off locally unless APP_PASSWORD
// is set; a deployment without one refuses to serve rather than run open.
export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    if (!process.env.VERCEL) return NextResponse.next();
    return new NextResponse("Set the APP_PASSWORD environment variable, then redeploy.", { status: 503 });
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();

  const cookie = request.cookies.get(GATE_COOKIE)?.value;
  if (cookie && safeEqual(cookie, gateToken(password))) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
