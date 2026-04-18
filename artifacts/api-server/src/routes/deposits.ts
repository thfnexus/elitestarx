import { Router, type IRouter } from "express";
import { db, depositsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/deposits", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const deposits = await db.select().from(depositsTable)
    .where(eq(depositsTable.userId, user.id))
    .orderBy(desc(depositsTable.createdAt));

  res.json(deposits.map(d => ({
    id: d.id,
    method: d.method,
    amount: Number(d.amount),
    transactionRef: d.transactionRef,
    senderNumber: d.senderNumber || null,
    status: d.status,
    notes: d.notes || null,
    createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/deposits", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { method, amount, transactionRef, senderNumber, notes } = req.body;

  if (!method || !amount || !transactionRef) {
    res.status(400).json({ error: "method, amount, and transactionRef are required" });
    return;
  }

  if (!["jazzcash", "easypaisa", "bank_transfer"].includes(method)) {
    res.status(400).json({ error: "Invalid payment method" });
    return;
  }

  if (Number(amount) <= 0) {
    res.status(400).json({ error: "Amount must be greater than 0" });
    return;
  }

  const [deposit] = await db.insert(depositsTable).values({
    userId: user.id,
    method,
    amount: String(Number(amount).toFixed(4)),
    transactionRef,
    senderNumber: senderNumber || null,
    notes: notes || null,
    status: "pending",
  }).returning();

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "deposit",
    amount: String(Number(amount).toFixed(4)),
    description: `Deposit via ${method}: ref ${transactionRef}`,
    status: "pending",
    referenceId: deposit.id,
  });

  res.status(201).json({
    id: deposit.id,
    method: deposit.method,
    amount: Number(deposit.amount),
    transactionRef: deposit.transactionRef,
    senderNumber: deposit.senderNumber || null,
    status: deposit.status,
    notes: deposit.notes || null,
    createdAt: deposit.createdAt.toISOString(),
  });
});

export default router;
