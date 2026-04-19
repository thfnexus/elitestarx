import { Router, type IRouter } from "express";
// Added to force backend hot-reload for newest API updates
import { db, usersTable, adWatchesTable, transactionsTable, settingsTable, referralsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

const DAILY_AD_LIMIT = 1;
const MIN_WATCH_DURATION = 25;
const MIN_RATE_PKR = 5;       // 0.018 USD base (never goes below)
const PKR_TO_USD = 0.0036;    // 1 PKR = 0.0036 USD  (5 PKR = 0.018 USD)
const RATE_CHANGE_PKR = 4;    // +4 PKR per joining, -4 PKR if no joining

/** Apply daily decrease if user had no referrals today, clamp to MIN_RATE_PKR */
async function applyDailyDecreaseIfNeeded(user: any, today: string): Promise<number> {
  const todayStart = new Date(`${today}T00:00:00.000Z`);
  const todayRefs = await db.select({ id: referralsTable.id })
    .from(referralsTable)
    .where(and(
      eq(referralsTable.referrerId, user.id),
      eq(referralsTable.level, 1),
      gte(referralsTable.createdAt, todayStart)
    ));

  let currentRate = user.dynamicAdRatePkr ?? MIN_RATE_PKR;

  if (todayRefs.length === 0) {
    // No joining today → decrease by 4 PKR (minimum MIN_RATE_PKR)
    currentRate = Math.max(MIN_RATE_PKR, currentRate - RATE_CHANGE_PKR);
    await db.update(usersTable)
      .set({ dynamicAdRatePkr: currentRate })
      .where(eq(usersTable.id, user.id));
  }

  return currentRate;
}

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

  // Fetch ad link from settings
  const adLinkSetting = await db.select().from(settingsTable).where(eq(settingsTable.key, "ad_link")).limit(1);
  const adLink = adLinkSetting[0]?.value || "https://google.com"; // Fallback if not set

  const currentRatePkr = user.dynamicAdRatePkr ?? MIN_RATE_PKR;
  const tier = { pkr: currentRatePkr, rate: parseFloat((currentRatePkr * PKR_TO_USD).toFixed(4)) };

  res.json({
    adsWatchedToday,
    dailyLimit: DAILY_AD_LIMIT,
    earningsToday,
    dailyLimitReached,
    nextResetAt: tomorrow.toISOString(),
    adLink,
    isPlanActive: !!user.hasActivePlan,
    currentTier: tier,
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

  if (!user.hasActivePlan) {
    res.status(403).json({ error: "Active plan required to watch ads" });
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

  // Apply daily decrease if user had no referrals today
  const currentRatePkr = await applyDailyDecreaseIfNeeded(user, today);
  const reward = parseFloat((currentRatePkr * PKR_TO_USD).toFixed(4));
  const tierLabel = `${currentRatePkr} PKR (Dynamic)`;

  await db.insert(adWatchesTable).values({
    userId: user.id,
    adId,
    earned: String(reward),
    watchDate: today,
  });

  const newBalance = Number(user.balance) + reward;
  const newXp = (user.xp || 0) + 5;
  const newLevel = Math.floor(newXp / 100);
  
  await db.update(usersTable).set({
    balance: String(newBalance),
    totalEarnings: String(Number(user.totalEarnings) + reward),
    xp: newXp,
    level: newLevel,
  }).where(eq(usersTable.id, user.id));


  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "ad_earning",
    amount: String(reward),
    description: `Daily Ads Watching Earning (${tierLabel})`,
    status: "completed",
  });

  const totalToday = watches.reduce((sum, w) => sum + Number(w.earned), 0) + reward;

  res.json({
    earned: reward,
    totalToday,
    adsWatchedToday: watches.length + 1,
    dailyLimitReached: watches.length + 1 >= DAILY_AD_LIMIT,
    newBalance,
  });
});

export default router;
