import { pgTable, serial, timestamp, integer, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const joiningBonusesTable = pgTable("joining_bonuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bonusDate: text("bonus_date").notNull(),
  joinsCount: integer("joins_count").notNull().default(0),
  bonusEarned: numeric("bonus_earned", { precision: 12, scale: 4 }).notNull().default("0"),
  milestone2Paid: integer("milestone2_paid").notNull().default(0),
  milestone4Paid: integer("milestone4_paid").notNull().default(0),
  milestone6Paid: integer("milestone6_paid").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJoiningBonusSchema = createInsertSchema(joiningBonusesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJoiningBonus = z.infer<typeof insertJoiningBonusSchema>;
export type JoiningBonus = typeof joiningBonusesTable.$inferSelect;
