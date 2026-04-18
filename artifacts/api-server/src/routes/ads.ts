import { Router, type IRouter } from "express";
import { db, usersTable, adWatchesTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

const AD_EARNING = 0.018;
const DAILY_AD_LIMIT = 20;
const MIN_WATCH_DURATION = 25;

router.get("/ads/status", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const watches = await db.select().from(adWatchesTable).where(
    and(eq(adWatchesTable.userId, user.id), eq(adWatchesTable.watchDate, today))
  );

  const adsWatchedToday = watches.length;
  const earningsToday = watches.reduce((sum, w) => sum + Number(w.earned), 0);
  const dailyLimitReached = adsWatchedToday >= DAILY_AD_LIMIT;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  res.json({
    adsWatchedToday,
    dailyLimit: DAILY_AD_LIMIT,
    earningsToday,
    dailyLimitReached,
    nextResetAt: tomorrow.toISOString(),
  });
});

router.post("/ads/watch", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "Account blocked" });
    return;
  }

  const { adId, watchDuration } = req.body;

  if (!adId || !watchDuration) {
    res.status(400).json({ error: "adId and watchDuration required" });
    return;
  }

  if (watchDuration < MIN_WATCH_DURATION) {
    res.status(400).json({ error: "Watch duration too short" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const watches = await db.select().from(adWatchesTable).where(
    and(eq(adWatchesTable.userId, user.id), eq(adWatchesTable.watchDate, today))
  );

  if (watches.length >= DAILY_AD_LIMIT) {
    res.status(400).json({ error: "Daily ad limit reached" });
    return;
  }

  const alreadyWatched = watches.some(w => w.adId === adId);
  if (alreadyWatched) {
    res.status(400).json({ error: "Already watched this ad today" });
    return;
  }

  await db.insert(adWatchesTable).values({
    userId: user.id,
    adId,
    earned: String(AD_EARNING),
    watchDate: today,
  });

  const newBalance = Number(user.balance) + AD_EARNING;
  await db.update(usersTable).set({
    balance: String(newBalance),
    totalEarnings: String(Number(user.totalEarnings) + AD_EARNING),
  }).where(eq(usersTable.id, user.id));

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "ad_earning",
    amount: String(AD_EARNING),
    description: `Ad watched: earned $${AD_EARNING.toFixed(3)}`,
    status: "completed",
  });

  const totalToday = watches.reduce((sum, w) => sum + Number(w.earned), 0) + AD_EARNING;

  res.json({
    earned: AD_EARNING,
    totalToday,
    adsWatchedToday: watches.length + 1,
    dailyLimitReached: watches.length + 1 >= DAILY_AD_LIMIT,
    newBalance,
  });
});

export default router;
