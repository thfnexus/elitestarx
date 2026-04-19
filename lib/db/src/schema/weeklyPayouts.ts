import { pgTable, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const weeklyPayoutsTable = pgTable("weekly_payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  weekStartDate: timestamp("week_start_date", { withTimezone: true }).notNull(),
  weekEndDate: timestamp("week_end_date", { withTimezone: true }).notNull(),
  referralCount: integer("referral_count").notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
