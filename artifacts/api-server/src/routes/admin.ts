import { Router, type IRouter } from "express";
import { db, usersTable, depositsTable, withdrawalsTable, transactionsTable, globalPoolTable, settingsTable, referralsTable, weeklyPayoutsTable, adWatchesTable, rewardsTable, joiningBonusesTable } from "@workspace/db";
import { eq, desc, gte, and, or } from "drizzle-orm";
import { hashPassword, generateReferralCode, generateToken, getAuthUser } from "../lib/auth";
import { processReferralCommissions, processDailyJoiningBonus } from "../lib/referralService";


const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

router.get("/admin/users", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday 00:00:00

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // Fetch all level 1 referrals since start of last week
  const recentReferrals = await db.select({
    referrerId: referralsTable.referrerId,
    createdAt: referralsTable.createdAt,
  })
  .from(referralsTable)
  .where(
    and(
      eq(referralsTable.level, 1),
      gte(referralsTable.createdAt, startOfLastWeek)
    )
  );
  // Actually, wait, let me just add `and` to imports in the first patch.
  // I will write the proper logic here:

  res.json(users.map(u => {
    let thisWeek = 0;
    let lastWeek = 0;

    for (const ref of recentReferrals) {
      if (ref.referrerId === u.id) {
        if (ref.createdAt >= startOfWeek) {
          thisWeek++;
        } else if (ref.createdAt >= startOfLastWeek && ref.createdAt < startOfWeek) {
          lastWeek++;
        }
      }
    }

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      balance: Number(u.balance),
      totalEarnings: Number(u.totalEarnings),
      referralCount: u.referralCount,
      isBlocked: u.isBlocked,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt.toISOString(),
      whatsappNumber: u.whatsappNumber,
      thisWeekReferrals: thisWeek,
      lastWeekReferrals: lastWeek,
    };
  }));
});

router.patch("/admin/users/:id/block", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { blocked } = req.body;

  if (typeof blocked !== "boolean") {
    res.status(400).json({ error: "blocked must be a boolean" });
    return;
  }

  const [user] = await db.update(usersTable).set({ isBlocked: blocked }).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, message: `User ${blocked ? "blocked" : "unblocked"} successfully` });
});

router.patch("/admin/users/:id/balance", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { amount, reason } = req.body;

  if (typeof amount !== "number" || !reason) {
    res.status(400).json({ error: "amount (number) and reason (string) required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = Math.max(0, Number(user.balance) + amount);
  await db.update(usersTable).set({
    balance: String(newBalance),
    totalEarnings: amount > 0 ? String(Number(user.totalEarnings) + amount) : user.totalEarnings,
  }).where(eq(usersTable.id, id));

  await db.insert(transactionsTable).values({
    userId: id,
    type: "admin_adjustment",
    amount: String(amount.toFixed(4)),
    description: `Admin balance adjustment: ${reason}`,
    status: "completed",
  });

  res.json({ success: true, message: "Balance adjusted successfully" });
});

router.patch("/admin/users/:id/role", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  console.log(`[ADMIN] Role update triggered for user ID: ${req.params.id}`);

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { isAdmin } = req.body;

  if (typeof isAdmin !== "boolean") {
    res.status(400).json({ error: "isAdmin is required and must be a boolean" });
    return;
  }

  const [user] = await db.update(usersTable).set({ isAdmin }).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, message: `User ${isAdmin ? "promoted to Admin" : "demoted to standard user"} successfully` });
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.isAdmin) {
    // Check if this is the last admin to prevent lockout
    const admins = await db.select().from(usersTable).where(eq(usersTable.isAdmin, true));
    if (admins.length <= 1) {
       res.status(400).json({ error: "Cannot delete the last administrator." });
       return;
    }
  }

  // CASCADING CLEANUP: Delete all records referencing this user
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, id));
  await db.delete(depositsTable).where(eq(depositsTable.userId, id));
  await db.delete(withdrawalsTable).where(eq(withdrawalsTable.userId, id));
  await db.delete(adWatchesTable).where(eq(adWatchesTable.userId, id));
  await db.delete(rewardsTable).where(eq(rewardsTable.userId, id));
  await db.delete(joiningBonusesTable).where(eq(joiningBonusesTable.userId, id));
  await db.delete(weeklyPayoutsTable).where(eq(weeklyPayoutsTable.userId, id));
  
  // Referrals: Wipe records where this user is the referrer OR the referred
  await db.delete(referralsTable).where(
    or(eq(referralsTable.referrerId, id), eq(referralsTable.referredId, id))
  );

  // Upliner logic: If anyone had this user as an upliner, set them to null or handle differently.
  // We'll set to null to avoid breaking the tree completely.
  await db.update(usersTable).set({ uplinerId: null }).where(eq(usersTable.uplinerId, id));

  // Finally delete the user
  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ success: true, message: "User account and all related data deleted permanently." });
});

