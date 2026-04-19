import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, joiningBonusesTable, globalPoolTable, rewardsTable, referralsTable, adWatchesTable } from "@workspace/db";
import { eq, desc, and, gte, inArray } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";
import { REWARD_MILESTONES } from "../lib/rewardService";

// I'll replicate the getTierInfo code here or better yet just return the label.
const EARNING_TIERS = [
  { minJoins: 50, rate: 0.054, pkr: 15, label: "Level 5 (Pro)", color: "text-amber-800" },
  { minJoins: 35, rate: 0.046, pkr: 13, label: "Level 4", color: "text-red-600" },
  { minJoins: 25, rate: 0.040, pkr: 11, label: "Level 3", color: "text-yellow-600" },
  { minJoins: 15, rate: 0.032, pkr: 9, label: "Level 2", color: "text-purple-600" },
  { minJoins: 5,  rate: 0.025, pkr: 7, label: "Level 1", color: "text-blue-600" },
  { minJoins: 0,  rate: 0.018, pkr: 5, label: "Base Level", color: "text-slate-600" },
];
function getTierInfo(referralCount: number) {
  return EARNING_TIERS.find(t => referralCount >= t.minJoins) || EARNING_TIERS[EARNING_TIERS.length - 1];
}

const router: IRouter = Router();

router.get("/users/dashboard", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Check for any existing transactions to decide if we need a deep reset
  const existingTx = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.userId, user.id), eq(transactionsTable.status, "completed")))
    .limit(1);

  // AUTO-RESET for Admin accounts (Hard Cleanup) - Triggers if there is any balance OR any history
  if (user.isAdmin && (Number(user.balance) > 0 || Number(user.totalEarnings) > 0 || user.referralCount > 0 || existingTx.length > 0)) {
     // 1. Delete all activity history
     await db.delete(transactionsTable).where(eq(transactionsTable.userId, user.id));
     await db.delete(referralsTable).where(eq(referralsTable.referrerId, user.id));
     await db.delete(joiningBonusesTable).where(eq(joiningBonusesTable.userId, user.id));
     await db.delete(rewardsTable).where(eq(rewardsTable.userId, user.id));
     await db.delete(adWatchesTable).where(eq(adWatchesTable.userId, user.id));
     
     // 2. Clear relationship with any users recruited by admin (so they don't count as hidden refs)
     await db.update(usersTable).set({ uplinerId: null }).where(eq(usersTable.uplinerId, user.id));

     // 3. Reset the account stats
     await db.update(usersTable).set({
        balance: "0",
        totalEarnings: "0",
        totalWithdrawn: "0",
        referralCount: 0,
        dynamicAdRatePkr: 5 
      }).where(eq(usersTable.id, user.id));
      
      // 4. Record the cleanup action (the only transaction left)
      await db.insert(transactionsTable).values({
        userId: user.id,
        type: "admin_adjustment",
        amount: "0",
        description: "Dashboard COMPLETE HARD RESET (Admin Account)",
        status: "completed",
      });

      // Refetch user to get clean values for the response
      const [updatedAdmin] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
      Object.assign(user, updatedAdmin);
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

  const startOfWeek = new Date(today0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday 00:00:00

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
  const thisWeekJoinsResult = await db.select({ count: referralsTable.id })
    .from(referralsTable)
    .where(and(eq(referralsTable.referrerId, user.id), eq(referralsTable.level, 1), gte(referralsTable.createdAt, startOfWeek)));
  const thisWeekReferrals = thisWeekJoinsResult.length;
  const totalWithdrawnAmount = allTransactions
    .filter(t => t.type === "withdrawal" && t.status === "approved")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const pendingWithdrawalsAmount = allTransactions
    .filter(t => t.type === "withdrawal" && t.status === "pending")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  res.json({
    balance: Number(user.balance),
    totalEarnings: Number(user.totalEarnings),
    totalWithdrawn: Number(user.totalWithdrawn),
    referralCount: user.referralCount,
    uplinerName,
    todayAdEarnings,
    todayReferralEarnings,
    pendingWithdrawals, // amount
    pendingDeposits, // amount
    totalWithdrawnAmount,
    pendingWithdrawalsAmount,
    dailyJoiningProgress: todayBonus?.joinsCount || 0,
    thisWeekReferrals,
    todayJoiners,
    hasActivePlan: !!user.hasActivePlan,
    globalPoolShare: yourShare,
    currentTier: getTierInfo(user.referralCount),
    nextRewardMilestone: nextRewardMilestone
      ? { referrals: nextRewardMilestone.referrals, amount: nextRewardMilestone.amount, claimed: false }
      : null,
    recentTransactions,
  });
});

export default router;
