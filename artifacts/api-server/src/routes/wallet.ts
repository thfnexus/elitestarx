import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/wallet/transactions", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const transactions = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt));

  res.json(transactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  })));
});

export default router;
