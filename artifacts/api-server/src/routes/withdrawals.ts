import { Router, type IRouter } from "express";
import { db, withdrawalsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

const MIN_WITHDRAW = 1.0;
const FIRST_WITHDRAW_MIN = 0.5;

router.get("/withdrawals", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const withdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, user.id))
    .orderBy(desc(withdrawalsTable.createdAt));

  res.json(withdrawals.map(w => ({
    id: w.id,
    method: w.method,
    amount: Number(w.amount),
    accountNumber: w.accountNumber,
    accountName: w.accountName,
    status: w.status,
    notes: w.notes || null,
    createdAt: w.createdAt.toISOString(),
  })));
});

router.post("/withdrawals", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "Account blocked" });
    return;
  }

  const { method, amount, accountNumber, accountName } = req.body;

  if (!method || !amount || !accountNumber || !accountName) {
    res.status(400).json({ error: "method, amount, accountNumber, accountName are required" });
    return;
  }

  if (!["jazzcash", "easypaisa", "bank_transfer"].includes(method)) {
    res.status(400).json({ error: "Invalid payment method" });
    return;
  }

  const requestedAmount = Number(amount);

  const existingWithdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, user.id));

  const isFirstWithdraw = existingWithdrawals.length === 0;

  if (isFirstWithdraw) {
    if (requestedAmount < FIRST_WITHDRAW_MIN) {
      res.status(400).json({ error: `First withdrawal minimum is $${FIRST_WITHDRAW_MIN}` });
      return;
    }
  } else {
    if (requestedAmount < MIN_WITHDRAW) {
      res.status(400).json({ error: `Minimum withdrawal is $${MIN_WITHDRAW}` });
      return;
    }
  }

  if (requestedAmount > Number(user.balance)) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(usersTable).set({
    balance: String(Number(user.balance) - requestedAmount),
  }).where(eq(usersTable.id, user.id));

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId: user.id,
    method,
    amount: String(requestedAmount.toFixed(4)),
    accountNumber,
    accountName,
    status: "pending",
    isFirstWithdraw: isFirstWithdraw ? 1 : 0,
  }).returning();

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "withdrawal",
    amount: String((-requestedAmount).toFixed(4)),
    description: `Withdrawal request via ${method}`,
    status: "pending",
    referenceId: withdrawal.id,
  });

  res.status(201).json({
    id: withdrawal.id,
    method: withdrawal.method,
    amount: Number(withdrawal.amount),
    accountNumber: withdrawal.accountNumber,
    accountName: withdrawal.accountName,
    status: withdrawal.status,
    notes: withdrawal.notes || null,
    createdAt: withdrawal.createdAt.toISOString(),
  });
});

router.get("/withdrawals/live-feed", async (_req, res): Promise<void> => {
  const recentWithdrawals = await db.select().from(withdrawalsTable)
    .orderBy(desc(withdrawalsTable.reviewedAt))
    .limit(20);

  const approved = recentWithdrawals.filter(w => w.status === "approved" && w.reviewedAt);

  const result = await Promise.all(approved.map(async w => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId));
    return {
      id: w.id,
      username: user?.username || "User",
      amount: Number(w.amount),
      method: w.method,
      approvedAt: w.reviewedAt!.toISOString(),
    };
  }));

  res.json(result);
});

export default router;
