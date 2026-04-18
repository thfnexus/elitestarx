import { Router, type IRouter } from "express";
import { db, usersTable, referralsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/referrals/team", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const levels: Record<number, Array<{ id: number; username: string; joinedAt: string; level: number; isActive: boolean }>> = {
    1: [], 2: [], 3: [], 4: [], 5: [],
  };

  const allReferrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, user.id));

  const uniqueByLevel: Map<string, typeof allReferrals[0]> = new Map();
  for (const ref of allReferrals) {
    const key = `${ref.level}-${ref.referredId}`;
    if (!uniqueByLevel.has(key)) {
      uniqueByLevel.set(key, ref);
    }
  }

  for (const ref of uniqueByLevel.values()) {
    const [referredUser] = await db.select().from(usersTable).where(eq(usersTable.id, ref.referredId));
    if (referredUser && levels[ref.level]) {
      levels[ref.level].push({
        id: referredUser.id,
        username: referredUser.username,
        joinedAt: referredUser.createdAt.toISOString(),
        level: ref.level,
        isActive: !referredUser.isBlocked,
      });
    }
  }

  const totalMembers = Object.values(levels).reduce((sum, arr) => sum + arr.length, 0);

  res.json({
    totalMembers,
    level1: levels[1],
    level2: levels[2],
    level3: levels[3],
    level4: levels[4],
    level5: levels[5],
  });
});

router.get("/referrals/earnings", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const referrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, user.id));

  const result = await Promise.all(referrals.map(async (ref) => {
    const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, ref.referredId));
    return {
      id: ref.id,
      fromUsername: fromUser?.username || "Unknown",
      level: ref.level,
      amount: Number(ref.commission),
      createdAt: ref.createdAt.toISOString(),
    };
  }));

  res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

export default router;
