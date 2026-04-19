import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";

const router: IRouter = Router();

// Default plan price if not found in settings
const DEFAULT_PLAN_PRICE = "2.85";

/** 
 * Note: Manual plan purchase via balance is now deprecated.
 * Account activation is now handled automatically when an admin approves an activation fee deposit.
 */
router.post("/plans/buy", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (user.hasActivePlan) {
    res.status(400).json({ error: "Plan already active" });
    return;
  }

  // Fetch plan price from settings or use default
  const [priceSetting] = await db.select().from(settingsTable).where(eq(settingsTable.key, "plan_price_usd"));
  const planPrice = priceSetting ? priceSetting.value : DEFAULT_PLAN_PRICE;

  const cost = Number(planPrice);
  const currentBalance = Number(user.balance);

  if (currentBalance < cost) {
    res.status(400).json({ error: `Insufficient balance. Plan cost is $${cost.toFixed(2)}` });
    return;
  }

  try {
    // 1. Deduct balance
    await db.update(usersTable).set({
      balance: String((currentBalance - cost).toFixed(4)),
      hasActivePlan: true
    }).where(eq(usersTable.id, user.id));

    // 2. Create transaction
    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "admin_adjustment", // or specialized 'plan_purchase'
      amount: String((-cost).toFixed(4)),
      description: "Elite Starter Plan Purchase",
      status: "completed",
    });

    res.json({ success: true, message: "Elite Starter Plan purchased successfully!" });
  } catch (err) {
    console.error("Plan purchase failed:", err);
    res.status(500).json({ error: "Internal server error during purchase" });
  }
});

export default router;