router.get("/admin/deposits", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const deposits = await db.select().from(depositsTable).orderBy(desc(depositsTable.createdAt));

  const result = await Promise.all(deposits.map(async d => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, d.userId));
    return {
      id: d.id,
      username: user?.username || "Unknown",
      method: d.method,
      amount: Number(d.amount),
      transactionRef: d.transactionRef,
      senderNumber: d.senderNumber || null,
      status: d.status,
      notes: d.notes || null,
      createdAt: d.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.patch("/admin/deposits/:id/approve", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { action, notes } = req.body;

  if (!["approve", "reject"].includes(action)) {
    res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    return;
  }

  const [deposit] = await db.select().from(depositsTable).where(eq(depositsTable.id, id));
  if (!deposit) {
    res.status(404).json({ error: "Deposit not found" });
    return;
  }

  if (deposit.status !== "pending") {
    res.status(400).json({ error: "Deposit already processed" });
    return;
  }

  const status = action === "approve" ? "approved" : "rejected";
  await db.update(depositsTable).set({ status, notes: notes || null, reviewedAt: new Date() }).where(eq(depositsTable.id, id));

  if (action === "approve") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, deposit.userId));
    if (user) {
      const newXp = (user.xp || 0) + 50;
      const newLevel = Math.floor(newXp / 100);

      await db.update(usersTable).set({
        hasActivePlan: true,
        xp: newXp,
        level: newLevel,
      }).where(eq(usersTable.id, deposit.userId));

      await db.update(transactionsTable).set({ 
        status: "completed",
        description: `Account Activation Fee (Ref: ${deposit.transactionRef})`
      }).where(eq(transactionsTable.referenceId, id));

      // NEW: Referral Processing on Activation
      if (user.uplinerId) {
        const [upliner] = await db.select().from(usersTable).where(eq(usersTable.id, user.uplinerId));
        if (upliner) {
          const uplinerNewXp = (upliner.xp || 0) + 20;
          const uplinerNewLevel = Math.floor(uplinerNewXp / 100);

          await db.update(usersTable)
            .set({
              referralCount: upliner.referralCount + 1,
              // +4 PKR per new joining (activation)
              dynamicAdRatePkr: upliner.dynamicAdRatePkr + 4,
              xp: uplinerNewXp,
              level: uplinerNewLevel,
            })
            .where(eq(usersTable.id, user.uplinerId));

          await processReferralCommissions(user.id, user.uplinerId);
          await processDailyJoiningBonus(user.uplinerId);
        }
      }
    }
  } else {
    await db.update(transactionsTable).set({ status: "failed" })
      .where(eq(transactionsTable.referenceId, id));
  }

  res.json({ success: true, message: `Deposit ${status}` });
});

