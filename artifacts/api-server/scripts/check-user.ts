import "dotenv/config";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const user = await db.select().from(usersTable).where(eq(usersTable.email, "hugnexus@gmail.com"));
  console.log("User fetched:", JSON.stringify(user, null, 2));
  process.exit(0);
}

main().catch(console.error);
