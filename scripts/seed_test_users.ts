import { db, usersTable } from "../lib/db/src/index.js";
import crypto from "crypto";
import { eq, or } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET || "earnhub_secret";

function hashPassword(password: string): string {
  // Fixed logic to match the new auth.ts logic: password + (SECRET)
  return crypto.createHash("sha256").update(password + SECRET).digest("hex");
}

async function seed() {
  console.log("Cleaning up and re-seeding test users...");

  const emails = ["admin@elitestarx.com", "user@elitestarx.com"];

  try {
    // Delete existing users to ensure fresh hashes
    for (const email of emails) {
      await db.delete(usersTable).where(eq(usersTable.email, email));
    }
    console.log("Old users deleted.");

    // Admin
    const adminData = {
      username: "admin",
      email: "admin@elitestarx.com",
      password: "admin123",
      isAdmin: true
    };

    // Regular User
    const userData = {
      username: "testuser",
      email: "user@elitestarx.com",
      password: "user123",
      isAdmin: false
    };

    for (const u of [adminData, userData]) {
      const passwordHash = hashPassword(u.password);
      
      await db.insert(usersTable).values({
        username: u.username,
        email: u.email,
        passwordHash: passwordHash,
        referralCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
        isAdmin: u.isAdmin,
        balance: "0",
        totalEarnings: "0",
        totalWithdrawn: "0",
        referralCount: 0,
      }).onConflictDoNothing();
      
      console.log(`User ${u.username} created.`);
    }
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
