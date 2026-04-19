import { db, usersTable, referralsTable, transactionsTable, joiningBonusesTable, settingsTable, weeklyPayoutsTable } from "@workspace/db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { logger } from "./logger";

const REFERRAL_COMMISSIONS = [0.54, 0.29, 0.14, 0.07, 0.04];
const JOINING_BONUS_MILESTONES = [
  { joins: 2, bonus: 1.0 },
  { joins: 4, bonus: 1.0 },
  { joins: 6, bonus: 2.0 },
];

export async function processReferralCommissions(newUserId: number, uplinerId: number): Promise<void> {
  let currentId: number | null = uplinerId;
  let level = 1;

  while (currentId && level <= 5) {
    const [upliner] = await db.select().from(usersTable).where(eq(usersTable.id, currentId));
    if (!upliner) break;

    const commission = REFERRAL_COMMISSIONS[level - 1];

    await db.insert(referralsTable).values({
      referrerId: currentId,
      referredId: newUserId,
      level,
      commission: String(commission),
    });

    await db.update(usersTable).set({
      balance: String(Number(upliner.balance) + commission),
      totalEarnings: String(Number(upliner.totalEarnings) + commission),
    }).where(eq(usersTable.id, currentId));

    await db.insert(transactionsTable).values({
      userId: currentId,
      type: "referral_commission",
      amount: String(commission),
      description: `Referral Commission (Level ${level})`,
      status: "completed",
    });

    currentId = upliner.uplinerId;
    level++;
  }
}

export async function processDailyJoiningBonus(uplinerId: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const [upliner] = await db.select().from(usersTable).where(eq(usersTable.id, uplinerId));
  if (!upliner) return;

  const [existing] = await db.select().from(joiningBonusesTable).where(
    and(eq(joiningBonusesTable.userId, uplinerId), eq(joiningBonusesTable.bonusDate, today))
  );

  if (!existing) {
    const [created] = await db.insert(joiningBonusesTable).values({
      userId: uplinerId,
      bonusDate: today,
      joinsCount: 1,
      bonusEarned: "0",
      milestone2Paid: 0,
      milestone4Paid: 0,
      milestone6Paid: 0,
    }).returning();

    await checkJoiningBonusMilestones(uplinerId, created, upliner);
  } else {
    const newCount = existing.joinsCount + 1;
    const [updated] = await db.update(joiningBonusesTable)
      .set({ joinsCount: newCount })
      .where(eq(joiningBonusesTable.id, existing.id))
      .returning();

    await checkJoiningBonusMilestones(uplinerId, updated, upliner);
  }
}

async function checkJoiningBonusMilestones(
  userId: number,
  bonus: { joinsCount: number; milestone2Paid: number; milestone4Paid: number; milestone6Paid: number },
  upliner: { balance: string; totalEarnings: string }
): Promise<void> {
  const bonuses: { milestone: number; paid: number; key: keyof typeof bonus; amount: number }[] = [
    { milestone: 2, paid: bonus.milestone2Paid, key: "milestone2Paid", amount: 1.0 },
    { milestone: 4, paid: bonus.milestone4Paid, key: "milestone4Paid", amount: 1.0 },
    { milestone: 6, paid: bonus.milestone6Paid, key: "milestone6Paid", amount: 2.0 },
  ];

  for (const b of bonuses) {
    if (bonus.joinsCount >= b.milestone && !b.paid) {
      await db.update(joiningBonusesTable).set({ [b.key]: 1 }).where(
        and(eq(joiningBonusesTable.userId, userId), eq(joiningBonusesTable.bonusDate, new Date().toISOString().split("T")[0]))
      );

      await db.update(usersTable).set({
        balance: String(Number(upliner.balance) + b.amount),
        totalEarnings: String(Number(upliner.totalEarnings) + b.amount),
      }).where(eq(usersTable.id, userId));

      await db.insert(transactionsTable).values({
        userId,
        type: "joining_bonus",
        amount: String(b.amount),
        description: `Daily Joining Bonus: ${b.milestone} Joins reached`,
        status: "completed",
      });

      logger.info({ userId, milestone: b.milestone, amount: b.amount }, "Joining bonus paid");
    }
  }
}

export async function processWeeklyPayouts(): Promise<void> {
  try {
    const today = new Date();
    // Monday is the first day of our payout week check (since we payout at Sunday 00:00 or after)
    // Actually, we want to payout for the week that JUST ended on Sunday.
    
    // Check settings for the last payout date
    const [lastPayout] = await db.select().from(settingsTable).where(eq(settingsTable.key, "last_weekly_payout_date"));
    const lastPayoutDate = lastPayout ? new Date(lastPayout.value) : new Date(0);
    
    // Find the most recent Sunday (00:00:00) that has passed
    const lastSunday = new Date();
    lastSunday.setHours(0, 0, 0, 0);
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());

    // If we haven't paid out for this Sunday yet
    if (lastSunday > lastPayoutDate) {
      logger.info({ lastSunday, lastPayoutDate }, "Starting automated weekly payout process");

      // We want to pay for the week BEFORE this Sunday
      const weekStart = new Date(lastSunday);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEnd = lastSunday;

      // Get the rate
      const [rateMatch] = await db.select().from(settingsTable).where(eq(settingsTable.key, "weekly_referral_rate"));
      const rate = rateMatch ? Number(rateMatch.value) : 0.18; // User requested $0.18

      // Find all users who had direct referrals in that week
      const weeklyReferrers = await db.select({
        referrerId: referralsTable.referrerId,
        count: sql<number>`count(${referralsTable.id})`,
      })
      .from(referralsTable)
      .where(and(
        eq(referralsTable.level, 1),
        gte(referralsTable.createdAt, weekStart),
        lt(referralsTable.createdAt, weekEnd)
      ))
      .groupBy(referralsTable.referrerId);

      for (const group of weeklyReferrers) {
        const bonusAmount = group.count * rate;
        if (bonusAmount <= 0) continue;

        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, group.referrerId));
        if (!user) continue;

        // Credit user balance
        await db.update(usersTable).set({
          balance: String(Number(user.balance) + bonusAmount),
          totalEarnings: String(Number(user.totalEarnings) + bonusAmount),
        }).where(eq(usersTable.id, group.referrerId));

        // Record transaction
        await db.insert(transactionsTable).values({
          userId: group.referrerId,
          type: "referral_commission",
          amount: String(bonusAmount.toFixed(4)),
          description: `Weekly Referral Bonus (${group.count} joins @ $${rate})`,
          status: "completed",
        });

        // Record payout history
        await db.insert(weeklyPayoutsTable).values({
          userId: group.referrerId,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          referralCount: group.count,
          amountPaid: String(bonusAmount.toFixed(4)),
        });

        logger.info({ userId: group.referrerId, amount: bonusAmount, refs: group.count }, "Weekly payout completed for user");
      }

      // Update last payout date
      await db.insert(settingsTable)
        .values({ key: "last_weekly_payout_date", value: lastSunday.toISOString() })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: lastSunday.toISOString(), updatedAt: new Date() } });

      logger.info("Weekly payout process finished");
    }
  } catch (err) {
    logger.error({ err }, "Failed to process weekly payouts");
  }
}

export async function ensureDefaultSettings(): Promise<void> {
  const defaults = [
    { key: "weekly_referral_rate", value: "0.18" },
    { key: "ad_link", value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { key: "min_withdrawal", value: "5.0" },
  ];

  for (const { key, value } of defaults) {
    const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    if (!existing) {
      await db.insert(settingsTable).values({ key, value });
    }
  }
}
