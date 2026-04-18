import { Router, type IRouter } from "express";
import { db, globalPoolTable, usersTable } from "@workspace/db";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/global-pool/status", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [pool] = await db.select().from(globalPoolTable);
  const allUsers = await db.select().from(usersTable);
  const totalMembers = allUsers.length;

  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
  nextSunday.setHours(0, 0, 0, 0);

  const currentPool = pool ? Number(pool.balance) : 0;
  const yourShare = totalMembers > 0 ? currentPool / totalMembers : 0;

  res.json({
    currentPool,
    totalMembers,
    nextDistributionAt: nextSunday.toISOString(),
    yourShare,
    lastDistributed: pool?.lastDistributedAt ? Number(pool.lastDistributedAt.getTime()) : null,
  });
});

export default router;
