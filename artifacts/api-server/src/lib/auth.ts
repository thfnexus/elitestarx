import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + process.env.SESSION_SECRET || "earnhub_secret").digest("hex");
}

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export function generateToken(userId: number): string {
  const payload = `${userId}:${Date.now()}:${Math.random()}`;
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "earnhub_secret").update(payload).digest("hex") + "." + Buffer.from(String(userId)).toString("base64");
}

export function getUserIdFromToken(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const userId = parseInt(Buffer.from(parts[1], "base64").toString(), 10);
    if (isNaN(userId)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: { headers: { authorization?: string } }) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const userId = getUserIdFromToken(token);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user || null;
}
