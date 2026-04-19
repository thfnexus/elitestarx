import "dotenv/config";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating balance to $30 for hugnexus@gmail.com...");
  const result = await db.update(usersTable)
    .set({ balance: "30.00" })
    .where(eq(usersTable.email, "hugnexus@gmail.com"))
    .returning();

  if (result.length > 0) {
    console.log("Success! Admin user balance updated to $30.");
  } else {
    console.log("User not found.");
  }
  process.exit(0);
}

main().catch(console.error);
