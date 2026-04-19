import { pgTable, text, serial, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", {
    enum: ["ad_earning", "referral_commission", "joining_bonus", "reward", "global_pool", "deposit", "withdrawal", "admin_adjustment"],
  }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 4 }).notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed", "approved", "rejected"] }).notNull().default("completed"),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTypeIdx: index("user_type_idx").on(table.userId, table.type),
}));

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