router.get("/admin/withdrawals", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));

  const result = await Promise.all(withdrawals.map(async w => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId));
    return {
      id: w.id,
      username: user?.username || "Unknown",
      method: w.method,
      amount: Number(w.amount),
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      status: w.status,
      notes: w.notes || null,
      createdAt: w.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.patch("/admin/withdrawals/:id/approve", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { action, notes } = req.body;

  if (!["approve", "reject"].includes(action)) {
    res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    return;
  }

  const [withdrawal] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  if (withdrawal.status !== "pending") {
    res.status(400).json({ error: "Withdrawal already processed" });
    return;
  }

  const status = action === "approve" ? "approved" : "rejected";
  await db.update(withdrawalsTable).set({ status, notes: notes || null, reviewedAt: new Date() }).where(eq(withdrawalsTable.id, id));

  if (action === "approve") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
    if (user) {
      await db.update(usersTable).set({
        totalWithdrawn: String(Number(user.totalWithdrawn) + Number(withdrawal.amount)),
      }).where(eq(usersTable.id, withdrawal.userId));
    }
    await db.update(transactionsTable).set({ status: "completed" })
      .where(eq(transactionsTable.referenceId, id));
  } else {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
    if (user) {
      await db.update(usersTable).set({
        balance: String(Number(user.balance) + Number(withdrawal.amount)),
      }).where(eq(usersTable.id, withdrawal.userId));
    }
    await db.update(transactionsTable).set({ status: "failed" })
      .where(eq(transactionsTable.referenceId, id));
  }

  res.json({ success: true, message: `Withdrawal ${status}` });
});

router.get("/admin/analytics", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const allUsers = await db.select().from(usersTable);
  const allDeposits = await db.select().from(depositsTable);
  const allWithdrawals = await db.select().from(withdrawalsTable);
  const [pool] = await db.select().from(globalPoolTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newUsersToday = allUsers.filter(u => u.createdAt >= today).length;
  const totalEarningsDistributed = allUsers.reduce((sum, u) => sum + Number(u.totalEarnings), 0);
  const totalDeposits = allDeposits.filter(d => d.status === "approved").reduce((sum, d) => sum + Number(d.amount), 0);
  const totalWithdrawals = allWithdrawals.filter(w => w.status === "approved").reduce((sum, w) => sum + Number(w.amount), 0);
  const pendingDeposits = allDeposits.filter(d => d.status === "pending").length;
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === "pending").length;

  res.json({
    totalUsers: allUsers.length,
    totalEarningsDistributed,
    totalDeposits,
    totalWithdrawals,
    pendingDeposits,
    pendingWithdrawals,
    globalPoolBalance: pool ? Number(pool.balance) : 0,
    newUsersToday,
    activeUsersToday: newUsersToday,
  });
});

router.get("/admin/settings", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const settings = await db.select().from(settingsTable);
  res.json(settings.map(s => ({
    key: s.key,
    value: s.value,
    updatedAt: s.updatedAt.toISOString(),
  })));
});

router.patch("/admin/settings", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const { key, value } = req.body;
  if (!key || value === undefined) {
    res.status(400).json({ error: "key and value required" });
    return;
  }

  await db.insert(settingsTable)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value, updatedAt: new Date() }
    });

  res.json({ success: true, message: `Setting ${key} updated` });
});

router.get("/admin/weekly-payouts", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const payouts = await db.select()
    .from(weeklyPayoutsTable)
    .orderBy(desc(weeklyPayoutsTable.createdAt));

  const result = await Promise.all(payouts.map(async p => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
    return {
      ...p,
      username: user?.username || "Unknown",
      amountPaid: Number(p.amountPaid)
    };
  }));

  res.json(result);
});

// TEMPORARY: Cleanup accidental $2.85 balance additions from activation flow
router.post("/admin/cleanup-balances", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  // Find users activated today who have balance >= 2.85
  const targets = await db.select().from(usersTable).where(
    and(
      eq(usersTable.hasActivePlan, true),
      gte(usersTable.createdAt, today0)
    )
  );

  let correctedCount = 0;
  for (const user of targets) {
    const balance = Number(user.balance);
    // 2.8571 is the value added by previous (800 / 280).toFixed(4)
    if (balance >= 2.85) {
      const correction = 2.8571;
      const newBalance = Math.max(0, balance - correction);
      const newEarnings = Math.max(0, Number(user.totalEarnings) - correction);

      await db.update(usersTable).set({
        balance: String(newBalance.toFixed(4)),
        totalEarnings: String(newEarnings.toFixed(4)),
      }).where(eq(usersTable.id, user.id));

      await db.insert(transactionsTable).values({
        userId: user.id,
        type: "admin_adjustment",
        amount: String((-correction).toFixed(4)),
        description: "Correction: Systematic error added $2.85 during activation",
        status: "completed",
      });
      correctedCount++;
    }
  }

  res.json({ success: true, message: `Corrected balances for ${correctedCount} users.` });
});

export default router;
