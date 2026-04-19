import { Router, type IRouter } from "express";
import { db, usersTable, globalPoolTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateReferralCode, generateToken, getAuthUser } from "../lib/auth";
import { processReferralCommissions, processDailyJoiningBonus } from "../lib/referralService";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, email, password, referralCode, whatsappNumber } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email and password are required" });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  let uplinerId: number | undefined;
  if (referralCode) {
    const [upliner] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
    if (!upliner) {
      res.status(400).json({ error: "Invalid referral code" });
      return;
    }
    uplinerId = upliner.id;
  }

  const uniqueCode = generateReferralCode();
  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash: hashPassword(password),
    referralCode: uniqueCode,
    uplinerId,
    whatsappNumber,
    balance: "0",
    totalEarnings: "0",
    totalWithdrawn: "0",
    referralCount: 0,
  }).returning();

  // Upliner processing removed from registration. 
  // Referral counts and commissions will now be handled upon account activation (deposit approval).
  
  // Global pool completely removed per user request
  const token = generateToken(user.id);

  const [uplinerUser] = uplinerId
    ? await db.select().from(usersTable).where(eq(usersTable.id, uplinerId))
    : [null];

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      referralCode: user.referralCode,
      uplinerName: uplinerUser?.username || null,
      balance: Number(user.balance),
      totalEarnings: Number(user.totalEarnings),
      totalWithdrawn: Number(user.totalWithdrawn),
      referralCount: user.referralCount,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      hasActivePlan: user.hasActivePlan,
      whatsappNumber: user.whatsappNumber,
      profileImage: user.profileImage,
      level: user.level,
      xp: user.xp,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "Your account has been blocked. Contact support." });
    return;
  }

  const token = generateToken(user.id);

  let uplinerName: string | null = null;
  if (user.uplinerId) {
    const [upliner] = await db.select().from(usersTable).where(eq(usersTable.id, user.uplinerId));
    uplinerName = upliner?.username || null;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      referralCode: user.referralCode,
      uplinerName,
      balance: Number(user.balance),
      totalEarnings: Number(user.totalEarnings),
      totalWithdrawn: Number(user.totalWithdrawn),
      referralCount: user.referralCount,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      hasActivePlan: user.hasActivePlan,
      whatsappNumber: user.whatsappNumber,
      profileImage: user.profileImage,
      level: user.level,
      xp: user.xp,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let uplinerName: string | null = null;
  if (user.uplinerId) {
    const [upliner] = await db.select().from(usersTable).where(eq(usersTable.id, user.uplinerId));
    uplinerName = upliner?.username || null;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    referralCode: user.referralCode,
    uplinerName,
    balance: Number(user.balance),
    totalEarnings: Number(user.totalEarnings),
    totalWithdrawn: Number(user.totalWithdrawn),
    referralCount: user.referralCount,
    isAdmin: user.isAdmin,
    isBlocked: user.isBlocked,
    hasActivePlan: user.hasActivePlan,
    whatsappNumber: user.whatsappNumber,
    profileImage: user.profileImage,
    level: user.level,
    xp: user.xp,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
