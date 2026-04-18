import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, joiningBonusesTable, globalPoolTable, rewardsTable, referralsTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";
import { REWARD_MILESTONES } from "../lib/rewardService";

const router: IRouter = Router();

router.get("/users/dashboard", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let uplinerName: string | null = null;
  if (user.uplinerId) {
    const [upliner] = await db.select().from(usersTable).where(eq(usersTable.id, user.uplinerId));
    uplinerName = upliner?.username || null;
  }

  const today = new Date().toISOString().split("T")[0];

  const [todayBonus] = await db.select().from(joiningBonusesTable).where(
    and(eq(joiningBonusesTable.userId, user.id), eq(joiningBonusesTable.bonusDate, today))
  );

  const allTransactions = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt));

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  const todayAdEarnings = allTransactions
    .filter(t => t.type === "ad_earning" && t.createdAt >= today0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const todayReferralEarnings = allTransactions
    .filter(t => t.type === "referral_commission" && t.createdAt >= today0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingWithdrawals = allTransactions
    .filter(t => t.type === "withdrawal" && t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingDeposits = allTransactions
    .filter(t => t.type === "deposit" && t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const recentTransactions = allTransactions.slice(0, 10).map(t => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  const [pool] = await db.select().from(globalPoolTable);
  const totalPoolMembers = await db.select().from(usersTable);
  const yourShare = pool && totalPoolMembers.length > 0 ? Number(pool.balance) / totalPoolMembers.length : 0;

  const existingRewards = await db.select().from(rewardsTable).where(eq(rewardsTable.userId, user.id));
  const claimedMilestones = new Set(existingRewards.map(r => r.milestoneReferrals));

  const nextRewardMilestone = REWARD_MILESTONES.find(m => !claimedMilestones.has(m.referrals)) || null;

  const todayJoinsRaw = await db.select({ referredId: referralsTable.referredId, createdAt: referralsTable.createdAt })
    .from(referralsTable)
    .where(and(eq(referralsTable.referrerId, user.id), eq(referralsTable.level, 1), gte(referralsTable.createdAt, today0)));

  const todayJoinerIds = todayJoinsRaw.map(r => r.referredId);
  let todayJoiners: string[] = [];
  if (todayJoinerIds.length > 0) {
    const joinedUsers = await db.select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, todayJoinerIds[0]));
    const joinedMap = new Map(joinedUsers.map(u => [u.id, u.username]));
    for (const id of todayJoinerIds) {
      const username = joinedMap.get(id);
      if (username) todayJoiners.push(username);
    }
    if (todayJoinerIds.length > 1) {
      const rest = await Promise.all(todayJoinerIds.slice(1).map(id =>
        db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable).where(eq(usersTable.id, id))
      ));
      for (const rows of rest) {
        if (rows[0]) todayJoiners.push(rows[0].username);
      }
    }
  }

  res.json({
    balance: Number(user.balance),
    totalEarnings: Number(user.totalEarnings),
    totalWithdrawn: Number(user.totalWithdrawn),
    referralCount: user.referralCount,
    uplinerName,
    todayAdEarnings,
    todayReferralEarnings,
    pendingWithdrawals,
    pendingDeposits,
    dailyJoiningProgress: todayBonus?.joinsCount || 0,
    todayJoiners,
    globalPoolShare: yourShare,
    nextRewardMilestone: nextRewardMilestone
      ? { referrals: nextRewardMilestone.referrals, amount: nextRewardMilestone.amount, claimed: false }
      : null,
    recentTransactions,
  });
});

export default router;
