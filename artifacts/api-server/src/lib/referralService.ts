import { db, usersTable, referralsTable, transactionsTable, joiningBonusesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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
      description: `Level ${level} referral commission`,
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
        description: `Daily joining bonus: ${b.milestone} referrals today`,
        status: "completed",
      });

      logger.info({ userId, milestone: b.milestone, amount: b.amount }, "Joining bonus paid");
    }
  }
}
