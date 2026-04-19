import "dotenv/config";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Removing admin rights from all users...");
  await db.update(usersTable).set({ isAdmin: false, hasActivePlan: false });

  console.log("Setting hugnexus@gmail.com as the only admin...");
  const result = await db.update(usersTable)
    .set({ isAdmin: true, hasActivePlan: true })
    .where(eq(usersTable.email, "hugnexus@gmail.com"))
    .returning();

  if (result.length > 0) {
    console.log("Success! Admin user:", result[0].email, "isAdmin:", result[0].isAdmin);
  } else {
    console.log("Error: User hugnexus@gmail.com not found in the database. Please register this email first.");
  }
  process.exit(0);
}

main().catch(console.error);
