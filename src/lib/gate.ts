import { createHash, timingSafeEqual } from "node:crypto";

// Shared-password gate for deployed copies. Set APP_PASSWORD to turn it on;
// the cookie holds a hash of the password, so changing it signs everyone out.
export const GATE_COOKIE = "dn_gate";

export function gateToken(password: string): string {
  return createHash("sha256").update(`doc-notes:${password}`).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
