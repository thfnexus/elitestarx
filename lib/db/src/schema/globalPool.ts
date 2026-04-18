import { pgTable, serial, timestamp, integer, numeric, boolean, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const globalPoolTable = pgTable("global_pool", {
  id: serial("id").primaryKey(),
  balance: numeric("balance", { precision: 12, scale: 4 }).notNull().default("0"),
  totalContributed: numeric("total_contributed", { precision: 12, scale: 4 }).notNull().default("0"),
  lastDistributedAt: timestamp("last_distributed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const globalPoolDistributionsTable = pgTable("global_pool_distributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 4 }).notNull(),
  distributedAt: timestamp("distributed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGlobalPoolSchema = createInsertSchema(globalPoolTable).omit({ id: true, createdAt: true });
export type InsertGlobalPool = z.infer<typeof insertGlobalPoolSchema>;
export type GlobalPool = typeof globalPoolTable.$inferSelect;
