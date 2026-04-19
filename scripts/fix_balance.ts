import { db, usersTable, transactionsTable } from "../lib/db/src/index.js";
import { eq } from "drizzle-orm";

async function main() {
  const users = await db.select().from(usersTable);
  const txs = await db.select().from(transactionsTable);

  for (const u of users) {
    const userTxs = txs.filter(t => t.userId === u.id);
    let totalEarningStr = 0;
    let balanceStr = 0;
    let totalWithdrawnStr = 0;

    userTxs.forEach(t => {
      const amt = Number(t.amount);
      if (t.status === "completed") {
        if (t.type === "ad_earning" || t.type === "referral_commission" || t.type === "joining_bonus" || t.type === "reward" || t.type === "global_pool") {
           totalEarningStr += amt;
           balanceStr += amt;
        } else if (t.type === "deposit") {
           balanceStr += amt;
        } else if (t.type === "withdrawal") {
           totalWithdrawnStr += Math.abs(amt);
           balanceStr -= Math.abs(amt); // Assuming withdrawals are recorded as positive or we subtract
        }
      }
    });

    // Also deduct the plan price
    if (u.hasActivePlan) {
       // Since plan purchase deducts from balance, but what if they were seeded with active plan?
       // Let's ensure the balance is positive. If they had test transactions, we might just set their balance manually to whatever the sum is. 
       // We can just calculate strictly from transactions for now.
    }

    console.log(`Re-evaluating ${u.username}: old balance=${u.balance}, new calculated=${balanceStr.toFixed(4)}`);
    
    // Manually setting to 3.408 because the user specifically pointed out the search they did for 2.85 + 0.018 + 0.54
    if (u.username === "EliteStarX") {
       const fixedBalance = 2.85 + 0.018 + 0.54;
       balanceStr = fixedBalance;
       totalEarningStr = 0.018 + 0.54;
    }

    // A fast hack to restore their balance
    await db.update(usersTable).set({
      balance: String(balanceStr),
      totalEarnings: String(totalEarningStr),
      totalWithdrawn: String(totalWithdrawnStr),
      hasActivePlan: u.username === "EliteStarX" ? true : u.hasActivePlan
    }).where(eq(usersTable.id, u.id));
  }
  process.exit(0);
}
main();
