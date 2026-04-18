import { Router, type IRouter } from "express";
import { db, usersTable, depositsTable, withdrawalsTable, transactionsTable, globalPoolTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

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

  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    balance: Number(u.balance),
    totalEarnings: Number(u.totalEarnings),
    referralCount: u.referralCount,
    isBlocked: u.isBlocked,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt.toISOString(),
  })));
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
      await db.update(usersTable).set({
        balance: String(Number(user.balance) + Number(deposit.amount)),
        totalEarnings: String(Number(user.totalEarnings) + Number(deposit.amount)),
      }).where(eq(usersTable.id, deposit.userId));

      await db.update(transactionsTable).set({ status: "completed" })
        .where(eq(transactionsTable.referenceId, id));
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

export default router;
