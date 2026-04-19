import { db, usersTable } from "../lib/db/src/index.js";
import { eq } from "drizzle-orm";

async function main() {
  const users = await db.select().from(usersTable);
  console.log("Current balances:");
  users.forEach(u => console.log(`${u.username}: $${u.balance} (Total: $${u.totalEarnings})`));

  console.log("Resetting balances...");
  // Reset all balances
  await db.update(usersTable).set({
    balance: "0",
    totalEarnings: "0"
  });

  const usersAfter = await db.select().from(usersTable);
  console.log("Balances after reset:");
  usersAfter.forEach(u => console.log(`${u.username}: $${u.balance} (Total: $${u.totalEarnings})`));

  process.exit(0);
}

main();
