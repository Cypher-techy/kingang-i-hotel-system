import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";

const COOKIE_NAME = "kingangi_staff_session";
const secret = () => process.env.AUTH_SECRET ?? "development-session-secret-change-me";

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

export function createSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId: string; expiresAt: number };
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const [user] = await db.select({ id: userProfiles.id, email: userProfiles.email, fullName: userProfiles.fullName, role: userProfiles.role, branchId: userProfiles.branchId, phone: userProfiles.phone }).from(userProfiles).where(eq(userProfiles.id, session.userId)).limit(1);
  return user ?? null;
}

export { COOKIE_NAME };
